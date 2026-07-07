import { images } from "@/constants/images";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
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
            <Text className="font-poppins-bold text-[32px] leading-[39px] text-[#050A2E]">
              Bolo
            </Text>
          </View>
        </View>

        <View className="mt-[52px]">
          <Text className="font-poppins-bold text-[36px] leading-[47px] text-[#020735]">
            Your AI language
          </Text>
          <Text className="font-poppins-bold text-[36px] leading-[47px] text-[#5A32FF]">
            teacher.
          </Text>
          <Text className="mt-4 max-w-[360px] font-poppins text-[19px] leading-[31px] text-[#6F728A]">
            Real conversations, personalized lessons, anytime, anywhere.
          </Text>
        </View>

        <View className="relative mt-4 flex-1 items-center justify-start">
          <View className="absolute left-0 top-5 z-10 rounded-[18px] bg-[#EEF7FF] px-7 py-5">
            <Text className="-rotate-[7deg] font-poppins-medium text-[26px] leading-[31px] text-[#020735]">
              Hello!
            </Text>
            <View className="absolute -bottom-3 right-7 h-0 w-0 border-l-[14px] border-r-[4px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#EEF7FF]" />
          </View>

          <View className="absolute right-0 top-0 z-10 rounded-[18px] bg-[#F6F3FF] px-7 py-5">
            <Text className="rotate-[8deg] font-poppins-medium text-[26px] leading-[31px] text-[#4F2BFF]">
              ¡Hola!
            </Text>
            <View className="absolute -bottom-3 left-7 h-0 w-0 border-l-[5px] border-r-[15px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#F6F3FF]" />
          </View>

          <View className="absolute right-0 top-[124px] z-10 rounded-[18px] bg-[#FFF5F0] px-7 py-5">
            <Text className="rotate-[8deg] font-poppins-medium text-[26px] leading-[31px] text-[#FF3D30]">
              你好!
            </Text>
            <View className="absolute -bottom-3 left-8 h-0 w-0 border-l-[6px] border-r-[15px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#FFF5F0]" />
          </View>

          <Image
            source={images.mascotWelcomeTransparent}
            className="mt-[40px] h-[360px] w-[360px]"
            resizeMode="contain"
          />
        </View>

        <View className="rounded-[24px] bg-[#5B35F5] py-[23px]">
          <Text className="text-center font-poppins-semibold text-[25px] leading-[31px] text-white">
            Get Started
          </Text>
          <Text className="absolute right-9 top-[16px] font-poppins text-[42px] leading-[42px] text-white">
            &gt;
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
