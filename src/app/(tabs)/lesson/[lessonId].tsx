import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CallAction = {
  androidIcon: AndroidSymbol;
  icon: SFSymbol;
  label: string;
  tintColor: string;
  variant?: "danger";
};

const callActions: CallAction[] = [
  {
    androidIcon: "videocam",
    icon: "video.fill",
    label: "Camera",
    tintColor: "#07112F",
  },
  {
    androidIcon: "mic",
    icon: "mic.fill",
    label: "Mic",
    tintColor: "#07112F",
  },
  {
    androidIcon: "translate",
    icon: "character.book.closed.fill",
    label: "Subtitles",
    tintColor: "#07112F",
  },
  {
    androidIcon: "call_end",
    icon: "phone.down.fill",
    label: "End Call",
    tintColor: "#FFFFFF",
    variant: "danger",
  },
];

export default function AudioLessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = lessons.find((item) => item.id === lessonId);
  const language = languages.find((item) => item.id === lesson?.languageId);
  const phrasePreview = lesson?.phrases[0]?.text ?? lesson?.title;
  const goToLessons = () => {
    router.replace("/learn");
  };

  if (!lesson || !language) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "AI Teacher" }} />
        <View className="flex-1 items-center justify-center gap-[16px] px-[28px]">
          <Text className="text-center font-poppins-semibold text-[24px] leading-[31px] text-[#07112F]">
            Lesson not found
          </Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={goToLessons}
            style={styles.backToLessonsButton}
          >
            <Text className="font-poppins-semibold text-[17px] leading-[23px] text-white">
              Back to lessons
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "AI Teacher" }} />

      <View className="flex-1 bg-white px-[10px] pt-[2px]">
        <View className="flex-row items-center justify-between px-[10px] pb-[9px]">
          <View className="flex-row items-center">
            <TouchableOpacity
              accessibilityLabel="Back to lessons"
              activeOpacity={0.74}
              onPress={goToLessons}
              style={styles.headerBackButton}
            >
              <SymbolView
                fallback={<Text className="font-poppins-bold text-[30px] text-[#07112F]">‹</Text>}
                name={{ android: "arrow_back", ios: "chevron.left" }}
                size={28}
                tintColor="#07112F"
                weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
              />
            </TouchableOpacity>

            <View className="max-w-[136px] pl-[8px]">
              <Text
                className="font-poppins-semibold text-[20px] leading-[25px] text-[#07112F]"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                AI Teacher
              </Text>
              <View className="flex-row items-center gap-[7px]">
                <View className="h-[12px] w-[12px] rounded-full bg-[#19D30E]" />
                <Text
                  className="font-poppins-medium text-[14px] leading-[19px] text-[#59627F]"
                  numberOfLines={1}
                >
                  Online
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-[6px]">
            <HeaderIcon androidIcon="videocam" icon="video.fill" />
            <View style={styles.lessonCountBadge}>
              <Text className="font-poppins-semibold text-[18px] leading-[24px] text-[#07112F]">
                {lesson.order + 11}
              </Text>
            </View>
            <HeaderIcon androidIcon="notifications" icon="bell.fill" />
          </View>
        </View>

        <View style={styles.teacherStage}>
          <Image resizeMode="cover" source={images.cafeHero} style={styles.stageBackground} />
          <View style={styles.stageOverlay} />

          <View style={styles.teacherPreview}>
            <Image resizeMode="cover" source={images.teacherAvatar} style={styles.teacherImage} />
          </View>

          <Image
            className="absolute left-[8px] top-[42px] h-[360px] w-[360px]"
            resizeMode="contain"
            source={images.mascotWelcomeTransparent}
          />

          <View style={styles.responseBubble}>
            <View className="flex-1 gap-[5px]">
              <Text
                className="font-poppins-semibold text-[16px] leading-[21px] text-[#07112F]"
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {phrasePreview}
              </Text>
              <Text
                className="font-poppins-medium text-[13px] leading-[18px] text-[#07112F]"
                numberOfLines={3}
                adjustsFontSizeToFit
                minimumFontScale={0.76}
              >
                {lesson.aiTeacherPrompt.openingLine}
              </Text>
            </View>
            <SymbolView
              fallback={<Text className="font-poppins-bold text-[24px] text-[#5B3BF6]">♪</Text>}
              name={{ android: "volume_up", ios: "speaker.wave.2.fill" }}
              size={25}
              tintColor="#5B3BF6"
              weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
            />
            <View style={styles.bubbleTail} />
          </View>

          <View className="absolute bottom-[132px] left-0 right-0 flex-row justify-center gap-[22px] px-[14px]">
            {callActions.map((action) => (
              <TouchableOpacity
                accessibilityLabel={action.label}
                activeOpacity={0.78}
                key={action.label}
                style={styles.callActionWrapper}
              >
                <View
                  style={[
                    styles.callActionButton,
                    action.variant === "danger" && styles.endCallButton,
                  ]}
                >
                  <SymbolView
                    fallback={
                      <Text
                        className="font-poppins-bold text-[22px]"
                        style={{ color: action.tintColor }}
                      >
                        {action.label.charAt(0)}
                      </Text>
                    }
                    name={{ android: action.androidIcon, ios: action.icon }}
                    size={30}
                    tintColor={action.tintColor}
                    weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
                  />
                </View>
                <Text className="text-center font-poppins-semibold text-[12px] leading-[17px] text-white">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.feedbackCard}>
            <FeedbackMetric label="Speaking" value="Excellent" valueColor="#19D30E" />
            <View style={styles.feedbackDivider} />
            <FeedbackMetric label="Pronunciation" value="Great" valueColor="#0087FF" />
            <View style={styles.feedbackDivider} />
            <FeedbackMetric label="Grammar" value="Good" valueColor="#5835FF" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type HeaderIconProps = {
  androidIcon: AndroidSymbol;
  icon: SFSymbol;
};

function HeaderIcon({ androidIcon, icon }: HeaderIconProps) {
  return (
    <TouchableOpacity activeOpacity={0.76} style={styles.headerIconButton}>
      <SymbolView
        fallback={<Text className="font-poppins-bold text-[18px] text-[#07112F]">•</Text>}
        name={{ android: androidIcon, ios: icon }}
        size={22}
        tintColor="#07112F"
        weight={{ android: { font: 500, name: "regular" }, ios: "semibold" }}
      />
    </TouchableOpacity>
  );
}

type FeedbackMetricProps = {
  label: string;
  value: string;
  valueColor: string;
};

function FeedbackMetric({ label, value, valueColor }: FeedbackMetricProps) {
  return (
    <View className="flex-1 items-center justify-center gap-[12px]">
      <Text className="font-poppins-medium text-[14px] leading-[19px] text-[#07112F]">
        {label}
      </Text>
      <Text
        className="font-poppins-semibold text-[14px] leading-[19px]"
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  backToLessonsButton: {
    alignItems: "center",
    backgroundColor: "#5B3BF6",
    borderRadius: 17,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 22,
  },
  headerBackButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 32,
  },
  headerIconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#ECEEF6",
    borderRadius: 21,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  lessonCountBadge: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#ECEEF6",
    borderRadius: 21,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  teacherStage: {
    backgroundColor: "#B8B2AF",
    borderCurve: "continuous",
    borderRadius: 24,
    flex: 1,
    marginBottom: 2,
    overflow: "hidden",
    position: "relative",
  },
  stageBackground: {
    height: "100%",
    opacity: 0.62,
    position: "absolute",
    width: "100%",
  },
  stageOverlay: {
    backgroundColor: "rgba(178, 171, 169, 0.22)",
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  teacherPreview: {
    backgroundColor: "#F4EEE8",
    borderColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 3,
    height: 132,
    overflow: "hidden",
    position: "absolute",
    right: 16,
    top: 22,
    width: 124,
  },
  teacherImage: {
    height: "100%",
    width: "100%",
  },
  responseBubble: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E7EE",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    bottom: 234,
    boxShadow: "0 2px 6px rgba(26, 31, 55, 0.08)",
    flexDirection: "row",
    gap: 12,
    left: 34,
    minHeight: 96,
    paddingHorizontal: 22,
    paddingVertical: 12,
    position: "absolute",
    right: 34,
  },
  bubbleTail: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E6E7EE",
    borderBottomWidth: 1,
    borderRightColor: "#E6E7EE",
    borderRightWidth: 1,
    bottom: -11,
    height: 24,
    position: "absolute",
    right: 28,
    transform: [{ rotate: "45deg" }],
    width: 24,
  },
  callActionWrapper: {
    alignItems: "center",
    gap: 9,
    width: 66,
  },
  callActionButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  endCallButton: {
    backgroundColor: "#FF4247",
  },
  feedbackCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 18,
    bottom: 16,
    flexDirection: "row",
    height: 106,
    left: 20,
    paddingHorizontal: 8,
    position: "absolute",
    right: 20,
  },
  feedbackDivider: {
    backgroundColor: "#ECEEF6",
    height: 74,
    width: 2,
  },
});
