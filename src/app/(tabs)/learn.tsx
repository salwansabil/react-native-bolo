import { getLessonImage, images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { units } from "@/data/units";
import { useLanguageStore } from "@/store/language-store";
import { useLessonProgressStore } from "@/store/lesson-progress-store";
import type { Lesson } from "@/types/learning";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LessonStatus = "completed" | "in-progress" | "upcoming";

export default function LearnScreen() {
  const router = useRouter();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const completedLessonIds = useLessonProgressStore((state) => state.completedLessonIds);
  const selectedLanguage =
    languages.find((language) => language.id === selectedLanguageId) ?? languages[0];
  const currentUnit = units
    .filter((unit) => unit.languageId === selectedLanguage.id)
    .sort((firstUnit, secondUnit) => firstUnit.order - secondUnit.order)[0];
  const unitLessons = currentUnit
    ? currentUnit.lessonIds
        .map((lessonId) => lessons.find((lesson) => lesson.id === lessonId))
        .filter((lesson): lesson is Lesson => Boolean(lesson))
    : [];
  const completedLessonIdSet = new Set(completedLessonIds);
  const firstIncompleteLesson = unitLessons.find(
    (lesson) => !completedLessonIdSet.has(lesson.id),
  );
  const activeLesson =
    firstIncompleteLesson ?? unitLessons[unitLessons.length - 1] ?? unitLessons[0];
  const completedCount = unitLessons.filter((lesson) =>
    completedLessonIdSet.has(lesson.id),
  ).length;

  const getLessonStatus = (lesson: Lesson): LessonStatus => {
    if (completedLessonIdSet.has(lesson.id)) {
      return "completed";
    }

    return lesson.id === firstIncompleteLesson?.id ? "in-progress" : "upcoming";
  };

  const handleLessonPress = (lesson: Lesson) => {
    router.push({
      pathname: "/ai-teacher",
      params: { lessonId: lesson.id },
    });
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between px-[24px] pt-[2px]">
          <TouchableOpacity
            accessibilityLabel="Go back"
            activeOpacity={0.74}
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[28px] text-[#07112F]">‹</Text>}
              name={{ android: "arrow_back", ios: "chevron.left" }}
              size={31}
              tintColor="#07112F"
              weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
            />
          </TouchableOpacity>

          <View className="flex-1 pl-[20px] pt-[4px]">
            <Text
              className="font-poppins-semibold text-[20px] leading-[26px] text-[#07112F]"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {activeLesson?.title ?? currentUnit?.title ?? "At the Café"}
            </Text>
            <Text className="font-poppins-medium text-[19px] leading-[28px] text-[#717895]">
              Unit {currentUnit?.order ?? 1} • {completedCount} / {unitLessons.length} lessons
            </Text>
          </View>

          <View className="h-[42px] w-[42px] items-center justify-center">
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[24px] text-[#6C4EF5]">⚑</Text>}
              name={{ android: "bookmark", ios: "bookmark.fill" }}
              size={35}
              tintColor="#6C4EF5"
              weight={{ android: { font: 500, name: "regular" }, ios: "regular" }}
            />
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBackdrop} />
          <View className="absolute bottom-0 left-0 right-0 h-[96px] bg-[#DDF7EF]" />
          <View className="absolute left-[-28px] top-[72px] h-[104px] w-[170px] rounded-r-[44px] bg-[#BEEBFF]/75" />
          <View className="absolute right-[-18px] top-[22px] h-[72px] w-[176px] rounded-l-[28px] bg-[#FFE9A9]/85" />
          <Image
            resizeMode="contain"
            source={images.earthTransparent}
            style={styles.heroGlobe}
          />
          <View style={styles.heroMessageCard}>
            <Text className="font-poppins-bold text-[18px] leading-[23px] text-[#07112F]">
              Ready to learn
            </Text>
            <Text
              className="font-poppins-medium text-[14px] leading-[19px] text-[#68718E]"
              numberOfLines={1}
            >
              Practice is ready.
            </Text>
          </View>
          <View style={styles.heroFlagCard}>
            <Text className="text-[28px] leading-[34px]">{selectedLanguage.flagEmoji}</Text>
          </View>
          <Image
            className="absolute bottom-[20px] left-[118px] h-[160px] w-[160px]"
            resizeMode="contain"
            source={images.mascotWelcomeTransparent}
          />
        </View>

        <View style={styles.segmentedControl}>
          <TouchableOpacity activeOpacity={0.82} style={[styles.segment, styles.segmentActive]}>
            <Text className="font-poppins-semibold text-[20px] leading-[26px] text-[#5B3BF6]">
              Lessons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.82} style={styles.segment}>
            <Text className="font-poppins-medium text-[20px] leading-[26px] text-[#68718E]">
              Practice
            </Text>
          </TouchableOpacity>
        </View>

        <View className="gap-[10px] px-[26px] pt-[15px]">
          {unitLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPress={() => handleLessonPress(lesson)}
              status={getLessonStatus(lesson)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type LessonCardProps = {
  lesson: Lesson;
  onPress: () => void;
  status: LessonStatus;
};

function LessonCard({ lesson, onPress, status }: LessonCardProps) {
  const isActive = status === "in-progress";
  const isComplete = status === "completed";

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.lessonCard, isActive && styles.lessonCardActive]}
    >
      <View className="flex-1 gap-[8px]">
        <Text
          className={[
            "font-poppins-semibold text-[16px] leading-[21px]",
            isActive ? "text-[#5B3BF6]" : "text-[#8A91AA]",
          ].join(" ")}
        >
          Lesson {lesson.order}
        </Text>
        <Text
          className="font-poppins-semibold text-[18px] leading-[24px] text-[#07112F]"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.84}
        >
          {lesson.title}
        </Text>
        <Text
          className={[
            "font-poppins-semibold text-[16px] leading-[21px]",
            isActive ? "text-[#5B3BF6]" : "text-[#8A91AA]",
          ].join(" ")}
          numberOfLines={1}
        >
          {isComplete ? "Completed" : isActive ? "In progress" : "0 / 6 lessons"} •{" "}
          {lesson.xpReward} XP
        </Text>
      </View>

      <View className="w-[58px] items-center justify-center">
        {isComplete ? (
          <View style={styles.completeBadge}>
            <Text className="font-poppins-bold text-[26px] leading-[29px] text-white">✓</Text>
          </View>
        ) : isActive ? (
          <Image
            className="h-[50px] w-[50px]"
            resizeMode="contain"
            source={getLessonImage(lesson.order)}
          />
        ) : (
          <SymbolView
            fallback={<Text className="font-poppins-bold text-[25px] text-[#68718E]">⌑</Text>}
            name={{ android: "lock", ios: "lock.fill" }}
            size={31}
            tintColor="#68718E"
            weight={{ android: { font: 400, name: "regular" }, ios: "regular" }}
          />
        )}
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
    paddingBottom: 124,
  },
  backButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 38,
  },
  hero: {
    backgroundColor: "#F6FBFF",
    height: 278,
    marginTop: 4,
    overflow: "hidden",
    position: "relative",
  },
  heroBackdrop: {
    backgroundColor: "#EAF8FF",
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  heroFlagCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderColor: "rgba(91, 59, 246, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: "0 10px 24px rgba(42, 39, 77, 0.12)",
    height: 54,
    justifyContent: "center",
    position: "absolute",
    right: 38,
    top: 36,
    width: 58,
  },
  heroGlobe: {
    height: 186,
    opacity: 0.2,
    position: "absolute",
    right: -22,
    top: 52,
    width: 186,
  },
  heroMessageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "rgba(91, 59, 246, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: "0 12px 28px rgba(42, 39, 77, 0.12)",
    left: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: "absolute",
    top: 32,
    width: 198,
  },
  segmentedControl: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 19,
    boxShadow: "0 10px 24px rgba(42, 39, 77, 0.11)",
    flexDirection: "row",
    height: 78,
    marginTop: -29,
    overflow: "hidden",
    width: "92%",
  },
  segment: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },
  segmentActive: {
    borderBottomColor: "#5B3BF6",
    borderBottomWidth: 4,
  },
  lessonCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EDF0F8",
    borderCurve: "continuous",
    borderRadius: 17,
    borderWidth: 1.5,
    boxShadow: "0 2px 8px rgba(31, 38, 70, 0.03)",
    flexDirection: "row",
    minHeight: 112,
    paddingHorizontal: 25,
  },
  lessonCardActive: {
    backgroundColor: "#FFFDFF",
    borderColor: "#8B72FF",
    borderWidth: 2,
  },
  completeBadge: {
    alignItems: "center",
    backgroundColor: "#23C51C",
    borderColor: "#ECFFF0",
    borderRadius: 17,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
});
