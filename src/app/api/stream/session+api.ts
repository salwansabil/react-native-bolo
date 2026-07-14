import { createStreamSession } from "@/lib/stream-server";

export async function GET(request: Request) {
  try {
    return Response.json(await createStreamSession(request));
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Failed to create Stream session", error);
    return Response.json({ error: "Unable to create Stream session" }, { status: 500 });
  }
}
