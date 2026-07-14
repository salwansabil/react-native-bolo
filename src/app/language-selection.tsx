import { images } from "@/constants/images";
import { posthog } from "@/config/posthog";
import { defaultLanguageId, languages } from "@/data/languages";
import { useLanguageStore } from "@/store/language-store";
import { useStreakStore } from "@/store/streak-store";
import type { LanguageCode, SupportedLanguage } from "@/types/learning";
import { useAuth } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LanguageSelectionScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const hasHydratedLanguageStore = useLanguageStore((state) => state.hasHydrated);
  const hasHydratedStreakStore = useStreakStore((state) => state.hasHydrated);
  const savedLanguageId = useLanguageStore((state) => state.selectedLanguageId);

  if (!isLoaded || !hasHydratedLanguageStore || !hasHydratedStreakStore) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator color="#5B3BF6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  return <LanguageSelectionContent savedLanguageId={savedLanguageId} />;
}

type LanguageSelectionContentProps = {
  savedLanguageId: LanguageCode | null;
};

function LanguageSelectionContent({
  savedLanguageId,
}: LanguageSelectionContentProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const earthImageSize = width + 180;
  const setSavedLanguageId = useLanguageStore((state) => state.setSelectedLanguageId);
  const startStreak = useStreakStore((state) => state.startStreak);
  const [selectedLanguageId, setSelectedLanguageId] = useState(
    savedLanguageId ?? defaultLanguageId,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const visibleLanguages = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return languages;
    }

    return languages.filter((language) => {
      const name = language.name.toLowerCase();
      const nativeName = language.nativeName.toLowerCase();

      return name.includes(normalizedQuery) || nativeName.includes(normalizedQuery);
    });
  }, [searchQuery]);

  const selectedLanguage = languages.find(
    (language) => language.id === selectedLanguageId,
  );

  const handleConfirm = () => {
    const selectedLanguage = languages.find((l) => l.id === selectedLanguageId);

    if (!selectedLanguage) return;

    posthog.capture("language_selected", {
      language_code: selectedLanguage.id,
      language_name: selectedLanguage.name,
    });
    setSavedLanguageId(selectedLanguageId);
    startStreak();
    router.replace("/");
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            accessibilityLabel="Go back"
            activeOpacity={0.7}
            onPress={handleBackPress}
            style={styles.headerIconButton}
          >
            <Text className="font-poppins-medium text-[42px] leading-[42px] text-lingua-text-primary">
              ‹
            </Text>
          </TouchableOpacity>

          <Text className="font-poppins-semibold text-[24px] leading-[31px] text-lingua-text-primary">
            Choose a language
          </Text>

          <View style={styles.headerIconButton} />
        </View>

        <View style={styles.searchContainer}>
          <Text className="font-poppins text-[30px] leading-[34px] text-[#65708C]">
            ⌕
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchQuery}
            placeholder="Search languages"
            placeholderTextColor="#65708C"
            style={styles.searchInput}
            underlineColorAndroid="transparent"
            value={searchQuery}
          />
        </View>

        <View className="gap-[22px]">
          <Text className="font-poppins-semibold text-[20px] leading-[26px] text-lingua-text-primary">
            Popular
          </Text>

          <View className="gap-[6px]">
            {visibleLanguages.map((language) => (
              <LanguageOption
                isSelected={language.id === selectedLanguageId}
                key={language.id}
                language={language}
                onPress={() => setSelectedLanguageId(language.id)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleConfirm}
          style={styles.confirmButton}
        >
          <Text className="text-center font-poppins-semibold text-[20px] leading-[26px] text-white">
            Continue with {selectedLanguage?.name ?? "language"}
          </Text>
        </TouchableOpacity>

        <View style={[styles.earthFrame, { width }]}>
          <Image
            source={images.earthTransparent}
            resizeMode="contain"
            style={[
              styles.earthImage,
              {
                height: earthImageSize,
                width: earthImageSize,
              },
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type LanguageOptionProps = {
  isSelected: boolean;
  language: SupportedLanguage;
  onPress: () => void;
};

function LanguageOption({ isSelected, language, onPress }: LanguageOptionProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[styles.languageCard, isSelected && styles.languageCardSelected]}
    >
      <View style={styles.flagCircle}>
        <Text className="text-[33px] leading-[42px]">{language.flagEmoji}</Text>
      </View>

      <View className="flex-1 gap-[3px]">
        <Text className="font-poppins-semibold text-[20px] leading-[26px] text-lingua-text-primary">
          {language.name}
        </Text>
        <Text className="font-poppins-medium text-[16px] leading-[22px] text-[#65708C]">
          {language.learnerCountLabel}
        </Text>
      </View>

      {isSelected ? (
        <View style={styles.checkCircle}>
          <Text className="font-poppins-bold text-[24px] leading-[28px] text-white">
            ✓
          </Text>
        </View>
      ) : (
        <Text className="font-poppins-medium text-[38px] leading-[38px] text-[#65708C]">
          ›
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flexGrow: 1,
    gap: 28,
    paddingBottom: 0,
    paddingHorizontal: 28,
    paddingTop: 22,
  },
  headerIconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  searchContainer: {
    alignItems: "center",
    backgroundColor: "#FAFAFC",
    borderColor: "#E7E8EE",
    borderCurve: "continuous",
    borderRadius: 30,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 12,
    height: 64,
    paddingHorizontal: 24,
  },
  searchInput: {
    color: "#0D132B",
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 18,
    lineHeight: 24,
    padding: 0,
  },
  languageCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F0F1F6",
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 22,
    minHeight: 102,
    paddingHorizontal: 18,
  },
  languageCardSelected: {
    backgroundColor: "#F7F5FF",
    borderColor: "#8B66FF",
    borderWidth: 2,
  },
  flagCircle: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EFF0F5",
    borderRadius: 28,
    borderWidth: 1.5,
    height: 56,
    justifyContent: "center",
    overflow: "hidden",
    width: 56,
  },
  checkCircle: {
    alignItems: "center",
    backgroundColor: "#6C4EF5",
    borderColor: "#8B66FF",
    borderRadius: 19,
    borderWidth: 3,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  confirmButton: {
    backgroundColor: "#5B3BF6",
    borderCurve: "continuous",
    borderRadius: 24,
    paddingVertical: 20,
  },
  earthFrame: {
    alignSelf: "center",
    height: 210,
    marginBottom: -34,
    marginHorizontal: -28,
    marginTop: -6,
    overflow: "hidden",
  },
  earthImage: {
    alignSelf: "center",
    position: "absolute",
    top: -44,
  },
});
