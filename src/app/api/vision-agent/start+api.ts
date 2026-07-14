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

type ApiErrorBody = {
  detail?: unknown;
  error?: unknown;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getVisionAgentBaseUrl() {
  return (
    process.env.VISION_AGENT_BASE_URL ??
    process.env.VISION_AGENT_URL ??
    (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8080" : null)
  );
}

async function getResponseErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const message = typeof body?.error === "string" ? body.error : body?.detail;

  return typeof message === "string" && message.trim() ? message : fallback;
}

async function isAgentSessionRunning(
  baseUrl: string,
  callId: string,
  sessionId: string,
  signal: AbortSignal,
) {
  await wait(2500);

  const response = await fetch(
    `${baseUrl}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}`,
    { signal },
  );

  return response.ok;
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${baseUrl}/calls/${encodeURIComponent(body.callId)}/sessions`,
        {
          body: JSON.stringify({ call_type: body.callType }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const message = await getResponseErrorMessage(
          response,
          "Vision Agent could not join the call",
        );

        return Response.json({ error: message }, { status: 502 });
      }

      const agentSession = (await response.json()) as StartAgentResponse;
      const isRunning = await isAgentSessionRunning(
        baseUrl,
        agentSession.call_id,
        agentSession.session_id,
        controller.signal,
      );

      if (!isRunning) {
        return Response.json(
          {
            error:
              "AI teacher disconnected after starting. Check the Vision Agent logs for OpenAI quota, billing, or model errors.",
          },
          { status: 502 },
        );
      }

      return Response.json({
        callId: agentSession.call_id,
        sessionId: agentSession.session_id,
        sessionStartedAt: agentSession.session_started_at,
      });
    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Failed to start Vision Agent session", error);
    return Response.json({ error: "Unable to start Vision Agent session" }, { status: 500 });
  }
}
