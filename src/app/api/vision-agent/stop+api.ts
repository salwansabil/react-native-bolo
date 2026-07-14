import {
  assertLessonCallAccess,
  getAuthenticatedStreamUser,
  type LessonCallInput,
} from "@/lib/stream-server";
import type { LanguageCode } from "@/types/learning";

type StopAgentBody = LessonCallInput & {
  callId: string;
  callType: string;
  sessionId: string;
};

function getVisionAgentBaseUrl() {
  return (
    process.env.VISION_AGENT_BASE_URL ??
    process.env.VISION_AGENT_URL ??
    (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8080" : null)
  );
}

function isStopAgentBody(value: unknown): value is StopAgentBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.callId === "string" &&
    typeof body.callType === "string" &&
    typeof body.lessonId === "string" &&
    typeof body.languageId === "string" &&
    typeof body.sessionId === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isStopAgentBody(body)) {
      return Response.json(
        { error: "callId, callType, sessionId, lessonId, and languageId are required" },
        { status: 400 },
      );
    }

    const user = await getAuthenticatedStreamUser(request);
    assertLessonCallAccess(
      { languageId: body.languageId as LanguageCode, lessonId: body.lessonId },
      user.id,
      body.callId,
      body.callType,
    );

    const baseUrl = getVisionAgentBaseUrl();

    if (!baseUrl) {
      return Response.json({ stopped: false }, { status: 202 });
    }

    const response = await fetch(
      `${baseUrl}/calls/${encodeURIComponent(body.callId)}/sessions/${encodeURIComponent(
        body.sessionId,
      )}/close`,
      {
        method: "POST",
      },
    );

    if (!response.ok && response.status !== 404) {
      return Response.json({ error: "Vision Agent session could not be stopped" }, { status: 502 });
    }

    return Response.json({ stopped: true });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Failed to stop Vision Agent session", error);
    return Response.json({ error: "Unable to stop Vision Agent session" }, { status: 500 });
  }
}
