import { getApiUrl } from "@/lib/api";
import { useAuth, useUser } from "@clerk/expo";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NativeModules } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StreamVideoClient = import("@stream-io/video-react-native-sdk").StreamVideoClient;
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

type StreamVideoContextValue = {
  canUseNativeSdk: boolean;
  client: StreamVideoClient | undefined;
  connectClient: () => Promise<StreamVideoClient>;
  errorMessage: string | null;
  isLoading: boolean;
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
  user: null,
});

async function parseStreamSession(response: Response): Promise<StreamSession> {
  if (!response.ok) {
    throw new Error("Stream session could not be created.");
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
  const canUseNativeSdk = hasStreamNativeModules();
  const [client, setClient] = useState<StreamVideoClient>();
  const [StreamVideo, setStreamVideo] = useState<StreamVideoComponent>();
  const [streamUser, setStreamUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchStreamSession() {
    const clerkToken = await getToken();

    if (!clerkToken) {
      throw new Error("Sign in again to start lesson calls.");
    }

    const response = await fetch(getApiUrl("/api/stream/session"), {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    });

    return parseStreamSession(response);
  }

  async function connectClient() {
    if (clientRef.current) {
      return clientRef.current;
    }

    if (!isLoaded || !isSignedIn) {
      throw new Error("Sign in again to start lesson calls.");
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (!canUseNativeSdk) {
        throw new Error("Rebuild the Expo dev client to enable Stream audio calls.");
      }

      const streamSdk = await import("@stream-io/video-react-native-sdk");
      const session = await fetchStreamSession();
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

      clientRef.current = nextClient;
      setStreamUser(user);
      setClient(nextClient);
      setStreamVideo(() => streamSdk.StreamVideo as StreamVideoComponent);

      return nextClient;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stream session failed.";

      setErrorMessage(message);
      setClient(undefined);
      setStreamVideo(undefined);
      setStreamUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      const currentClient = clientRef.current;
      clientRef.current = undefined;
      void currentClient?.disconnectUser();
    };
  }, []);

  const value = {
    canUseNativeSdk,
    client,
    connectClient,
    errorMessage,
    isLoading,
    user: streamUser,
  };
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

  return (
    <StreamVideoContext.Provider value={value}>
      {client && StreamVideo ? (
        <StreamVideo client={client} style={streamTheme}>
          {children}
        </StreamVideo>
      ) : (
        children
      )}
    </StreamVideoContext.Provider>
  );
}

export function useLessonStreamVideo() {
  return useContext(StreamVideoContext);
}
