import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { getApiUrl } from "@/lib/api";
import { useLessonStreamVideo } from "@/components/stream-video-provider";
import { useLessonProgressStore } from "@/store/lesson-progress-store";
import { posthog } from "@/config/posthog";
import type { LanguageCode, Lesson } from "@/types/learning";
import { useAuth } from "@clerk/expo";
import { Stack, useIsFocused } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LessonCallStatus = "idle" | "creating" | "connecting" | "joined" | "ended" | "error";
type AgentConnectionStatus = "idle" | "connecting" | "connected" | "failed";

type LessonCallResponse = {
  apiKey: string;
  callId: string;
  callType: string;
  languageId: LanguageCode;
  lessonId: string;
  token: string;
  userId: string;
  userImage?: string;
  userName: string;
};

type AgentSessionResponse = {
  callId: string;
  sessionId: string;
  sessionStartedAt: string;
};

type ApiErrorBody = {
  error?: unknown;
};

type AgentSession = Pick<LessonCallResponse, "callId" | "callType" | "languageId" | "lessonId"> & {
  sessionId: string;
};

type LessonCall = import("@stream-io/video-react-native-sdk").Call;
type ParticipantViewComponent = React.ComponentType<
  import("@stream-io/video-react-native-sdk").ParticipantViewProps
>;
type StreamVideoParticipant = import("@stream-io/video-react-native-sdk").StreamVideoParticipant;
type CallClosedCaption = import("@stream-io/video-react-native-sdk").CallClosedCaption;
type CustomVideoEvent = import("@stream-io/video-react-native-sdk").CustomVideoEvent;

type DisplayedCaption = {
  id: string;
  speakerId: string;
  text: string;
};

const aiTeacherAgentUserId = "ai-language-teacher";

const pendingLessonJoins = new Map<string, Promise<void>>();
const activeAgentSessionsByCall = new Map<string, AgentSession>();

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getLessonJoinKey(callInfo: Pick<LessonCallResponse, "callId" | "callType">) {
  return `${callInfo.callType}:${callInfo.callId}`;
}

function getAgentSessionKey(session: Pick<AgentSession, "callId" | "callType">) {
  return `${session.callType}:${session.callId}`;
}

function waitForJoiningCall(nextCall: LessonCall) {
  return new Promise<boolean>((resolve) => {
    let attempt = 0;

    const checkState = () => {
      if (nextCall.state.callingState === "joined") {
        resolve(true);
        return;
      }

      if (nextCall.state.callingState !== "joining" || attempt >= 40) {
        resolve(false);
        return;
      }

      attempt += 1;
      setTimeout(checkState, 250);
    };

    checkState();
  });
}

async function joinLessonCallOnce(joinKey: string, nextCall: LessonCall) {
  const callingState = nextCall.state.callingState;

  if (callingState === "joined") {
    return true;
  }

  const pendingJoin = pendingLessonJoins.get(joinKey);

  if (pendingJoin) {
    await pendingJoin;
    return nextCall.state.callingState === "joined";
  }

  if (callingState === "joining") {
    return waitForJoiningCall(nextCall);
  }

  const joinPromise = withTimeout(
    Promise.resolve().then(() => nextCall.join({ maxJoinRetries: 1 })),
    15000,
    "Stream audio timed out while joining the lesson call.",
  );

  pendingLessonJoins.set(joinKey, joinPromise);

  try {
    await joinPromise;
  } finally {
    if (pendingLessonJoins.get(joinKey) === joinPromise) {
      pendingLessonJoins.delete(joinKey);
    }
  }

  return nextCall.state.callingState === "joined";
}

async function joinLessonCallWithRetry(joinKey: string, nextCall: LessonCall) {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const hasJoined = await joinLessonCallOnce(joinKey, nextCall);

    if (hasJoined) {
      return;
    }

    const callingState = String(nextCall.state.callingState);

    if (attempt === maxAttempts) {
      throw new Error(`Stream audio did not finish joining. Current state: ${callingState}.`);
    }

    console.warn("Stream lesson call did not join, retrying", {
      attempt,
      callingState,
      joinKey,
    });

    if (!isLessonCallLeft(nextCall)) {
      await leaveLessonCall(nextCall);
    }

    await wait(400);
  }
}

