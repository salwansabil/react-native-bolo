import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PlaceholderScreenProps = {
  title: string;
};

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View className="flex-1 items-center justify-center px-6 pb-28">
        <Text className="font-poppins-semibold text-[24px] leading-[31px] text-lingua-text-primary">
          {title}
        </Text>
        <Text className="mt-2 text-center font-poppins-medium text-[15px] leading-[22px] text-lingua-text-secondary">
          Placeholder screen
        </Text>
      </View>
    </SafeAreaView>
  );
}
