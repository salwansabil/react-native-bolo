import { getLessonImage, images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { units } from "@/data/units";
import { useLanguageStore } from "@/store/language-store";
import type { Lesson } from "@/types/learning";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LessonStatus = "completed" | "in-progress" | "upcoming";

const statusByOrder: Record<number, LessonStatus> = {
  1: "in-progress",
};

export default function LearnScreen() {
  const router = useRouter();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
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
  const activeLesson = unitLessons[0];
  const completedCount = unitLessons.filter(
    (lesson) => statusByOrder[lesson.order] === "completed",
  ).length;

  const handleLessonPress = (lesson: Lesson) => {
    router.push({
      pathname: "/lesson/[lessonId]",
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
              className="font-poppins-semibold text-[24px] leading-[31px] text-[#07112F]"
              numberOfLines={1}
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
          <Image resizeMode="cover" source={images.cafeHero} style={styles.heroImage} />
          <View className="absolute left-0 top-[76px] h-[142px] w-[196px] rounded-r-full bg-[#DFF3FF]/90" />
          <View className="absolute bottom-0 left-0 right-0 h-[86px] bg-[#EFD1A5]/80" />
          <View className="absolute bottom-[50px] right-[-8px] h-[124px] w-[216px] rounded-t-[14px] border-[3px] border-[#8C5636] bg-[#9D643D]" />
          <View className="absolute bottom-[122px] right-[-5px] h-[28px] w-[218px] rounded-t-[8px] bg-[#C7473B]" />
          <View className="absolute bottom-[104px] right-[-5px] h-[28px] w-[218px] rounded-b-[14px] bg-[#F17677]" />
          <Text className="absolute bottom-[128px] right-[78px] rotate-[-2deg] font-poppins-bold text-[20px] leading-[25px] text-[#F7D15C]">
            CAFÉ
          </Text>
          <View className="absolute bottom-[42px] left-[178px] h-[49px] w-[112px] rounded-full bg-[#9C6B42]" />
          <Image
            className="absolute bottom-[40px] left-[110px] h-[162px] w-[162px]"
            resizeMode="contain"
            source={images.mascotWelcomeTransparent}
          />
          <View className="absolute bottom-[72px] left-[234px] h-[30px] w-[42px] rounded-full bg-[#F4D7A1]" />
          <View className="absolute bottom-[85px] left-[238px] h-[12px] w-[35px] rounded-b-full bg-[#FFFFFF]" />
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
              status={statusByOrder[lesson.order] ?? "upcoming"}
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
          className="font-poppins-semibold text-[20px] leading-[26px] text-[#07112F]"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        {!isComplete ? (
          <Text
            className={[
              "font-poppins-semibold text-[16px] leading-[21px]",
              isActive ? "text-[#5B3BF6]" : "text-[#8A91AA]",
            ].join(" ")}
          >
            {isActive ? "In progress" : "0 / 6 lessons"}
          </Text>
        ) : null}
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
    height: 278,
    marginTop: 4,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    height: "100%",
    opacity: 0.32,
    position: "absolute",
    width: "100%",
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