function isLessonCallLeft(nextCall: LessonCall) {
  return String(nextCall.state.callingState).toLowerCase() === "left";
}

function isSafeLeaveError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  return (
    (lowerMessage.includes("already") && lowerMessage.includes("left")) ||
    lowerMessage.includes("not joined") ||
    lowerMessage.includes("has not been joined")
  );
}

async function leaveLessonCall(nextCall: LessonCall | undefined) {
  if (!nextCall || isLessonCallLeft(nextCall)) {
    return;
  }

  try {
    await nextCall.leave();
  } catch (error) {
    if (!isSafeLeaveError(error)) {
      throw error;
    }
  }
}

async function getApiErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

  return typeof body?.error === "string" && body.error.trim() ? body.error : fallback;
}

type AudioLessonCallProps = {
  lesson: Lesson | undefined;
  onBackPress?: () => void;
  selectedLanguageId?: LanguageCode | null;
};

export function AudioLessonCall({ lesson, onBackPress, selectedLanguageId }: AudioLessonCallProps) {
  const { getToken } = useAuth();
  const {
    canUseNativeSdk,
    client,
    connectClient,
    errorMessage: streamErrorMessage,
    isLoading: isStreamLoading,
    ParticipantView,
    callManager,
    StreamCall,
  } = useLessonStreamVideo();
  const isFocused = useIsFocused();
  const activeLanguageId = lesson?.languageId ?? selectedLanguageId;
  const language = languages.find((item) => item.id === activeLanguageId);
  const handleBackPress = onBackPress ?? (() => {});
  const [call, setCall] = useState<LessonCall>();
  const [callStatus, setCallStatus] = useState<LessonCallStatus>("idle");
  const [isHoldingToTalk, setIsHoldingToTalk] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentConnectionStatus>("idle");
  const [agentErrorMessage, setAgentErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const completeLesson = useLessonProgressStore((state) => state.completeLesson);
  const activeAgentSession = useRef<AgentSession | null>(null);
  const autoJoinLessonId = useRef<string | null>(null);
  const callRef = useRef<LessonCall | undefined>(undefined);
  const isMountedRef = useRef(true);
  const isLeavingAfterEndRef = useRef(false);
  const joinAttemptIdRef = useRef(0);
  const isHoldingToTalkRef = useRef(false);
  const hasCompletedLessonRef = useRef(false);
  const hasTrackedAbandonmentRef = useRef(false);
  const lastQuestionIndexRef = useRef(0);
  const lessonStartedAtRef = useRef<number | null>(null);
  const stopAgentSessionRef = useRef<(session: AgentSession) => Promise<void>>(async () => {});

  const isBusy = callStatus === "connecting";
  const isJoined = callStatus === "joined";
  const isConnectingLesson = isStreamLoading || callStatus === "connecting";
  const agentStatusLabel = useMemo(() => {
    if (agentStatus === "connecting") return "AI teacher connecting";
    if (agentStatus === "connected") return "AI teacher connected";
    if (agentStatus === "failed") return agentErrorMessage ?? "AI teacher failed";

    return "AI teacher idle";
  }, [agentErrorMessage, agentStatus]);
  const agentStatusDotColor =
    agentStatus === "connected"
      ? "#37D878"
      : agentStatus === "connecting"
        ? "#F7B731"
        : agentStatus === "failed"
          ? "#FF4B4B"
          : "#C8CAD3";

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  useEffect(() => {
    if (!lesson || !language) return;

    lessonStartedAtRef.current = Date.now();
    hasCompletedLessonRef.current = false;
    hasTrackedAbandonmentRef.current = false;
    lastQuestionIndexRef.current = 0;

    posthog.capture("lesson_started", {
      language: language.id,
      lesson_id: lesson.id,
      lesson_number: lesson.order,
    });

    return () => {
      if (hasCompletedLessonRef.current || hasTrackedAbandonmentRef.current) return;

      hasTrackedAbandonmentRef.current = true;
      const startedAt = lessonStartedAtRef.current ?? Date.now();

      posthog.capture("lesson_abandoned", {
        last_question_index: lastQuestionIndexRef.current,
        lesson_id: lesson.id,
        time_into_lesson_seconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      });
    };
  }, [language, lesson]);

  useEffect(() => {
    if (isFocused) {
      isLeavingAfterEndRef.current = false;
    }
  }, [isFocused]);

  useEffect(() => {
    if (!callManager || !isJoined) {
      return;
    }

    callManager.start({ audioRole: "communicator", deviceEndpointType: "speaker" });
    callManager.speaker.setForceSpeakerphoneOn(true);

    return () => {
      callManager.speaker.setForceSpeakerphoneOn(false);
      callManager.stop();
    };
  }, [callManager, isJoined]);

  const stopAgentSession = useCallback(
    async (session: AgentSession) => {
      const sessionKey = getAgentSessionKey(session);

      try {
        const clerkToken = await getToken();

        if (!clerkToken) return;

        await fetchWithTimeout(getApiUrl("/api/vision-agent/stop"), {
          body: JSON.stringify(session),
          headers: {
            Authorization: `Bearer ${clerkToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        });
      } catch (error) {
        console.warn("Unable to stop AI teacher session", error);
      } finally {
        if (activeAgentSessionsByCall.get(sessionKey)?.sessionId === session.sessionId) {
          activeAgentSessionsByCall.delete(sessionKey);
        }
      }
    },
    [getToken],
  );

  useEffect(() => {
    stopAgentSessionRef.current = stopAgentSession;
  }, [stopAgentSession]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      const activeCall = callRef.current;
      const activeSession = activeAgentSession.current;

      if (activeSession) {
        activeAgentSession.current = null;
        void stopAgentSessionRef.current(activeSession);
      }

      void leaveLessonCall(activeCall);
    };
  }, []);

  const createLessonCallSession = useCallback(async () => {
    if (!lesson || !language) {
      throw new Error("Choose a lesson before starting a call.");
    }

    const clerkToken = await getToken();

    if (!clerkToken) {
      throw new Error("Sign in again to start this lesson call.");
    }

    const response = await fetchWithTimeout(getApiUrl("/api/stream/lesson-call"), {
      body: JSON.stringify({
        languageId: language.id,
        lessonId: lesson.id,
      }),
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const message = await getApiErrorMessage(
        response,
        "Unable to create this Stream lesson call.",
      );

      throw new Error(message);
    }

    return response.json() as Promise<LessonCallResponse>;
  }, [getToken, language, lesson]);

  const startAgentSession = useCallback(
    async (callInfo: LessonCallResponse, nextCall: LessonCall) => {
      const sessionBody = {
        callId: callInfo.callId,
        callType: callInfo.callType,
        languageId: callInfo.languageId,
        lessonId: callInfo.lessonId,
      };
      const sessionKey = getAgentSessionKey(sessionBody);

      setAgentStatus("connecting");
      setAgentErrorMessage(null);

      try {
        const existingSession = activeAgentSessionsByCall.get(sessionKey);

        if (existingSession) {
          activeAgentSessionsByCall.delete(sessionKey);
          await stopAgentSession(existingSession);
        }

        const clerkToken = await getToken();

        if (!clerkToken) {
          throw new Error("Sign in again to connect the AI teacher.");
        }

        const response = await fetchWithTimeout(getApiUrl("/api/vision-agent/start"), {
          body: JSON.stringify(sessionBody),
          headers: {
            Authorization: `Bearer ${clerkToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        }, 20000);

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            "AI teacher could not join this lesson.",
          );

          throw new Error(message);
        }

        const agentSession = (await response.json()) as AgentSessionResponse;
        const activeSession = {
          ...sessionBody,
          sessionId: agentSession.sessionId,
        };

        if (!isMountedRef.current || isLeavingAfterEndRef.current || isLessonCallLeft(nextCall)) {
          await stopAgentSession(activeSession);
          return;
        }

        activeAgentSessionsByCall.set(sessionKey, activeSession);
        activeAgentSession.current = activeSession;
      } catch (error) {
        if (!isMountedRef.current || isLeavingAfterEndRef.current) {
          return;
        }

        const message = error instanceof Error ? error.message : "AI teacher could not join.";

        setAgentErrorMessage(message);
        setAgentStatus("failed");
      }
    },
    [getToken, stopAgentSession],
  );

  const markAgentStartedSpeaking = useCallback(() => {
    if (!isMountedRef.current || isLeavingAfterEndRef.current) {
      return;
    }

    setAgentStatus((currentStatus) =>
      currentStatus === "connecting" ? "connected" : currentStatus,
    );
  }, []);

  const joinLessonCall = useCallback(async () => {
    const attemptId = joinAttemptIdRef.current + 1;
    joinAttemptIdRef.current = attemptId;
    isLeavingAfterEndRef.current = false;
    setErrorMessage(null);
    setAgentErrorMessage(null);
    setAgentStatus("idle");
    setCallStatus("connecting");

    try {
      const streamClient = client ?? (await connectClient());
      const callInfo = await createLessonCallSession();
      const joinKey = getLessonJoinKey(callInfo);
      const nextCall = streamClient.call(callInfo.callType, callInfo.callId);

      setCall(nextCall);
      setCallStatus("connecting");

      await joinLessonCallWithRetry(joinKey, nextCall);

      if (
        !isMountedRef.current ||
        isLeavingAfterEndRef.current ||
        joinAttemptIdRef.current !== attemptId
      ) {
        await leaveLessonCall(nextCall);
        return;
      }

      await nextCall.microphone.disable();
      setCallStatus("joined");
      await startAgentSession(callInfo, nextCall);
    } catch (error) {
      if (
        !isMountedRef.current ||
        isLeavingAfterEndRef.current ||
        joinAttemptIdRef.current !== attemptId
      ) {
        return;
      }

      const message = error instanceof Error ? error.message : "Unable to join lesson call.";

      setCall(undefined);
      setErrorMessage(message);
      setCallStatus("error");
    }
  }, [client, connectClient, createLessonCallSession, startAgentSession]);

  useEffect(() => {
    if (
      !isFocused ||
      isLeavingAfterEndRef.current ||
      !lesson ||
      !language ||
      !canUseNativeSdk ||
      isStreamLoading ||
      call ||
      isBusy ||
      isJoined
    ) {
      return;
    }

    const autoJoinKey = `${language.id}:${lesson.id}`;

    if (
      autoJoinLessonId.current === autoJoinKey &&
      callStatus !== "ended" &&
      callStatus !== "error"
    ) {
      return;
    }

    autoJoinLessonId.current = autoJoinKey;
    void joinLessonCall();
  }, [
    call,
    callStatus,
    canUseNativeSdk,
    isBusy,
    isFocused,
    isJoined,
    isStreamLoading,
    joinLessonCall,
    language,
    lesson,
  ]);

  async function startTalking() {
    if (!call || !isJoined || isHoldingToTalkRef.current) return;

    isHoldingToTalkRef.current = true;
    setIsHoldingToTalk(true);
    try {
      await call.microphone.enable();

      if (!isHoldingToTalkRef.current) {
        await call.microphone.disable();
        return;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update microphone.";

      isHoldingToTalkRef.current = false;
      setIsHoldingToTalk(false);
      setErrorMessage(message);
      setCallStatus("error");
    }
  }

  async function stopTalking() {
    if (!isHoldingToTalkRef.current) return;

    isHoldingToTalkRef.current = false;
    setIsHoldingToTalk(false);
    try {
      await call?.microphone.disable();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update microphone.";

      setErrorMessage(message);
      setCallStatus("error");
    }
  }

  async function endLessonCall() {
    const activeCall = callRef.current ?? call;
    const activeSession = activeAgentSession.current;
    const shouldCompleteLesson = Boolean(lesson) && callStatus === "joined";

    isLeavingAfterEndRef.current = true;
    isHoldingToTalkRef.current = false;
    joinAttemptIdRef.current += 1;

    try {
      if (activeSession) {
        activeAgentSession.current = null;
        await stopAgentSession(activeSession);
      }

      await leaveLessonCall(activeCall);
    } catch (error) {
      console.warn("Unable to fully leave lesson call", error);
    } finally {
      callRef.current = undefined;
      setCall(undefined);
      setIsHoldingToTalk(false);
      setAgentStatus("idle");
      setCallStatus("ended");
    }

    if (shouldCompleteLesson && lesson) {
      hasCompletedLessonRef.current = true;
      completeLesson(lesson.id, lesson.xpReward);
    }

    handleBackPress();
  }

  function handleExitPress() {
    if (callRef.current || activeAgentSession.current || callStatus === "connecting" || isJoined) {
      void endLessonCall();
      return;
    }

    handleBackPress();
  }

  if (!lesson || !language) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "AI Teacher" }} />
        <View className="flex-1 items-center justify-center gap-[16px] px-[28px]">
          <Text className="text-center font-poppins-semibold text-[24px] leading-[31px] text-[#07112F]">
            Lesson not found
          </Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleBackPress}
            style={styles.backToLessonsButton}
          >
            <Text className="font-poppins-semibold text-[17px] leading-[23px] text-white">
              Back to lessons
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const screen = (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "AI Teacher" }} />

      <View className="flex-1 bg-white px-[10px] pb-[8px] pt-[2px]">
        <RemoteAudioSubscriber
          call={call}
          onTeacherStartedSpeaking={markAgentStartedSpeaking}
          ParticipantView={ParticipantView}
        />

        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Back to lessons"
            activeOpacity={0.74}
            onPress={handleExitPress}
            style={styles.headerBackButton}
          >
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[30px] text-[#07112F]">‹</Text>}
              name={{ android: "arrow_back", ios: "chevron.left" }}
              size={31}
              tintColor="#07112F"
              weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
            />
          </TouchableOpacity>

          <Text
            className="font-poppins-semibold text-[19px] leading-[25px] text-[#07112F]"
            numberOfLines={1}
            style={styles.headerTitle}
          >
            AI Teacher
          </Text>

          <TouchableOpacity
            accessibilityLabel="End call"
            activeOpacity={0.78}
            disabled={!call && callStatus !== "joined"}
            onPress={() => void endLessonCall()}
            style={styles.headerEndCallButton}
          >
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[17px] text-white">×</Text>}
              name={{ android: "call_end", ios: "phone.down.fill" }}
              size={21}
              tintColor="#FFFFFF"
              weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-[8px] px-[6px] pb-[16px]">
          <View
            className="h-[10px] w-[10px] rounded-full"
            style={{ backgroundColor: agentStatusDotColor }}
          />
          <Text
            className="flex-1 font-poppins-semibold text-[15px] leading-[20px] text-[#85858D]"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {agentStatusLabel}
          </Text>
        </View>

        <View style={styles.teacherStage}>
          <View style={styles.mascotFrame}>
            <Image
              resizeMode="contain"
              source={images.mascotWelcomeTransparent}
              style={styles.mascotImage}
            />
          </View>

          <LiveCaptions
            call={call}
            placeholderText={
              streamErrorMessage ??
              errorMessage ??
              (isConnectingLesson
                ? "Connecting to your teacher..."
                : "Live transcript will appear here.")
            }
            teacherName={language.aiTeacherName}
          />
        </View>

        <View style={styles.pushToTalkContainer}>
          <TouchableOpacity
            accessibilityHint="Keep holding while you speak, then release when you finish"
            accessibilityLabel="Hold to talk"
            activeOpacity={1}
            disabled={!isJoined}
            onPressIn={() => void startTalking()}
            onPressOut={() => void stopTalking()}
            style={[
              styles.pushToTalkButton,
              isHoldingToTalk && styles.pushToTalkButtonActive,
              !isJoined && styles.disabledCallActionButton,
            ]}
          >
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[28px] text-white">●</Text>}
              name={{ android: "mic", ios: "mic.fill" }}
              size={35}
              tintColor="#FFFFFF"
              weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
            />
          </TouchableOpacity>
          <View className="items-center gap-[2px]">
            <Text className="font-poppins-semibold text-[16px] leading-[22px] text-[#07112F]">
              {isHoldingToTalk ? "Listening..." : "Push and hold to talk"}
            </Text>
            <Text className="font-poppins-medium text-[13px] leading-[18px] text-[#8B8C96]">
              {isHoldingToTalk ? "Release when you're finished" : "Your mic stays off until you hold"}
            </Text>
          </View>
        </View>

        <View style={styles.feedbackCard}>
          <FeedbackMetric label="Speaking" value="Excellent" valueColor="#31D780" />
          <View style={styles.feedbackDivider} />
          <FeedbackMetric label="Pronunciation" value="Great" valueColor="#68A5EA" />
          <View style={styles.feedbackDivider} />
          <FeedbackMetric label="Grammar" value="Good" valueColor="#7B61DD" />
        </View>
      </View>
    </SafeAreaView>
  );

  if (call && StreamCall) {
    return <StreamCall call={call}>{screen}</StreamCall>;
  }

  return screen;
}

