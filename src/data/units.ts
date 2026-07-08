import type { LearningUnit } from "@/types/learning";

export const units = [
  {
    id: "es-basics-1",
    languageId: "es",
    title: "Spanish Basics 1",
    description: "Say hello, introduce yourself, and use polite words.",
    level: "beginner",
    order: 1,
    lessonIds: ["es-greetings", "es-polite-words"],
  },
  {
    id: "fr-basics-1",
    languageId: "fr",
    title: "French Basics 1",
    description: "Practice greetings and polite first conversations.",
    level: "beginner",
    order: 1,
    lessonIds: ["fr-greetings", "fr-polite-words"],
  },
  {
    id: "ja-basics-1",
    languageId: "ja",
    title: "Japanese Basics 1",
    description: "Learn simple greetings and useful classroom phrases.",
    level: "beginner",
    order: 1,
    lessonIds: ["ja-greetings", "ja-polite-words"],
  },
] satisfies LearningUnit[];
