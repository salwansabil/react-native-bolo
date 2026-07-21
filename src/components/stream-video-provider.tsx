import { getApiUrl } from "@/lib/api";
import { useAuth, useUser } from "@clerk/expo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NativeModules } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StreamVideoClient = import("@stream-io/video-react-native-sdk").StreamVideoClient;
type StreamCallComponent = React.ComponentType<{
  children: React.ReactNode;
  call: import("@stream-io/video-react-native-sdk").Call;
}>;
type ParticipantViewComponent = React.ComponentType<
  import("@stream-io/video-react-native-sdk").ParticipantViewProps
>;
type StreamVideoComponent = React.ComponentType<{
  children: React.ReactNode;
  client: StreamVideoClient;
  style?: unknown;
}>;
type TokenProvider = import("@stream-io/video-react-native-sdk").TokenProvider;
type User = import("@stream-io/video-react-native-sdk").User;

type StreamSession = {
  apiKey: string;
  token: string;
  userId: string;
  userImage?: string;
  userName: string;
};

type ApiErrorBody = {
  error?: unknown;
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The Stream session server took too long to respond.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getClerkTokenWithTimeout(getToken: () => Promise<string | null>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Clerk authentication timed out. Sign out, sign back in, and try again.")),
      10000,
    );
  });

  return Promise.race([getToken(), timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

type StreamVideoContextValue = {
  canUseNativeSdk: boolean;
  client: StreamVideoClient | undefined;
  connectClient: () => Promise<StreamVideoClient>;
  errorMessage: string | null;
  isLoading: boolean;
  ParticipantView: ParticipantViewComponent | undefined;
  StreamCall: StreamCallComponent | undefined;
  StreamVideo: StreamVideoComponent | undefined;
  streamTheme: unknown;
  user: User | null;
};

const StreamVideoContext = createContext<StreamVideoContextValue>({
  canUseNativeSdk: false,
  client: undefined,
  connectClient: async () => {
    throw new Error("Stream video provider is not ready.");
  },
  errorMessage: null,
  isLoading: false,
  ParticipantView: undefined,
  StreamCall: undefined,
  StreamVideo: undefined,
  streamTheme: undefined,
  user: null,
});

async function parseStreamSession(response: Response): Promise<StreamSession> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const message =
      typeof body?.error === "string" && body.error.trim()
        ? body.error
        : "Stream session could not be created.";

    throw new Error(message);
  }

  return response.json() as Promise<StreamSession>;
}

function hasStreamNativeModules() {
  return Boolean(NativeModules.WebRTCModule && NativeModules.StreamVideoReactNative);
}

