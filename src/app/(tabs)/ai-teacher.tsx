import { AudioLessonCall } from "@/components/audio-lesson-call";
import { lessons } from "@/data/lessons";
import { useLanguageStore } from "@/store/language-store";
import { useRouter } from "expo-router";

export default function AiTeacherScreen() {
  const router = useRouter();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const lesson =
    lessons.find(
      (item) =>
        item.languageId === selectedLanguageId &&
        (item.kind === "ai-teacher" || item.kind === "audio") &&
        item.order === 3,
    ) ??
    lessons.find(
      (item) =>
        item.languageId === selectedLanguageId &&
        (item.kind === "ai-teacher" || item.kind === "audio"),
    );

  return (
    <AudioLessonCall
      lesson={lesson}
      onBackPress={() => {
        router.replace("/learn");
      }}
    />
  );
}
