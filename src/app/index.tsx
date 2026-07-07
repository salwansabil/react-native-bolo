import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-white px-6">
      <Text className="h1 text-lingua-purple">Bolo</Text>

      <Link
        href="/onboarding"
        className="rounded-3xl bg-lingua-deep-purple px-8 py-4 font-poppins-semibold text-base text-white"
      >
        Open onboarding
      </Link>
    </View>
  );
}
