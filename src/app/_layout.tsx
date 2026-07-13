import "../../global.css";

import { posthog } from "@/config/posthog";
import { colors } from "@/theme";
import { ClerkProvider, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import { useEffect, useRef } from "react";

void SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local");
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../../assets/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/assets/fonts/Poppins-Bold.ttf"),
  });

  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      const safeParams = {
        lessonId: params.lessonId,
        mode: params.mode,
        tab: params.tab,
      };

      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...safeParams,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: true,
        propsToCapture: ["testID"],
        maxElementsCaptured: 20,
      }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <PostHogClerkSync />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.neutral.background },
            headerShown: false,
          }}
        />
      </ClerkProvider>
    </PostHogProvider>
  );
}

function PostHogClerkSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      posthog.identify(user.id, {
        $set: {
          name: user.fullName ?? user.username ?? null,
        },
        $set_once: {
          first_sign_in_date: new Date().toISOString(),
        },
      });
    } else {
      posthog.reset();
    }
  }, [isLoaded, user]);

  return null;
}
