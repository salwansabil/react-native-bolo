import { images } from "@/constants/images";
import { posthog } from "@/config/posthog";
import { colors } from "@/theme";
import { useAuth } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.neutral.background }}>
          <ActivityIndicator color={colors.brand.deepPurple} />
        </View>
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View className="flex-1 bg-white px-10 pb-9 pt-7">
        <View className="items-center">
          <View className="flex-row items-center gap-3">
            <Image
              source={images.mascotLogoTransparent}
              className="h-[58px] w-[58px]"
              resizeMode="contain"
            />
            <Text
              className="font-poppins-bold text-[32px] leading-[39px]"
              style={{ color: colors.neutral.textPrimary }}
            >
              Bolo
            </Text>
          </View>
        </View>

        <View className="mt-[52px]">
          <Text
            className="font-poppins-bold text-[36px] leading-[47px]"
            style={{ color: colors.neutral.textPrimary }}
          >
            Your AI language
          </Text>
          <Text
            className="font-poppins-bold text-[36px] leading-[47px]"
            style={{ color: colors.brand.deepPurple }}
          >
            teacher.
          </Text>
          <Text
            className="mt-4 max-w-[360px] font-poppins text-[19px] leading-[31px]"
            style={{ color: colors.neutral.textSecondary }}
          >
            Real conversations, personalized lessons, anytime, anywhere.
          </Text>
        </View>

        <View className="relative mt-4 flex-1 items-center justify-start">
          <View
            className="absolute left-0 top-5 z-10 rounded-[18px] px-7 py-5"
            style={{ backgroundColor: colors.highlight.bubbleBlue }}
          >
            <Text
              className="-rotate-[7deg] font-poppins-medium text-[26px] leading-[31px]"
              style={{ color: colors.neutral.textPrimary }}
            >
              Hello!
            </Text>
            <View
              className="absolute -bottom-3 right-7 h-0 w-0 border-l-[14px] border-r-[4px] border-t-[18px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: colors.highlight.bubbleBlue }}
            />
          </View>

          <View
            className="absolute right-0 top-0 z-10 rounded-[18px] px-7 py-5"
            style={{ backgroundColor: colors.highlight.bubblePurple }}
          >
            <Text
              className="rotate-[8deg] font-poppins-medium text-[26px] leading-[31px]"
              style={{ color: colors.brand.deepPurple }}
            >
              ¡Hola!
            </Text>
            <View
              className="absolute -bottom-3 left-7 h-0 w-0 border-l-[5px] border-r-[15px] border-t-[18px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: colors.highlight.bubblePurple }}
            />
          </View>

          <View
            className="absolute right-0 top-[124px] z-10 rounded-[18px] px-7 py-5"
            style={{ backgroundColor: colors.highlight.bubblePeach }}
          >
            <Text
              className="rotate-[8deg] font-poppins-medium text-[26px] leading-[31px]"
              style={{ color: colors.semantic.error }}
            >
              你好!
            </Text>
            <View
              className="absolute -bottom-3 left-8 h-0 w-0 border-l-[6px] border-r-[15px] border-t-[18px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: colors.highlight.bubblePeach }}
            />
          </View>

          <Image
            source={images.mascotWelcomeTransparent}
            className="mt-[40px] h-[360px] w-[360px]"
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {
            posthog.capture("onboarding_get_started_pressed");
            router.push("/sign-up");
          }}
          style={styles.getStartedButton}
        >
          <Text className="text-center font-poppins-semibold text-[25px] leading-[31px] text-white">
            Get Started
          </Text>
          <Text className="absolute right-9 top-[16px] font-poppins text-[42px] leading-[42px] text-white">
            &gt;
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  getStartedButton: {
    backgroundColor: colors.brand.deepPurple,
    borderRadius: 24,
    paddingVertical: 23,
  },
});
