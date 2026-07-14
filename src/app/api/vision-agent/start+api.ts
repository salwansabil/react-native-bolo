import {
  assertLessonCallAccess,
  getAuthenticatedStreamUser,
  type LessonCallInput,
} from "@/lib/stream-server";
import type { LanguageCode } from "@/types/learning";

type StartAgentBody = LessonCallInput & {
  callId: string;
  callType: string;
};

type StartAgentResponse = {
  call_id: string;
  session_id: string;
  session_started_at: string;
};

function getVisionAgentBaseUrl() {
  return (
    process.env.VISION_AGENT_BASE_URL ??
    process.env.VISION_AGENT_URL ??
    (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8080" : null)
  );
}

function isStartAgentBody(value: unknown): value is StartAgentBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.callId === "string" &&
    typeof body.callType === "string" &&
    typeof body.lessonId === "string" &&
    typeof body.languageId === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isStartAgentBody(body)) {
      return Response.json(
        { error: "callId, callType, lessonId, and languageId are required" },
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
      return Response.json({ error: "Vision Agent server is not configured" }, { status: 503 });
    }

    const response = await fetch(
      `${baseUrl}/calls/${encodeURIComponent(body.callId)}/sessions`,
      {
        body: JSON.stringify({ call_type: body.callType }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );

    if (!response.ok) {
      return Response.json({ error: "Vision Agent could not join the call" }, { status: 502 });
    }

    const agentSession = (await response.json()) as StartAgentResponse;

    return Response.json({
      callId: agentSession.call_id,
      sessionId: agentSession.session_id,
      sessionStartedAt: agentSession.session_started_at,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Failed to start Vision Agent session", error);
    return Response.json({ error: "Unable to start Vision Agent session" }, { status: 500 });
  }
}
