import { AudioLessonCall } from "@/components/audio-lesson-call";
import { lessons } from "@/data/lessons";
import { useLanguageStore } from "@/store/language-store";
import { useRouter } from "expo-router";

export default function AiTeacherScreen() {
  const router = useRouter();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const lesson = lessons
    .filter(
      (item) =>
        item.languageId === selectedLanguageId &&
        (item.kind === "ai-teacher" || item.kind === "audio"),
    )
    .sort((firstLesson, secondLesson) => firstLesson.order - secondLesson.order)[0];

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
