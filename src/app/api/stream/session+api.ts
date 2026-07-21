import { createStreamSession } from "@/lib/stream-server";

const safeMissingEnvNames = ["CLERK_SECRET_KEY", "STREAM_API_KEY", "STREAM_API_SECRET"];

type StreamErrorDetails = {
  code?: unknown;
  message?: unknown;
  metadata?: {
    responseCode?: unknown;
  };
};

function getStreamSessionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const missingEnvName = safeMissingEnvNames.find(
      (name) => error.message === `Missing ${name}`,
    );

    if (missingEnvName) {
      return `${missingEnvName} is missing from the deployed Expo API. Add it to the EAS production environment as a Sensitive variable, then redeploy.`;
    }
  }

  if (typeof error === "object" && error !== null) {
    const streamError = error as StreamErrorDetails;
    const code = typeof streamError.code === "number" ? streamError.code : undefined;
    const responseCode =
      typeof streamError.metadata?.responseCode === "number"
        ? streamError.metadata.responseCode
        : undefined;
    const message = typeof streamError.message === "string" ? streamError.message : "";

    if ([2, 5, 43].includes(code ?? 0) || responseCode === 401) {
      return "Stream rejected the server credentials. Confirm STREAM_API_KEY and STREAM_API_SECRET are a matching pair in the EAS production environment, then redeploy.";
    }

    if (code === 99 || responseCode === 403) {
      return "Stream denied access to this app. Check the Stream app status and server permissions.";
    }

    if (responseCode === 429) {
      return "Stream is temporarily rate limited. Wait a moment, then try again.";
    }

    if (message.toLowerCase().includes("timeout")) {
      return "The Stream server request timed out. Please try again.";
    }

    if (message === "The request failed due to an unexpected error") {
      return "The Expo API could not reach Stream. Check the EAS Hosting deployment logs.";
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
