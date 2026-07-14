import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import type { LanguageCode } from "@/types/learning";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { StreamClient } from "@stream-io/node-sdk";

const tokenValidityInSeconds = 60 * 60 * 4;
export const aiTeacherAgentUserId = "ai-language-teacher";
export const lessonCallType = "audio_room";
const sendAudioPermission = "send-audio";

type StreamUser = {
  id: string;
  image?: string;
  name: string;
};

export type LessonCallInput = {
  languageId: LanguageCode;
  lessonId: string;
};

export type StreamSessionResponse = {
  apiKey: string;
  token: string;
  userId: string;
  userImage?: string;
  userName: string;
};

export type LessonCallResponse = StreamSessionResponse & {
  callId: string;
  callType: string;
  lessonId: string;
  languageId: LanguageCode;
};

type ServerEnvName = "CLERK_SECRET_KEY" | "STREAM_API_KEY" | "STREAM_API_SECRET";

function getRequiredEnv(name: ServerEnvName) {
  const value =
    name === "CLERK_SECRET_KEY"
      ? process.env.CLERK_SECRET_KEY
      : name === "STREAM_API_KEY"
        ? process.env.STREAM_API_KEY
        : process.env.STREAM_API_SECRET;

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  id: string;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return fullName || user.username || user.id;
}

export async function getAuthenticatedStreamUser(request: Request): Promise<StreamUser> {
  const clerkSecretKey = getRequiredEnv("CLERK_SECRET_KEY");
  const token = getBearerToken(request);

  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  try {
    const verifiedToken = await verifyToken(token, {
      authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(",").filter(Boolean),
      secretKey: clerkSecretKey,
    });

    const userId = verifiedToken.sub;

    if (!userId) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
    const clerkUser = await clerkClient.users.getUser(userId);

    return {
      id: clerkUser.id,
      image: clerkUser.imageUrl,
      name: getDisplayName(clerkUser),
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Unauthorized", { status: 401 });
  }
}

function getStreamServerClient() {
  return new StreamClient(
    getRequiredEnv("STREAM_API_KEY"),
    getRequiredEnv("STREAM_API_SECRET"),
  );
}

function createUserToken(streamClient: StreamClient, userId: string) {
  return streamClient.generateUserToken({
    user_id: userId,
    validity_in_seconds: tokenValidityInSeconds,
  });
}

function createSessionResponse(streamClient: StreamClient, user: StreamUser): StreamSessionResponse {
  return {
    apiKey: getRequiredEnv("STREAM_API_KEY"),
    token: createUserToken(streamClient, user.id),
    userId: user.id,
    userImage: user.image,
    userName: user.name,
  };
}

export function getLessonCallId({ languageId, lessonId }: LessonCallInput, userId: string) {
  const rawCallId = `lesson-${languageId}-${lessonId}-${userId}`;

  return rawCallId.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
}

function getLessonData(input: LessonCallInput) {
  const lesson = lessons.find((item) => item.id === input.lessonId);
  const language = languages.find((item) => item.id === input.languageId);

  if (!lesson || !language || lesson.languageId !== input.languageId) {
    throw new Response("Lesson not found for selected language", { status: 404 });
  }

  return { language, lesson };
}

export function assertLessonCallAccess(
  input: LessonCallInput,
  userId: string,
  callId: string,
  callType: string,
) {
  getLessonData(input);

  if (callType !== lessonCallType || callId !== getLessonCallId(input, userId)) {
    throw new Response("Forbidden", { status: 403 });
  }
}

function getLessonCallCustomData(
  { languageId, lessonId }: LessonCallInput,
  user: StreamUser,
) {
  const { language, lesson } = getLessonData({ languageId, lessonId });

  return {
    agent_user_id: aiTeacherAgentUserId,
    learner: {
      id: user.id,
      image: user.image,
      name: user.name,
    },
    language_id: language.id,
    language_name: language.name,
    lesson_id: lesson.id,
    lesson_title: lesson.title,
    lesson_type: lesson.kind,
    lesson_context: {
      ai_teacher_prompt: lesson.aiTeacherPrompt,
      goals: lesson.goals,
      language: {
        accent_color: language.accentColor,
        ai_teacher_name: language.aiTeacherName,
        beginner_greeting: language.beginnerGreeting,
        description: language.description,
        id: language.id,
        name: language.name,
        native_name: language.nativeName,
      },
      lesson: {
        description: lesson.description,
        estimated_minutes: lesson.estimatedMinutes,
        id: lesson.id,
        kind: lesson.kind,
        level: lesson.level,
        title: lesson.title,
        xp_reward: lesson.xpReward,
      },
      phrases: lesson.phrases,
      vocabulary: lesson.vocabulary,
    },
  };
}

export async function createStreamSession(request: Request) {
  const streamClient = getStreamServerClient();
  const user = await getAuthenticatedStreamUser(request);

  await streamClient.upsertUsers([
    {
      id: user.id,
      image: user.image,
      name: user.name,
    },
  ]);

  return createSessionResponse(streamClient, user);
}

export async function createLessonCall(request: Request, input: LessonCallInput) {
  const streamClient = getStreamServerClient();
  const user = await getAuthenticatedStreamUser(request);
  getLessonData(input);

  await streamClient.upsertUsers([
    {
      id: user.id,
      image: user.image,
      name: user.name,
    },
    {
      id: aiTeacherAgentUserId,
      name: "AI Language Teacher",
      role: "admin",
    },
  ]);

  const callType = lessonCallType;
  const callId = getLessonCallId(input, user.id);
  const call = streamClient.video.call(callType, callId);
  const callCustomData = getLessonCallCustomData(input, user);

  const callResponse = await call.getOrCreate({
    data: {
      created_by_id: user.id,
      members: [
        { user_id: user.id },
        { user_id: aiTeacherAgentUserId, role: "admin" },
      ],
      settings_override: {
        audio: {
          default_device: "speaker",
          mic_default_on: false,
          speaker_default_on: true,
        },
        transcription: {
          closed_caption_mode: "auto-on",
          language: "auto",
          mode: "available",
          speech_segment_config: {
            max_speech_caption_ms: 5000,
            silence_duration_ms: 300,
          },
        },
      },
      custom: callCustomData,
    },
  });

  await call.update({
    custom: callCustomData,
    settings_override: {
      audio: {
        default_device: "speaker",
        mic_default_on: false,
        speaker_default_on: true,
      },
      transcription: {
        closed_caption_mode: "auto-on",
        language: "auto",
        mode: "available",
        speech_segment_config: {
          max_speech_caption_ms: 5000,
          silence_duration_ms: 300,
        },
      },
    },
  });
  await call.updateCallMembers({
    update_members: [{ user_id: aiTeacherAgentUserId, role: "admin" }],
  });
  await call.updateUserPermissions({
    grant_permissions: [sendAudioPermission],
    user_id: aiTeacherAgentUserId,
  });

  if (callResponse.call.backstage) {
    await call.goLive();
  }

  return {
    ...createSessionResponse(streamClient, user),
    callId,
    callType,
    languageId: input.languageId,
    lessonId: input.lessonId,
  };
}
