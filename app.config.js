export default {
  expo: {
    name: "Bolo",
    slug: "duolingo-clone",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/assets/images/icon.png",
    scheme: "duolingoclone",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: "com.salwansabil.duolingo-clone",
      icon: "./assets/assets/images/icon.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          "Bolo uses camera access for Stream lesson calls when video lessons are enabled.",
        NSMicrophoneUsageDescription:
          "Bolo uses microphone access so you can speak during audio lessons.",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/assets/images/android-icon-background.png",
        monochromeImage: "./assets/assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: ["CAMERA", "RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS", "BLUETOOTH_CONNECT"],
    },
    web: {
      output: "server",
      favicon: "./assets/assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
      "expo-secure-store",
      "@clerk/expo",
      "@stream-io/video-react-native-sdk",
      [
        "@config-plugins/react-native-webrtc",
        {
          cameraPermission:
            "Bolo uses camera access for Stream lesson calls when video lessons are enabled.",
          microphonePermission:
            "Bolo uses microphone access so you can speak during audio lessons.",
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            usePrecompiledModules: false,
          },
          android: {
            minSdkVersion: 24,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: "5113fa3c-2385-4d56-a5ae-1a70bbeec221",
      },
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    },
  },
};
