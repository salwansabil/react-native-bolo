import { posthog } from "@/config/posthog";
import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { units } from "@/data/units";
import { useLanguageStore } from "@/store/language-store";
import { useLessonProgressStore } from "@/store/lesson-progress-store";
import { useStreakStore } from "@/store/streak-store";
import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { AppState, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const DAILY_GOAL_XP = 20;

const lessonIcon = {
  android: "menu_book",
  ios: "book.fill",
} as const;

const audioIcon = {
  android: "headphones",
  ios: "headphones",
} as const;

const wordsIcon = {
  android: "chat_bubble",
  ios: "quote.bubble.fill",
} as const;

const videoIcon = {
  android: "videocam",
  ios: "video.fill",
} as const;

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const completedLessonIds = useLessonProgressStore((state) => state.completedLessonIds);
  const totalXp = useLessonProgressStore((state) => state.totalXp);
  const hasHydratedStreak = useStreakStore((state) => state.hasHydrated);
  const streak = useStreakStore((state) => state.streak);
  const syncStreak = useStreakStore((state) => state.syncStreak);
  const selectedLanguage =
    languages.find((language) => language.id === selectedLanguageId) ?? languages[0];
  const currentUnit = units
    .filter((unit) => unit.languageId === selectedLanguage.id)
    .sort((firstUnit, secondUnit) => firstUnit.order - secondUnit.order)[0];
  const unitLessons = lessons
    .filter((lesson) => lesson.unitId === currentUnit?.id)
    .sort((firstLesson, secondLesson) => firstLesson.order - secondLesson.order);
  const completedLessonIdSet = new Set(completedLessonIds);
  const currentLesson =
    unitLessons.find((lesson) => !completedLessonIdSet.has(lesson.id)) ??
    unitLessons[unitLessons.length - 1] ??
    unitLessons[0];
  const dailyLifeLesson = unitLessons.find((lesson) => lesson.order === 2);
  const cafeLesson = unitLessons.find((lesson) => lesson.order === 3);
  const vocabularyCount = currentLesson?.vocabulary.length ?? 0;
  const firstName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ??
    "Learner";
  const localizedGreeting = selectedLanguage.beginnerGreeting
    .replace(/^¡/, "")
    .replace(/[!！。]+$/, "");
  const unitLabel = currentUnit
    ? `A1 · Unit ${currentUnit.order}`
    : "A1 · Unit 1";
  const unitGoalXp = Math.max(DAILY_GOAL_XP, unitLessons.length * 10);
  const progressPercent = `${Math.min(100, (totalXp / unitGoalXp) * 100)}%` as `${number}%`;

  useEffect(() => {
    if (!hasHydratedStreak) {
      return;
    }

    syncStreak();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncStreak();
      }
    });

    return () => subscription.remove();
  }, [hasHydratedStreak, syncStreak]);

  const handleContinuePress = () => {
    posthog.capture("continue_learning_pressed", {
      language_id: selectedLanguage?.id,
      language_name: selectedLanguage?.name,
      unit_order: currentUnit?.order,
    });
    router.push("/learn");
  };

  const handleViewAllPress = () => {
    posthog.capture("view_all_lessons_pressed", {
      language_id: selectedLanguage?.id,
      language_name: selectedLanguage?.name,
    });
    router.push("/learn");
  };

  const handleStartVideoPress = () => {
    posthog.capture("ai_video_call_pressed", {
      language_id: selectedLanguage?.id,
      language_name: selectedLanguage?.name,
    });
    router.push("/ai-teacher");
  };

  const handleLessonPress = () => {
    if (!cafeLesson) {
      return;
    }

    posthog.capture("lesson_selected", {
      language_id: selectedLanguage.id,
      lesson_id: cafeLesson.id,
      lesson_order: cafeLesson.order,
      lesson_title: cafeLesson.title,
    });
    router.push({
      pathname: "/lesson/[lessonId]",
      params: { lessonId: cafeLesson.id },
    });
  };

  const handleConversationPress = () => {
    if (!dailyLifeLesson) {
      return;
    }

    posthog.capture("lesson_selected", {
      language_id: selectedLanguage.id,
      lesson_id: dailyLifeLesson.id,
      lesson_order: dailyLifeLesson.order,
      lesson_title: dailyLifeLesson.title,
      source: "home_ai_conversation",
    });
    router.push({
      pathname: "/lesson/[lessonId]",
      params: { lessonId: dailyLifeLesson.id },
    });
  };

  const handleSignOut = async () => {
    posthog.capture("sign_out_pressed");
    await signOut();
    router.replace("/onboarding");
  };

  const handleChangeLanguage = () => {
    posthog.capture("change_language_pressed", {
      current_language_id: selectedLanguage.id,
      current_language_name: selectedLanguage.name,
    });
    router.push("/language-selection");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 flex-row items-center gap-[14px]">
            <View className="h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-[#FFF1E8]">
              <Text className="text-[32px] leading-[38px]">
                {selectedLanguage.flagEmoji}
              </Text>
            </View>
            <Text
              className="min-w-0 flex-1 font-poppins-semibold text-[20px] leading-[26px] text-lingua-text-primary"
              numberOfLines={1}
            >
              {localizedGreeting}, {firstName}! 👋
            </Text>
          </View>

          <View className="flex-row items-center gap-[6px]">
            <View className="flex-row items-center gap-[7px]">
              <Image
                className="h-[32px] w-[32px]"
                resizeMode="contain"
                source={images.streakFire}
              />
              <Text className="font-poppins-semibold text-[19px] leading-[25px] text-[#37405C]">
                {Math.max(streak, 1)}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityLabel="Change language"
              accessibilityRole="button"
              activeOpacity={0.68}
              onPress={handleChangeLanguage}
              style={styles.iconButton}
            >
              <SymbolView
                fallback={
                  <Text className="font-poppins-semibold text-[11px] text-[#6E7690]">
                    Lang
                  </Text>
                }
                name={{ android: "language", ios: "globe" }}
                size={24}
                tintColor="#6E7690"
                weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel="Sign out"
              accessibilityRole="button"
              activeOpacity={0.68}
              onPress={() => void handleSignOut()}
              style={styles.iconButton}
            >
              <SymbolView
                fallback={
                  <Text className="font-poppins-semibold text-[12px] text-[#6E7690]">
                    Exit
                  </Text>
                }
                name={{
                  android: "logout",
                  ios: "rectangle.portrait.and.arrow.right",
                }}
                size={24}
                tintColor="#6E7690"
                weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dailyGoalCard}>
          <View className="flex-1 gap-[12px]">
            <Text className="font-poppins-semibold text-[18px] leading-[24px] text-[#28314E]">
              XP earned
            </Text>
            <Text className="font-poppins-bold text-[32px] leading-[38px] text-[#121A35]">
              {totalXp}
              <Text className="font-poppins-semibold text-[19px] leading-[25px] text-[#7B859E]">
                {" "}
                / {unitGoalXp} XP
              </Text>
            </Text>
            <View className="h-[9px] w-full overflow-hidden rounded-full bg-[#FFE6CE]">
              <View
                className="h-full rounded-full bg-[#FF7A12]"
                style={{ width: progressPercent }}
              />
            </View>
          </View>

          <Image
            className="h-[108px] w-[118px]"
            resizeMode="contain"
            source={images.treasure}
          />
        </View>

        <View style={styles.continueCard}>
          <View className="z-10 flex-1 gap-[7px]">
            <Text className="font-poppins-medium text-[18px] leading-[24px] text-white">
              Continue learning
            </Text>
            <Text className="font-poppins-semibold text-[30px] leading-[38px] text-white">
              {selectedLanguage.name}
            </Text>
            <Text className="font-poppins-medium text-[20px] leading-[26px] text-white">
              {unitLabel}
            </Text>
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={handleContinuePress}
              style={styles.continueButton}
            >
              <Text className="font-poppins-semibold text-[18px] leading-[24px] text-lingua-deep-purple">
                Continue
              </Text>
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-0 right-0 h-[166px] w-[250px] overflow-hidden rounded-br-[22px]">
            <View className="absolute bottom-0 left-0 h-[80px] w-[260px] rounded-t-[92px] bg-[#6C55DD]" />
            <View className="absolute bottom-0 left-[48px] h-[106px] w-[88px] rounded-t-[48px] bg-[#4B3EBF]" />
            <View className="absolute bottom-[4px] left-[118px] h-[130px] w-[70px] rotate-[18deg] rounded-t-[48px] bg-[#745BDB]" />
            <Image
              className="absolute bottom-[-3px] right-[-4px] h-[168px] w-[178px]"
              resizeMode="contain"
              source={images.palaceTransparent}
            />
          </View>
        </View>

        <View className="gap-[24px]">
          <View className="flex-row items-center justify-between">
            <Text className="font-poppins-semibold text-[21px] leading-[28px] text-lingua-text-primary">
              {"Today's plan"}
            </Text>
            <TouchableOpacity activeOpacity={0.72} onPress={handleViewAllPress}>
              <Text className="font-poppins-semibold text-[20px] leading-[26px] text-lingua-deep-purple">
                View all
              </Text>
            </TouchableOpacity>
          </View>

          <View className="gap-[26px]">
            <PlanItem
              description={cafeLesson?.title ?? "At the Café"}
              icon={lessonIcon}
              isComplete={Boolean(cafeLesson && completedLessonIdSet.has(cafeLesson.id))}
              onPress={handleLessonPress}
              title="Lesson"
            />
            <PlanItem
              description={dailyLifeLesson?.title ?? "Daily Life"}
              icon={audioIcon}
              isComplete={Boolean(
                dailyLifeLesson && completedLessonIdSet.has(dailyLifeLesson.id),
              )}
              onPress={handleConversationPress}
              title="AI Conversation"
            />
            <PlanItem
              description={`${Math.max(vocabularyCount, 1)} words`}
              icon={wordsIcon}
              title="New words"
            />
          </View>
        </View>

        <View style={styles.nextUpCard}>
          <View className="flex-1 gap-[6px]">
            <Text className="font-poppins-medium text-[16px] leading-[22px] text-[#6E7791]">
              Next up
            </Text>
            <Text className="font-poppins-semibold text-[22px] leading-[29px] text-lingua-text-primary">
              AI Video Call
            </Text>
            <Text className="font-poppins-medium text-[16px] leading-[22px] text-[#6E7791]">
              Practice speaking
            </Text>
          </View>

          <Image
            className="h-[92px] w-[92px] rounded-full"
            resizeMode="cover"
            source={images.teacherAvatar}
          />

          <TouchableOpacity
            accessibilityLabel="Start AI video call"
            activeOpacity={0.82}
            onPress={handleStartVideoPress}
            style={styles.videoButton}
          >
            <SymbolView
              fallback={
                <Text className="font-poppins-bold text-[18px] leading-[22px] text-white">
                  ▶
                </Text>
              }
              name={videoIcon}
              size={29}
              tintColor="#FFFFFF"
              weight={{ android: { font: 600, name: "regular" }, ios: "semibold" }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type PlanItemProps = {
  description: string;
  icon: {
    android: AndroidSymbol;
    ios: SFSymbol;
  };
  isComplete?: boolean;
  onPress?: () => void;
  title: string;
};

function PlanItem({ description, icon, isComplete = false, onPress, title }: PlanItemProps) {
  return (
    <TouchableOpacity
      accessibilityRole={onPress ? "button" : undefined}
      activeOpacity={onPress ? 0.72 : 1}
      className="flex-row items-center gap-[22px]"
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={styles.planIcon}>
        <SymbolView
          fallback={
            <Text className="font-poppins-bold text-[18px] leading-[22px] text-white">
              {title.charAt(0)}
            </Text>
          }
          name={icon}
          size={29}
          tintColor="#FFFFFF"
          weight={{ android: { font: 600, name: "regular" }, ios: "semibold" }}
        />
      </View>

      <View className="flex-1 gap-[4px]">
        <Text className="font-poppins-semibold text-[18px] leading-[24px] text-lingua-text-primary">
          {title}
        </Text>
        <Text
          className="font-poppins-medium text-[16px] leading-[22px] text-[#7C839F]"
          numberOfLines={1}
        >
          {description}
        </Text>
      </View>

      <View style={[styles.planStatus, isComplete && styles.planStatusComplete]}>
        {isComplete ? (
          <Text className="font-poppins-bold text-[18px] leading-[21px] text-white">
            ✓
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  contentContainer: {
    gap: 28,
    paddingBottom: 118,
    paddingHorizontal: 30,
    paddingTop: 24,
  },
  iconButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  dailyGoalCard: {
    alignItems: "center",
    backgroundColor: "#FFF8F1",
    borderCurve: "continuous",
    borderRadius: 22,
    flexDirection: "row",
    gap: 20,
    minHeight: 154,
    paddingLeft: 24,
    paddingRight: 20,
  },
  continueCard: {
    backgroundColor: "#6C4EF5",
    borderCurve: "continuous",
    borderRadius: 22,
    minHeight: 215,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 25,
  },
  continueButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 61,
    paddingHorizontal: 24,
  },
  planIcon: {
    alignItems: "center",
    backgroundColor: "#6C4EF5",
    borderCurve: "continuous",
    borderRadius: 10,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  planStatus: {
    alignItems: "center",
    borderColor: "#8E96AE",
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  planStatusComplete: {
    backgroundColor: "#6C4EF5",
    borderColor: "#6C4EF5",
  },
  nextUpCard: {
    alignItems: "center",
    backgroundColor: "#F4FBEF",
    borderCurve: "continuous",
    borderRadius: 19,
    flexDirection: "row",
    gap: 14,
    minHeight: 141,
    paddingHorizontal: 23,
  },
  videoButton: {
    alignItems: "center",
    backgroundColor: "#57C915",
    borderRadius: 27,
    height: 55,
    justifyContent: "center",
    width: 55,
  },
});
