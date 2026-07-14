export type LanguageCode = "de" | "es" | "fr" | "ja" | "ko" | "zh";

export type SkillLevel = "beginner" | "elementary" | "intermediate";

export type LessonKind =
  | "ai-teacher"
  | "audio"
  | "chat"
  | "vocabulary"
  | "review";

export type ActivityKind =
  | "listen-and-choose"
  | "match-pairs"
  | "multiple-choice"
  | "speaking"
  | "translate";

export type SupportedLanguage = {
  id: LanguageCode;
  name: string;
  nativeName: string;
  flagEmoji: string;
  learnerCountLabel: string;
  accentColor: string;
  description: string;
  beginnerGreeting: string;
  aiTeacherName: string;
};

export type LearningUnit = {
  id: string;
  languageId: LanguageCode;
  title: string;
  description: string;
  level: SkillLevel;
  order: number;
  lessonIds: string[];
};

export type VocabularyItem = {
  id: string;
  term: string;
  translation: string;
  pronunciation: string;
  partOfSpeech: "expression" | "noun" | "verb" | "adjective";
  example: string;
};

export type PhraseItem = {
  id: string;
  text: string;
  translation: string;
  pronunciation: string;
  context: string;
};

type BaseActivity = {
  id: string;
  kind: ActivityKind;
  prompt: string;
};

export type MultipleChoiceActivity = BaseActivity & {
  kind: "multiple-choice" | "listen-and-choose";
  question: string;
  options: string[];
  correctAnswer: string;
};

export type MatchPairsActivity = BaseActivity & {
  kind: "match-pairs";
  pairs: {
    term: string;
    match: string;
  }[];
};

export type SpeakingActivity = BaseActivity & {
  kind: "speaking";
  phrase: string;
  expectedWords: string[];
};

export type TranslateActivity = BaseActivity & {
  kind: "translate";
  sourceText: string;
  expectedTranslation: string;
};

export type LessonActivity =
  | MatchPairsActivity
  | MultipleChoiceActivity
  | SpeakingActivity
  | TranslateActivity;

export type LessonGoal = {
  id: string;
  text: string;
};

export type AiTeacherPrompt = {
  persona: string;
  systemPrompt: string;
  openingLine: string;
  correctionStyle: string;
  practiceInstructions: string[];
};

export type Lesson = {
  id: string;
  unitId: string;
  languageId: LanguageCode;
  title: string;
  description: string;
  kind: LessonKind;
  level: SkillLevel;
  order: number;
  xpReward: number;
  estimatedMinutes: number;
  goals: LessonGoal[];
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
  activities: LessonActivity[];
  aiTeacherPrompt: AiTeacherPrompt;
};