type LiveCaptionsProps = {
  call: LessonCall | undefined;
  placeholderText: string;
  teacherName: string;
};

function LiveCaptions({ call, placeholderText, teacherName }: LiveCaptionsProps) {
  const [captions, setCaptions] = useState<DisplayedCaption[]>([]);
  const hasRealtimeCaptions = useRef(false);

  useEffect(() => {
    if (!call) {
      return;
    }

    call.updateClosedCaptionSettings({
      maxVisibleCaptions: 2,
      visibilityDurationMs: 5000,
    });

    const subscription = call.state.closedCaptions$.subscribe((nextCaptions) => {
      if (hasRealtimeCaptions.current) return;

      setCaptions(
        nextCaptions.map((caption: CallClosedCaption) => ({
          id: caption.id,
          speakerId: caption.speaker_id,
          text: caption.text,
        })),
      );
    });
    const unsubscribe = call.on("custom", (event: CustomVideoEvent) => {
      const custom = event.custom;

      if (
        custom.event_type !== "lesson.live_caption" ||
        typeof custom.caption_id !== "string" ||
        typeof custom.speaker_id !== "string" ||
        typeof custom.text !== "string"
      ) {
        return;
      }

      hasRealtimeCaptions.current = true;
      setCaptions((currentCaptions) => {
        const nextCaption: DisplayedCaption = {
          id: custom.caption_id,
          speakerId: custom.speaker_id,
          text: custom.text,
        };
        const existingIndex = currentCaptions.findIndex(
          (caption) => caption.id === nextCaption.id,
        );

        if (existingIndex === -1) {
          return [...currentCaptions, nextCaption].slice(-2);
        }

        return currentCaptions.map((caption, index) =>
          index === existingIndex ? nextCaption : caption,
        );
      });
    });

    return () => {
      unsubscribe();
      subscription.unsubscribe();
    };
  }, [call]);

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="summary"
      style={styles.transcriptTray}
    >
      {captions.length ? (
        captions.map((caption) => {
          const isTeacher = caption.speakerId === aiTeacherAgentUserId;
        const speakerName = isTeacher ? teacherName : "You";

          return (
            <View
              key={caption.id}
              style={[
                styles.transcriptBubble,
                isTeacher ? styles.teacherTranscriptBubble : styles.learnerTranscriptBubble,
              ]}
            >
              <Text
                className={`font-poppins-semibold text-[12px] leading-[17px] ${
                  isTeacher ? "text-[#7B61FF]" : "text-[#DCD6FF]"
                }`}
                numberOfLines={1}
              >
                {speakerName}
              </Text>
              <Text
                className={`font-poppins-medium text-[15px] leading-[21px] ${
                  isTeacher ? "text-[#07112F]" : "text-white"
                }`}
              >
                {caption.text}
              </Text>
            </View>
          );
        })
      ) : (
        <View style={[styles.transcriptBubble, styles.teacherTranscriptBubble]}>
          <Text className="font-poppins-semibold text-[12px] leading-[17px] text-[#7B61FF]">
            {teacherName}
          </Text>
          <Text
            className="font-poppins-medium text-[15px] leading-[21px] text-[#8B8C96]"
          >
            {placeholderText}
          </Text>
        </View>
      )}
    </View>
  );
}

