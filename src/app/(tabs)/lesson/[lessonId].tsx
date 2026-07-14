import { Redirect, useLocalSearchParams } from "expo-router";

export default function AudioLessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();

  return (
    <Redirect
      href={{
        pathname: "/ai-teacher",
        params: typeof lessonId === "string" ? { lessonId } : {},
      }}
    />
  );
}