export function StreamVideoProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const insets = useSafeAreaInsets();
  const clientRef = useRef<StreamVideoClient | undefined>(undefined);
  const clientUserIdRef = useRef<string | null>(null);
  const connectionPromiseRef = useRef<Promise<StreamVideoClient> | null>(null);
  const connectionGenerationRef = useRef(0);
  const canUseNativeSdk = hasStreamNativeModules();
  const [client, setClient] = useState<StreamVideoClient>();
  const [ParticipantView, setParticipantView] = useState<ParticipantViewComponent>();
  const [StreamCall, setStreamCall] = useState<StreamCallComponent>();
  const [StreamVideo, setStreamVideo] = useState<StreamVideoComponent>();
  const [streamUser, setStreamUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStreamSession = useCallback(async () => {
    const clerkToken = await getClerkTokenWithTimeout(getToken);

    if (!clerkToken) {
      throw new Error("Sign in again to start lesson calls.");
    }

    const response = await fetchWithTimeout(getApiUrl("/api/stream/session"), {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    });

    return parseStreamSession(response);
  }, [getToken]);

  const clearClientState = useCallback(() => {
    setClient(undefined);
    setParticipantView(undefined);
    setStreamCall(undefined);
    setStreamVideo(undefined);
    setStreamUser(null);
  }, []);

  const disconnectClient = useCallback(async () => {
    connectionGenerationRef.current += 1;
    connectionPromiseRef.current = null;

    const currentClient = clientRef.current;

    clientRef.current = undefined;
    clientUserIdRef.current = null;
    clearClientState();
    setErrorMessage(null);
    setIsLoading(false);

    try {
      await currentClient?.disconnectUser();
    } catch (error) {
      console.warn("Unable to disconnect Stream user", error);
    }
  }, [clearClientState]);

  const connectClient = useCallback(async () => {
    if (clientRef.current) {
      return clientRef.current;
    }

    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    if (!isLoaded || !isSignedIn) {
      throw new Error("Sign in again to start lesson calls.");
    }

    const connectionGeneration = connectionGenerationRef.current;
    const connectionPromise = (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (!canUseNativeSdk) {
          throw new Error("Rebuild the Expo dev client to enable Stream audio calls.");
        }

        const streamSdk = await import("@stream-io/video-react-native-sdk");
        const session = await fetchStreamSession();

        if (connectionGenerationRef.current !== connectionGeneration) {
          throw new Error("Stream connection was cancelled.");
        }

        const user: User = {
          id: session.userId,
          image: session.userImage,
          name: session.userName || clerkUser?.fullName || clerkUser?.username || session.userId,
        };
        const tokenProvider: TokenProvider = async () => {
          const freshSession = await fetchStreamSession();
          return freshSession.token;
        };
        const nextClient = streamSdk.StreamVideoClient.getOrCreateInstance({
          apiKey: session.apiKey,
          token: session.token,
          tokenProvider,
          user,
        });

        if (connectionGenerationRef.current !== connectionGeneration) {
          await nextClient.disconnectUser();
          throw new Error("Stream connection was cancelled.");
        }

        clientRef.current = nextClient;
        clientUserIdRef.current = session.userId;
        setStreamUser(user);
        setClient(nextClient);
        setParticipantView(() => streamSdk.ParticipantView as ParticipantViewComponent);
        setStreamCall(() => streamSdk.StreamCall as StreamCallComponent);
        setStreamVideo(() => streamSdk.StreamVideo as StreamVideoComponent);

        return nextClient;
      } catch (error) {
        if (connectionGenerationRef.current === connectionGeneration) {
          const message = error instanceof Error ? error.message : "Stream session failed.";

          setErrorMessage(message);
          clearClientState();
        }

        throw error;
      } finally {
        if (connectionGenerationRef.current === connectionGeneration) {
          setIsLoading(false);
        }
      }
    })();

    connectionPromiseRef.current = connectionPromise;

    try {
      return await connectionPromise;
    } finally {
      if (connectionPromiseRef.current === connectionPromise) {
        connectionPromiseRef.current = null;
      }
    }
  }, [
    canUseNativeSdk,
    clearClientState,
    clerkUser,
    fetchStreamSession,
    isLoaded,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!isLoaded || !clientRef.current) {
      return;
    }

    if (!isSignedIn || clientUserIdRef.current !== clerkUser?.id) {
      void disconnectClient();
    }
  }, [clerkUser?.id, disconnectClient, isLoaded, isSignedIn]);

  useEffect(() => {
    return () => {
      connectionGenerationRef.current += 1;
      connectionPromiseRef.current = null;

      const currentClient = clientRef.current;

      clientRef.current = undefined;
      clientUserIdRef.current = null;
      void currentClient?.disconnectUser();
    };
  }, []);

  const streamTheme = useMemo(
    () =>
      ({
        variants: {
          insets: {
            bottom: insets.bottom,
            left: insets.left,
            right: insets.right,
            top: insets.top,
          },
        },
      }) as unknown,
    [insets.bottom, insets.left, insets.right, insets.top],
  );
  const value = useMemo(
    () => ({
      canUseNativeSdk,
      client,
      connectClient,
      errorMessage,
      isLoading,
      ParticipantView,
      StreamCall,
      StreamVideo,
      streamTheme,
      user: streamUser,
    }),
    [
      canUseNativeSdk,
      client,
      connectClient,
      errorMessage,
      isLoading,
      ParticipantView,
      StreamCall,
      StreamVideo,
      streamTheme,
      streamUser,
    ],
  );

  return (
    <StreamVideoContext.Provider value={value}>{children}</StreamVideoContext.Provider>
  );
}

export function useLessonStreamVideo() {
  return useContext(StreamVideoContext);
}

export function LessonStreamVideo({ children }: { children: React.ReactNode }) {
  const { client, StreamVideo, streamTheme } = useLessonStreamVideo();

  if (!client || !StreamVideo) {
    return children;
  }

  return (
    <StreamVideo client={client} style={streamTheme}>
      {children}
    </StreamVideo>
  );
}