type RemoteAudioSubscriberProps = {
  call: LessonCall | undefined;
  onTeacherStartedSpeaking: () => void;
  ParticipantView: ParticipantViewComponent | undefined;
};

function hasStartedSpeaking(participant: StreamVideoParticipant) {
  return participant.isSpeaking || participant.audioLevel > 0.01;
}

function RemoteAudioSubscriber({
  call,
  onTeacherStartedSpeaking,
  ParticipantView,
}: RemoteAudioSubscriberProps) {
  const [participants, setParticipants] = useState<StreamVideoParticipant[]>(
    () => call?.state.remoteParticipants ?? [],
  );

  useEffect(() => {
    if (!call) {
      return;
    }

    const subscription = call.state.remoteParticipants$.subscribe((nextParticipants) => {
      setParticipants(nextParticipants);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [call]);

  const teacherParticipant = participants.find(
    (participant) => participant.userId === aiTeacherAgentUserId,
  );

  useEffect(() => {
    if (teacherParticipant && hasStartedSpeaking(teacherParticipant)) {
      onTeacherStartedSpeaking();
    }
  }, [onTeacherStartedSpeaking, teacherParticipant]);

  if (!call || !ParticipantView || !teacherParticipant) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.remoteAudioSubscriber}>
      <ParticipantView
        participant={teacherParticipant}
        isVisible={false}
        ParticipantLabel={null}
        ParticipantNetworkQualityIndicator={null}
        ParticipantReaction={null}
        ParticipantVideoFallback={null}
        style={styles.remoteAudioParticipant}
      />
    </View>
  );
}

type FeedbackMetricProps = {
  label: string;
  value: string;
  valueColor: string;
};

function FeedbackMetric({ label, value, valueColor }: FeedbackMetricProps) {
  return (
    <View className="flex-1 items-center justify-center gap-[5px]">
      <Text className="font-poppins-medium text-[15px] leading-[20px] text-[#85858D]">
        {label}
      </Text>
      <Text
        className="font-poppins-semibold text-[15px] leading-[20px]"
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  backToLessonsButton: {
    alignItems: "center",
    backgroundColor: "#5B3BF6",
    borderRadius: 17,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 22,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 50,
    justifyContent: "space-between",
    paddingHorizontal: 6,
    position: "relative",
  },
  headerTitle: {
    left: 58,
    position: "absolute",
    right: 58,
    textAlign: "center",
  },
  headerBackButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerEndCallButton: {
    alignItems: "center",
    backgroundColor: "#F0524D",
    borderCurve: "continuous",
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 44,
  },
  lessonCountBadge: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#ECEEF6",
    borderRadius: 21,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  teacherStage: {
    backgroundColor: "#F3F1FF",
    borderCurve: "continuous",
    borderRadius: 28,
    flex: 1,
    marginBottom: 18,
    overflow: "hidden",
    position: "relative",
  },
  mascotFrame: {
    alignItems: "center",
    bottom: 114,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 14,
  },
  mascotImage: {
    height: "100%",
    width: "92%",
  },
  transcriptTray: {
    bottom: 20,
    gap: 5,
    left: 20,
    position: "absolute",
    right: 20,
  },
  transcriptBubble: {
    borderCurve: "continuous",
    borderRadius: 18,
    boxShadow: "0 7px 18px rgba(26, 31, 55, 0.09)",
    gap: 3,
    maxWidth: "88%",
    minWidth: "58%",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  teacherTranscriptBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
  },
  learnerTranscriptBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#6C4EF5",
    borderBottomRightRadius: 6,
  },
  remoteAudioSubscriber: {
    height: 1,
    left: -10,
    opacity: 0,
    overflow: "hidden",
    position: "absolute",
    top: -10,
    width: 1,
  },
  remoteAudioParticipant: {
    height: 1,
    width: 1,
  },
  pushToTalkContainer: {
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  pushToTalkButton: {
    alignItems: "center",
    backgroundColor: "#7B61FF",
    borderCurve: "continuous",
    borderRadius: 40,
    boxShadow: "0 8px 18px rgba(91, 59, 246, 0.28)",
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  pushToTalkButtonActive: {
    backgroundColor: "#5B3BF6",
    transform: [{ scale: 0.94 }],
  },
  disabledCallActionButton: {
    opacity: 0.48,
  },
  feedbackCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EEF0F5",
    borderCurve: "continuous",
    borderRadius: 22,
    borderWidth: 1,
    boxShadow: "0 6px 16px rgba(21, 29, 54, 0.04)",
    flexDirection: "row",
    height: 88,
    paddingHorizontal: 12,
  },
  feedbackDivider: {
    backgroundColor: "#ECEEF6",
    height: 42,
    width: 1.5,
  },
});
