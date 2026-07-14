import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { getApiUrl } from "@/lib/api";
import { useLessonStreamVideo } from "@/components/stream-video-provider";
import type { LanguageCode, Lesson } from "@/types/learning";
import { useAuth } from "@clerk/expo";
import { Stack } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CallAction = {
  androidIcon: AndroidSymbol;
  icon: SFSymbol;
  textIcon?: string;
  tintColor: string;
  variant?: "danger";
};

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

type AgentSession = Pick<LessonCallResponse, "callId" | "callType" | "languageId" | "lessonId"> & {
  sessionId: string;
};

type LessonCall = {
  join: (options?: { maxJoinRetries?: number }) => Promise<void>;
  leave: () => Promise<void>;
  camera: {
    toggle: () => Promise<void>;
  };
  microphone: {
    enable: () => Promise<void>;
    toggle: () => Promise<void>;
  };
  startClosedCaptions: () => Promise<unknown>;
  stopClosedCaptions: () => Promise<unknown>;
  state: {
    callingState: string;
  };
};

const pendingLessonJoins = new Map<string, Promise<void>>();

function getLessonJoinKey(callInfo: Pick<LessonCallResponse, "callId" | "callType">) {
  return `${callInfo.callType}:${callInfo.callId}`;
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

  const joinPromise = Promise.resolve().then(() => nextCall.join({ maxJoinRetries: 1 }));

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
  } = useLessonStreamVideo();
  const activeLanguageId = lesson?.languageId ?? selectedLanguageId;
  const language = languages.find((item) => item.id === activeLanguageId);
  const phrasePreview = lesson?.phrases[0]?.text ?? lesson?.title;
  const handleBackPress = onBackPress ?? (() => {});
  const [call, setCall] = useState<LessonCall>();
  const [callStatus, setCallStatus] = useState<LessonCallStatus>("idle");
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSubtitlesOn, setIsSubtitlesOn] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentConnectionStatus>("idle");
  const [agentErrorMessage, setAgentErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeAgentSession = useRef<AgentSession | null>(null);
  const autoJoinLessonId = useRef<string | null>(null);
  const callRef = useRef<LessonCall | undefined>(undefined);

  const isBusy = callStatus === "connecting";
  const isJoined = callStatus === "joined";
  const isConnectingLesson = isStreamLoading || callStatus === "connecting";
  const displayStatus = useMemo(() => {
    if (streamErrorMessage) return streamErrorMessage;
    if (isStreamLoading) return "Preparing Stream audio...";
    if (callStatus === "connecting") return "Connecting to audio...";
    if (callStatus === "joined" && isMuted) return "Joined - muted";
    if (callStatus === "joined") return "Joined - microphone on";
    if (callStatus === "ended") return "Call ended";
    if (callStatus === "error") return errorMessage ?? "Audio call failed";

    return canUseNativeSdk
      ? "Ready for audio practice"
      : "Rebuild the dev client for Stream audio";
  }, [callStatus, canUseNativeSdk, errorMessage, isMuted, isStreamLoading, streamErrorMessage]);
  const lessonPromptTitle = isConnectingLesson
    ? "Connecting..."
    : `${phrasePreview}. I'm Yuki, your ${language?.name ?? "language"} teacher.`;
  const lessonStatusLabel =
    callStatus === "error"
      ? displayStatus
      : isConnectingLesson
        ? "Setting up your lesson"
        : "Audio lesson in progress 🎧";
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

  const stopAgentSession = useCallback(
    async (session: AgentSession) => {
      try {
        const clerkToken = await getToken();

        if (!clerkToken) return;

        await fetch(getApiUrl("/api/vision-agent/stop"), {
          body: JSON.stringify(session),
          headers: {
            Authorization: `Bearer ${clerkToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        });
      } catch (error) {
        console.warn("Unable to stop AI teacher session", error);
      }
    },
    [getToken],
  );

  useEffect(() => {
    return () => {
      const activeCall = callRef.current;
      const activeSession = activeAgentSession.current;

      if (activeSession) {
        activeAgentSession.current = null;
        void stopAgentSession(activeSession);
      }

      void leaveLessonCall(activeCall);
    };
  }, [stopAgentSession]);

  const createLessonCallSession = useCallback(async () => {
    if (!lesson || !language) {
      throw new Error("Choose a lesson before starting a call.");
    }

    const clerkToken = await getToken();

    if (!clerkToken) {
      throw new Error("Sign in again to start this lesson call.");
    }

    const response = await fetch(getApiUrl("/api/stream/lesson-call"), {
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
      throw new Error("Unable to create this Stream lesson call.");
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

      setAgentStatus("connecting");
      setAgentErrorMessage(null);

      try {
        const clerkToken = await getToken();

        if (!clerkToken) {
          throw new Error("Sign in again to connect the AI teacher.");
        }

        const response = await fetch(getApiUrl("/api/vision-agent/start"), {
          body: JSON.stringify(sessionBody),
          headers: {
            Authorization: `Bearer ${clerkToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("AI teacher could not join this lesson.");
        }

        const agentSession = (await response.json()) as AgentSessionResponse;
        const activeSession = {
          ...sessionBody,
          sessionId: agentSession.sessionId,
        };

        if (isLessonCallLeft(nextCall)) {
          await stopAgentSession(activeSession);
          return;
        }

        activeAgentSession.current = activeSession;
        setAgentStatus("connected");
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI teacher could not join.";

        setAgentErrorMessage(message);
        setAgentStatus("failed");
      }
    },
    [getToken, stopAgentSession],
  );

  const joinLessonCall = useCallback(async () => {
    setErrorMessage(null);
    setAgentErrorMessage(null);
    setAgentStatus("idle");
    setCallStatus("connecting");

    try {
      const streamClient = client ?? (await connectClient());
      const callInfo = await createLessonCallSession();
      const joinKey = getLessonJoinKey(callInfo);
      const nextCall = streamClient.call(callInfo.callType, callInfo.callId, {
        reuseInstance: true,
      });

      setCall(nextCall);
      setCallStatus("connecting");

      const hasJoined = await joinLessonCallOnce(joinKey, nextCall);

      if (!hasJoined) {
        setCallStatus("connecting");
        return;
      }

      setIsMuted(true);
      setIsCameraOff(true);
      setIsSubtitlesOn(false);
      setCallStatus("joined");
      await startAgentSession(callInfo, nextCall);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join lesson call.";

      setErrorMessage(message);
      setCallStatus("error");
    }
  }, [client, connectClient, createLessonCallSession, startAgentSession]);

  useEffect(() => {
    if (!lesson || !language || !canUseNativeSdk || isStreamLoading || call || isBusy || isJoined) {
      return;
    }

    const autoJoinKey = `${language.id}:${lesson.id}`;

    if (autoJoinLessonId.current === autoJoinKey) {
      return;
    }

    autoJoinLessonId.current = autoJoinKey;
    void joinLessonCall();
  }, [
    call,
    canUseNativeSdk,
    isBusy,
    isJoined,
    isStreamLoading,
    joinLessonCall,
    language,
    lesson,
  ]);

  async function handleCameraPress() {
    if (!call) return;

    try {
      await call.camera.toggle();
      setIsCameraOff((current) => !current);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update camera.";

      setErrorMessage(message);
      setCallStatus("error");
    }
  }

  async function toggleMute() {
    if (!call || !isJoined) return;

    try {
      await call.microphone.toggle();
      setIsMuted((current) => !current);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update microphone.";

      setErrorMessage(message);
      setCallStatus("error");
    }
  }

  async function toggleSubtitles() {
    if (!call || !isJoined) return;

    try {
      if (isSubtitlesOn) {
        await call.stopClosedCaptions();
      } else {
        await call.startClosedCaptions();
      }

      setIsSubtitlesOn((current) => !current);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update subtitles.";

      setErrorMessage(message);
      setCallStatus("error");
    }
  }

  async function endLessonCall() {
    const activeCall = callRef.current ?? call;
    const activeSession = activeAgentSession.current;

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
      setIsCameraOff(true);
      setIsMuted(false);
      setIsSubtitlesOn(false);
      setAgentStatus("idle");
      setCallStatus("ended");
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "AI Teacher" }} />

      <View className="flex-1 bg-white px-[10px] pb-[8px] pt-[2px]">
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Back to lessons"
            activeOpacity={0.74}
            onPress={handleBackPress}
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

          <View className="flex-row items-center gap-[11px]">
            <View style={styles.audioBadge}>
              <SymbolView
                fallback={<Text className="font-poppins-bold text-[15px] text-[#07112F]">♪</Text>}
                name={{ android: "headphones", ios: "headphones" }}
                size={18}
                tintColor="#07112F"
                weight={{ android: { font: 500, name: "regular" }, ios: "medium" }}
              />
              <Text className="font-poppins-semibold text-[15px] leading-[20px] text-[#07112F]">
                Audio
              </Text>
            </View>
            <HeaderIcon androidIcon="notifications" icon="bell.fill" />
          </View>
        </View>

        <View className="flex-row items-center gap-[8px] px-[6px] pb-[16px]">
          <View className="h-[10px] w-[10px] rounded-full bg-[#37D878]" />
          <Text className="font-poppins-semibold text-[17px] leading-[23px] text-[#42D98A]">
            Online
          </Text>
          <View className="ml-[8px] h-[4px] w-[4px] rounded-full bg-[#DADCE5]" />
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

          <View style={styles.responseBubble}>
            <View className="flex-1 gap-[6px]">
              <Text
                className="font-poppins-semibold text-[15px] leading-[20px] text-[#07112F]"
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.86}
              >
                {lessonPromptTitle}
              </Text>
              <Text
                className="font-poppins-medium text-[16px] leading-[22px] text-[#8B8C96]"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.86}
              >
                {lessonStatusLabel}
              </Text>
            </View>
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[24px] text-[#7B61FF]">♪</Text>}
              name={{ android: "volume_up", ios: "speaker.wave.2.fill" }}
              size={25}
              tintColor="#7B61FF"
              weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
            />
          </View>
        </View>

        <View style={styles.callControlsRow}>
          <CallControlButton
            androidIcon={isCameraOff ? "videocam_off" : "videocam"}
            disabled={!isJoined}
            icon={isCameraOff ? "video.slash.fill" : "video.fill"}
            label="Camera"
            onPress={() => void handleCameraPress()}
            tintColor="#07112F"
          />
          <CallControlButton
            androidIcon={isMuted ? "mic_off" : "mic"}
            disabled={!isJoined}
            icon={isMuted ? "mic.slash.fill" : "mic.fill"}
            label="Mic"
            onPress={() => void toggleMute()}
            tintColor="#07112F"
          />
          <CallControlButton
            androidIcon={isSubtitlesOn ? "closed_caption" : "closed_caption_off"}
            disabled={!isJoined}
            icon="captions.bubble.fill"
            label="Subtitles"
            onPress={() => void toggleSubtitles()}
            textIcon="Aa"
            tintColor="#07112F"
          />
          <CallControlButton
            androidIcon="call_end"
            disabled={!call && callStatus !== "joined"}
            icon="phone.down.fill"
            label="End Call"
            onPress={() => void endLessonCall()}
            tintColor="#FFFFFF"
            variant="danger"
          />
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
}

type HeaderIconProps = {
  androidIcon: AndroidSymbol;
  icon: SFSymbol;
};

type CallControlButtonProps = CallAction & {
  disabled: boolean;
  label: string;
  onPress: () => void;
};

function CallControlButton({
  androidIcon,
  disabled,
  icon,
  label,
  onPress,
  textIcon,
  tintColor,
  variant,
}: CallControlButtonProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      activeOpacity={0.78}
      disabled={disabled}
      onPress={onPress}
      style={styles.callActionWrapper}
    >
      <View
        style={[
          styles.callActionButton,
          variant === "danger" && styles.endCallButton,
          disabled && styles.disabledCallActionButton,
        ]}
      >
        {textIcon ? (
          <Text className="font-poppins-bold text-[21px] leading-[27px] text-[#07112F]">
            {textIcon}
          </Text>
        ) : (
          <SymbolView
            fallback={
              <Text className="font-poppins-bold text-[22px]" style={{ color: tintColor }}>
                {label.charAt(0)}
              </Text>
            }
            name={{ android: androidIcon, ios: icon }}
            size={29}
            tintColor={tintColor}
            weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
          />
        )}
      </View>
      <Text
        className="text-center font-poppins-medium text-[14px] leading-[19px] text-[#85858D]"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.76}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HeaderIcon({ androidIcon, icon }: HeaderIconProps) {
  return (
    <TouchableOpacity activeOpacity={0.76} style={styles.headerIconButton}>
      <SymbolView
        fallback={<Text className="font-poppins-bold text-[18px] text-[#07112F]">•</Text>}
        name={{ android: androidIcon, ios: icon }}
        size={22}
        tintColor="#07112F"
        weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
      />
    </TouchableOpacity>
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
    left: 86,
    position: "absolute",
    right: 112,
    textAlign: "center",
  },
  headerBackButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  audioBadge: {
    alignItems: "center",
    backgroundColor: "#F7F7FA",
    borderCurve: "continuous",
    borderRadius: 16,
    flexDirection: "row",
    gap: 5,
    height: 34,
    justifyContent: "center",
    paddingHorizontal: 11,
  },
  headerIconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 34,
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
  responseBubble: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 18,
    bottom: 20,
    boxShadow: "0 7px 18px rgba(26, 31, 55, 0.09)",
    flexDirection: "row",
    gap: 14,
    left: 20,
    minHeight: 100,
    paddingHorizontal: 22,
    paddingVertical: 16,
    position: "absolute",
    right: 20,
  },
  callControlsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  callActionWrapper: {
    alignItems: "center",
    gap: 10,
    width: 74,
  },
  callActionButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    boxShadow: "0 6px 16px rgba(21, 29, 54, 0.08)",
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  endCallButton: {
    backgroundColor: "#F0524D",
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
