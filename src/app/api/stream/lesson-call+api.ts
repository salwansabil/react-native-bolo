import { createLessonCall } from "@/lib/stream-server";
import type { LanguageCode } from "@/types/learning";

type LessonCallBody = {
  languageId: LanguageCode;
  lessonId: string;
};

function isLessonCallBody(value: unknown): value is LessonCallBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return typeof body.lessonId === "string" && typeof body.languageId === "string";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse lesson call request JSON", error);
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (!isLessonCallBody(body)) {
      return Response.json({ error: "lessonId and languageId are required" }, { status: 400 });
    }

    return Response.json(await createLessonCall(request, body));
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Failed to create Stream lesson call", error);
    return Response.json({ error: "Unable to create Stream lesson call" }, { status: 500 });
  }
}
