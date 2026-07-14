import { createStreamSession } from "@/lib/stream-server";

const safeMissingEnvNames = ["CLERK_SECRET_KEY", "STREAM_API_KEY", "STREAM_API_SECRET"];

function getStreamSessionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const missingEnvName = safeMissingEnvNames.find(
      (name) => error.message === `Missing ${name}`,
    );

    if (missingEnvName) {
      return `${missingEnvName} is missing from the Expo server environment. Add it to .env.local and restart Expo.`;
    }
  }

  return "Unable to create Stream session";
}

export async function GET(request: Request) {
  try {
    return Response.json(await createStreamSession(request));
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Failed to create Stream session", error);
    return Response.json({ error: getStreamSessionErrorMessage(error) }, { status: 500 });
  }
}
