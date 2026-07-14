import { AudioLessonCall } from "@/components/audio-lesson-call";
import { lessons } from "@/data/lessons";
import { useLanguageStore } from "@/store/language-store";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AiTeacherScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const selectedLesson =
    typeof lessonId === "string" ? lessons.find((item) => item.id === lessonId) : undefined;
  const defaultLesson = lessons
    .filter(
      (item) =>
        item.languageId === selectedLanguageId &&
        (item.kind === "ai-teacher" || item.kind === "audio"),
    )
    .sort((firstLesson, secondLesson) => firstLesson.order - secondLesson.order)[0];
  const lesson =
    selectedLesson?.languageId === selectedLanguageId ? selectedLesson : defaultLesson;

  return (
    <AudioLessonCall
      lesson={lesson}
      onBackPress={() => {
        router.replace("/learn");
      }}
      selectedLanguageId={selectedLanguageId}
    />
  );
}
