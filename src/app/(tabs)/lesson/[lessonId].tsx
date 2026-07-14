import { AudioLessonCall } from "@/components/audio-lesson-call";
import { lessons } from "@/data/lessons";
import { useLanguageStore } from "@/store/language-store";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AudioLessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = lessons.find((item) => item.id === lessonId);
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);

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
