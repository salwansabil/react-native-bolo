import { useAuth, useClerk } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/onboarding");
    } catch (error) {
      console.error("Sign out failed", error);
      Alert.alert("Sign out failed", "Please try again.");
    }
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#5B3BF6" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-white px-6">
      <Text className="h1 text-lingua-purple">Bolo</Text>

      <Link href="/language-selection" asChild>
        <TouchableOpacity activeOpacity={0.82} style={styles.languageButton}>
          <Text className="text-center font-poppins-semibold text-base text-lingua-deep-purple">
            Choose a language
          </Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => void handleSignOut()}
        style={styles.signOutButton}
      >
        <Text className="text-center font-poppins-semibold text-base text-white">
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
    backgroundColor: "#5B3BF6",
    borderCurve: "continuous",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  languageButton: {
    backgroundColor: "#F6F3FF",
    borderColor: "#E4DAFF",
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
});
