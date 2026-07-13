import type { LanguageCode, Lesson, LessonKind } from "@/types/learning";

type LessonSeed = {
  id: string;
  title: string;
  description: string;
  kind: LessonKind;
  order: number;
  focusTerm: string;
  focusTranslation: string;
  samplePhrase: string;
  sampleTranslation: string;
};

const sharedLessonSeeds = [
  {
    id: "cafe",
    title: "At the Café",
    description: "Order a drink and respond politely in a café.",
    kind: "ai-teacher",
    order: 3,
    focusTerm: "coffee",
    focusTranslation: "coffee",
    samplePhrase: "Coffee, please.",
    sampleTranslation: "Coffee, please.",
  },
  {
    id: "travel-directions",
    title: "Travel & Directions",
    description: "Ask where places are and understand simple directions.",
    kind: "audio",
    order: 4,
    focusTerm: "station",
    focusTranslation: "station",
    samplePhrase: "Where is the station?",
    sampleTranslation: "Where is the station?",
  },
  {
    id: "shopping",
    title: "Shopping",
    description: "Ask for prices and name everyday items while shopping.",
    kind: "vocabulary",
    order: 5,
    focusTerm: "how much",
    focusTranslation: "how much",
    samplePhrase: "How much is this?",
    sampleTranslation: "How much is this?",
  },
  {
    id: "family-friends",
    title: "Family & Friends",
    description: "Talk about people close to you with warm simple phrases.",
    kind: "chat",
    order: 6,
    focusTerm: "friend",
    focusTranslation: "friend",
    samplePhrase: "This is my friend.",
    sampleTranslation: "This is my friend.",
  },
] satisfies LessonSeed[];

const firstLessonSeeds = [
  {
    id: "greetings",
    title: "Greetings & Introductions",
    description: "Say hello, goodbye, and introduce yourself.",
    kind: "ai-teacher",
    order: 1,
    focusTerm: "hello",
    focusTranslation: "hello",
    samplePhrase: "Hello, my name is Sam.",
    sampleTranslation: "Hello, my name is Sam.",
  },
  {
    id: "polite-words",
    title: "Daily Life",
    description: "Use polite words in small everyday moments.",
    kind: "vocabulary",
    order: 2,
    focusTerm: "thank you",
    focusTranslation: "thank you",
    samplePhrase: "Thank you very much.",
    sampleTranslation: "Thank you very much.",
  },
  ...sharedLessonSeeds,
] satisfies LessonSeed[];

const extraLessonSeeds = sharedLessonSeeds;

function createLesson(languageId: LanguageCode, unitId: string, seed: LessonSeed): Lesson {
  const lessonId = `${languageId}-${seed.id}`;

  return {
    id: lessonId,
    unitId,
    languageId,
    title: seed.title,
    description: seed.description,
    kind: seed.kind,
    level: "beginner",
    order: seed.order,
    xpReward: 10,
    estimatedMinutes: seed.order === 3 ? 6 : 5,
    goals: [
      {
        id: `${lessonId}-goal-1`,
        text: `Understand one useful ${seed.title.toLowerCase()} phrase.`,
      },
      {
        id: `${lessonId}-goal-2`,
        text: "Practice saying the phrase with confidence.",
      },
    ],
    vocabulary: [
      {
        id: `${lessonId}-vocab-main`,
        term: seed.focusTerm,
        translation: seed.focusTranslation,
        pronunciation: seed.focusTerm,
        partOfSpeech: "expression",
        example: seed.samplePhrase,
      },
      {
        id: `${lessonId}-vocab-please`,
        term: "please",
        translation: "please",
        pronunciation: "please",
        partOfSpeech: "expression",
        example: `${seed.samplePhrase} please.`,
      },
    ],
    phrases: [
      {
        id: `${lessonId}-phrase-main`,
        text: seed.samplePhrase,
        translation: seed.sampleTranslation,
        pronunciation: seed.samplePhrase,
        context: seed.description,
      },
    ],
    activities: [
      {
        id: `${lessonId}-activity-1`,
        kind: "multiple-choice",
        prompt: "Choose the matching meaning.",
        question: `What does "${seed.focusTerm}" mean?`,
        options: [seed.focusTranslation, "good night", "see you tomorrow"],
        correctAnswer: seed.focusTranslation,
      },
      {
        id: `${lessonId}-activity-2`,
        kind: "speaking",
        prompt: "Practice the phrase out loud.",
        phrase: seed.samplePhrase,
        expectedWords: seed.samplePhrase
          .replace(/[?.!,]/g, "")
          .toLowerCase()
          .split(" ")
          .slice(0, 3),
      },
    ],
    aiTeacherPrompt: {
      persona: "Friendly language coach for absolute beginners",
      systemPrompt:
        "Teach one short phrase at a time with clear English explanations and encouraging practice.",
      openingLine: `Let's practice ${seed.title.toLowerCase()} with one useful phrase.`,
      correctionStyle:
        "Praise the learner first, then correct one small pronunciation detail.",
      practiceInstructions: [
        "Model the phrase slowly.",
        "Ask the learner to repeat it.",
        "Use the phrase in a tiny roleplay.",
      ],
    },
  };
}

function createLessons(
  languageId: LanguageCode,
  unitId: string,
  seeds: readonly LessonSeed[],
) {
  return seeds.map((seed) => createLesson(languageId, unitId, seed));
}

export const lessons = [
  {
    id: "es-greetings",
    unitId: "es-basics-1",
    languageId: "es",
    title: "Greetings & Introductions",
    description: "Learn how to say hello, goodbye, and introduce yourself.",
    kind: "ai-teacher",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    goals: [
      { id: "es-greetings-goal-1", text: "Say hello and goodbye in Spanish." },
      { id: "es-greetings-goal-2", text: "Introduce yourself with your name." },
    ],
    vocabulary: [
      {
        id: "es-vocab-hola",
        term: "hola",
        translation: "hello",
        pronunciation: "OH-lah",
        partOfSpeech: "expression",
        example: "Hola, Ana.",
      },
      {
        id: "es-vocab-adios",
        term: "adiós",
        translation: "goodbye",
        pronunciation: "ah-DYOHS",
        partOfSpeech: "expression",
        example: "Adiós, Mateo.",
      },
      {
        id: "es-vocab-llamo",
        term: "me llamo",
        translation: "my name is",
        pronunciation: "meh YAH-moh",
        partOfSpeech: "expression",
        example: "Me llamo Sam.",
      },
    ],
    phrases: [
      {
        id: "es-phrase-hola",
        text: "Hola, me llamo Sam.",
        translation: "Hello, my name is Sam.",
        pronunciation: "OH-lah, meh YAH-moh Sam",
        context: "Use this when meeting someone for the first time.",
      },
      {
        id: "es-phrase-adios",
        text: "Adiós, nos vemos.",
        translation: "Goodbye, see you.",
        pronunciation: "ah-DYOHS, nohs VEH-mohs",
        context: "Use this when leaving a friendly conversation.",
      },
    ],
    activities: [
      {
        id: "es-greetings-activity-1",
        kind: "listen-and-choose",
        prompt: "Listen to the greeting and choose the matching English word.",
        question: "What does 'hola' mean?",
        options: ["hello", "thanks", "goodbye"],
        correctAnswer: "hello",
      },
      {
        id: "es-greetings-activity-2",
        kind: "speaking",
        prompt: "Say your first introduction out loud.",
        phrase: "Hola, me llamo Sam.",
        expectedWords: ["hola", "me", "llamo"],
      },
    ],
    aiTeacherPrompt: {
      persona: "Warm Spanish teacher for absolute beginners",
      systemPrompt:
        "Teach one idea at a time. Use short English explanations, then model clear Spanish pronunciation.",
      openingLine:
        "¡Hola! Today we will practice a friendly Spanish introduction.",
      correctionStyle:
        "Praise the learner first, then correct one pronunciation detail in simple language.",
      practiceInstructions: [
        "Model each phrase slowly.",
        "Ask the learner to repeat after you.",
        "End with a quick roleplay where the learner introduces themself.",
      ],
    },
  },
  {
    id: "es-polite-words",
    unitId: "es-basics-1",
    languageId: "es",
    title: "Daily Life",
    description: "Use polite Spanish words in everyday moments.",
    kind: "vocabulary",
    level: "beginner",
    order: 2,
    xpReward: 10,
    estimatedMinutes: 4,
    goals: [
      { id: "es-polite-goal-1", text: "Say please and thank you in Spanish." },
      { id: "es-polite-goal-2", text: "Respond politely with you're welcome." },
    ],
    vocabulary: [
      {
        id: "es-vocab-por-favor",
        term: "por favor",
        translation: "please",
        pronunciation: "por fah-VOR",
        partOfSpeech: "expression",
        example: "Agua, por favor.",
      },
      {
        id: "es-vocab-gracias",
        term: "gracias",
        translation: "thank you",
        pronunciation: "GRAH-syahs",
        partOfSpeech: "expression",
        example: "Gracias, Ana.",
      },
      {
        id: "es-vocab-de-nada",
        term: "de nada",
        translation: "you're welcome",
        pronunciation: "deh NAH-dah",
        partOfSpeech: "expression",
        example: "De nada.",
      },
    ],
    phrases: [
      {
        id: "es-phrase-cafe",
        text: "Café, por favor.",
        translation: "Coffee, please.",
        pronunciation: "kah-FEH, por fah-VOR",
        context: "Use this when ordering politely.",
      },
    ],
    activities: [
      {
        id: "es-polite-activity-1",
        kind: "match-pairs",
        prompt: "Match each Spanish phrase with its English meaning.",
        pairs: [
          { term: "por favor", match: "please" },
          { term: "gracias", match: "thank you" },
          { term: "de nada", match: "you're welcome" },
        ],
      },
      {
        id: "es-polite-activity-2",
        kind: "translate",
        prompt: "Translate the polite phrase.",
        sourceText: "Thank you.",
        expectedTranslation: "Gracias.",
      },
    ],
    aiTeacherPrompt: {
      persona: "Encouraging Spanish conversation coach",
      systemPrompt:
        "Help the learner use polite Spanish phrases in tiny real-life exchanges.",
      openingLine:
        "Let's make your Spanish sound friendly with please and thank you.",
      correctionStyle:
        "Keep corrections short and focus on confidence before accuracy.",
      practiceInstructions: [
        "Practice each phrase as a call and response.",
        "Create one cafe ordering example.",
        "Ask the learner to choose the polite reply.",
      ],
    },
  },
  {
    id: "fr-greetings",
    unitId: "fr-basics-1",
    languageId: "fr",
    title: "Greetings & Introductions",
    description: "Say hello, goodbye, and introduce yourself in French.",
    kind: "ai-teacher",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    goals: [
      { id: "fr-greetings-goal-1", text: "Say hello and goodbye in French." },
      { id: "fr-greetings-goal-2", text: "Introduce yourself with je m'appelle." },
    ],
    vocabulary: [
      {
        id: "fr-vocab-bonjour",
        term: "bonjour",
        translation: "hello",
        pronunciation: "bohn-ZHOOR",
        partOfSpeech: "expression",
        example: "Bonjour, Marie.",
      },
      {
        id: "fr-vocab-au-revoir",
        term: "au revoir",
        translation: "goodbye",
        pronunciation: "oh ruh-VWAHR",
        partOfSpeech: "expression",
        example: "Au revoir, Paul.",
      },
      {
        id: "fr-vocab-appelle",
        term: "je m'appelle",
        translation: "my name is",
        pronunciation: "zhuh mah-PEL",
        partOfSpeech: "expression",
        example: "Je m'appelle Sam.",
      },
    ],
    phrases: [
      {
        id: "fr-phrase-intro",
        text: "Bonjour, je m'appelle Sam.",
        translation: "Hello, my name is Sam.",
        pronunciation: "bohn-ZHOOR, zhuh mah-PEL Sam",
        context: "Use this when introducing yourself.",
      },
    ],
    activities: [
      {
        id: "fr-greetings-activity-1",
        kind: "multiple-choice",
        prompt: "Choose the correct meaning.",
        question: "What does 'bonjour' mean?",
        options: ["hello", "good night", "please"],
        correctAnswer: "hello",
      },
      {
        id: "fr-greetings-activity-2",
        kind: "speaking",
        prompt: "Practice introducing yourself in French.",
        phrase: "Bonjour, je m'appelle Sam.",
        expectedWords: ["bonjour", "je", "m'appelle"],
      },
    ],
    aiTeacherPrompt: {
      persona: "Patient French teacher for first-time learners",
      systemPrompt:
        "Teach short French phrases with gentle pronunciation support and simple English explanations.",
      openingLine:
        "Bonjour! Today we will learn a simple French introduction.",
      correctionStyle:
        "Correct only one sound at a time and invite the learner to try again.",
      practiceInstructions: [
        "Say the phrase naturally, then slowly.",
        "Have the learner repeat in small chunks.",
        "Finish with a mini introduction roleplay.",
      ],
    },
  },
  {
    id: "fr-polite-words",
    unitId: "fr-basics-1",
    languageId: "fr",
    title: "Daily Life",
    description: "Practice simple polite words for friendly conversations.",
    kind: "vocabulary",
    level: "beginner",
    order: 2,
    xpReward: 10,
    estimatedMinutes: 4,
    goals: [
      { id: "fr-polite-goal-1", text: "Say please and thank you in French." },
      { id: "fr-polite-goal-2", text: "Use a polite response." },
    ],
    vocabulary: [
      {
        id: "fr-vocab-sil-vous-plait",
        term: "s'il vous plaît",
        translation: "please",
        pronunciation: "seel voo PLEH",
        partOfSpeech: "expression",
        example: "Un café, s'il vous plaît.",
      },
      {
        id: "fr-vocab-merci",
        term: "merci",
        translation: "thank you",
        pronunciation: "mehr-SEE",
        partOfSpeech: "expression",
        example: "Merci beaucoup.",
      },
      {
        id: "fr-vocab-rien",
        term: "de rien",
        translation: "you're welcome",
        pronunciation: "duh RYEHN",
        partOfSpeech: "expression",
        example: "De rien.",
      },
    ],
    phrases: [
      {
        id: "fr-phrase-cafe",
        text: "Un café, s'il vous plaît.",
        translation: "A coffee, please.",
        pronunciation: "uhn kah-FEH, seel voo PLEH",
        context: "Use this when ordering politely.",
      },
    ],
    activities: [
      {
        id: "fr-polite-activity-1",
        kind: "match-pairs",
        prompt: "Match the French phrase to English.",
        pairs: [
          { term: "merci", match: "thank you" },
          { term: "de rien", match: "you're welcome" },
          { term: "s'il vous plaît", match: "please" },
        ],
      },
      {
        id: "fr-polite-activity-2",
        kind: "translate",
        prompt: "Translate the phrase.",
        sourceText: "Please.",
        expectedTranslation: "S'il vous plaît.",
      },
    ],
    aiTeacherPrompt: {
      persona: "Friendly French cafe conversation coach",
      systemPrompt:
        "Teach polite French words through short ordering and thank-you examples.",
      openingLine:
        "Let's practice the words that make French conversations polite.",
      correctionStyle:
        "Use warm encouragement and repeat the target phrase slowly.",
      practiceInstructions: [
        "Model the phrase in a cafe setting.",
        "Ask the learner to repeat merci and s'il vous plaît.",
        "End with a two-line ordering practice.",
      ],
    },
  },
  {
    id: "ja-greetings",
    unitId: "ja-basics-1",
    languageId: "ja",
    title: "Greetings & Introductions",
    description: "Learn friendly greetings and a simple self-introduction.",
    kind: "ai-teacher",
    level: "beginner",
    order: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    goals: [
      { id: "ja-greetings-goal-1", text: "Say hello in Japanese." },
      { id: "ja-greetings-goal-2", text: "Introduce yourself with desu." },
    ],
    vocabulary: [
      {
        id: "ja-vocab-konnichiwa",
        term: "こんにちは",
        translation: "hello",
        pronunciation: "kon-nee-chee-wah",
        partOfSpeech: "expression",
        example: "こんにちは、サムです。",
      },
      {
        id: "ja-vocab-sayonara",
        term: "さようなら",
        translation: "goodbye",
        pronunciation: "sah-yoh-nah-rah",
        partOfSpeech: "expression",
        example: "さようなら。",
      },
      {
        id: "ja-vocab-desu",
        term: "です",
        translation: "am / is",
        pronunciation: "dess",
        partOfSpeech: "verb",
        example: "サムです。",
      },
    ],
    phrases: [
      {
        id: "ja-phrase-intro",
        text: "こんにちは、サムです。",
        translation: "Hello, I am Sam.",
        pronunciation: "kon-nee-chee-wah, Sam dess",
        context: "Use this simple pattern to introduce yourself.",
      },
    ],
    activities: [
      {
        id: "ja-greetings-activity-1",
        kind: "listen-and-choose",
        prompt: "Listen and choose the matching English meaning.",
        question: "What does 'こんにちは' mean?",
        options: ["hello", "goodbye", "thank you"],
        correctAnswer: "hello",
      },
      {
        id: "ja-greetings-activity-2",
        kind: "speaking",
        prompt: "Practice the Japanese introduction.",
        phrase: "こんにちは、サムです。",
        expectedWords: ["こんにちは", "サム", "です"],
      },
    ],
    aiTeacherPrompt: {
      persona: "Gentle Japanese teacher for brand-new learners",
      systemPrompt:
        "Teach Japanese greetings slowly. Explain pronunciation with friendly English guidance.",
      openingLine:
        "こんにちは! Today we will practice a simple Japanese greeting.",
      correctionStyle:
        "Encourage effort, then model the rhythm again slowly.",
      practiceInstructions: [
        "Break the greeting into small sound chunks.",
        "Ask the learner to repeat after each chunk.",
        "Practice a short self-introduction using desu.",
      ],
    },
  },
  {
    id: "ja-polite-words",
    unitId: "ja-basics-1",
    languageId: "ja",
    title: "Daily Life",
    description: "Practice thank you, please, and excuse me in Japanese.",
    kind: "vocabulary",
    level: "beginner",
    order: 2,
    xpReward: 10,
    estimatedMinutes: 4,
    goals: [
      { id: "ja-polite-goal-1", text: "Say thank you in Japanese." },
      { id: "ja-polite-goal-2", text: "Use one polite request phrase." },
    ],
    vocabulary: [
      {
        id: "ja-vocab-arigatou",
        term: "ありがとう",
        translation: "thank you",
        pronunciation: "ah-ree-gah-toh",
        partOfSpeech: "expression",
        example: "ありがとう。",
      },
      {
        id: "ja-vocab-onegaishimasu",
        term: "お願いします",
        translation: "please",
        pronunciation: "oh-neh-guy-shee-mahss",
        partOfSpeech: "expression",
        example: "水をお願いします。",
      },
      {
        id: "ja-vocab-sumimasen",
        term: "すみません",
        translation: "excuse me",
        pronunciation: "soo-mee-mah-sen",
        partOfSpeech: "expression",
        example: "すみません。",
      },
    ],
    phrases: [
      {
        id: "ja-phrase-water",
        text: "水をお願いします。",
        translation: "Water, please.",
        pronunciation: "mee-zoo oh oh-neh-guy-shee-mahss",
        context: "Use this as a polite request.",
      },
    ],
    activities: [
      {
        id: "ja-polite-activity-1",
        kind: "match-pairs",
        prompt: "Match the Japanese phrase with English.",
        pairs: [
          { term: "ありがとう", match: "thank you" },
          { term: "お願いします", match: "please" },
          { term: "すみません", match: "excuse me" },
        ],
      },
      {
        id: "ja-polite-activity-2",
        kind: "multiple-choice",
        prompt: "Choose the correct polite phrase.",
        question: "Which phrase means 'thank you'?",
        options: ["ありがとう", "こんにちは", "さようなら"],
        correctAnswer: "ありがとう",
      },
    ],
    aiTeacherPrompt: {
      persona: "Kind Japanese pronunciation coach",
      systemPrompt:
        "Teach polite Japanese phrases with a calm pace and beginner-safe examples.",
      openingLine:
        "Let's practice polite Japanese words you can use right away.",
      correctionStyle:
        "Repeat the phrase clearly and keep feedback focused on rhythm.",
      practiceInstructions: [
        "Model each phrase once naturally and once slowly.",
        "Ask the learner to repeat one phrase at a time.",
        "Create a tiny request practice with water, please.",
      ],
    },
  },
  ...createLessons("es", "es-basics-1", extraLessonSeeds),
  ...createLessons("fr", "fr-basics-1", extraLessonSeeds),
  ...createLessons("ja", "ja-basics-1", extraLessonSeeds),
  ...createLessons("ko", "ko-basics-1", firstLessonSeeds),
  ...createLessons("de", "de-basics-1", firstLessonSeeds),
  ...createLessons("zh", "zh-basics-1", firstLessonSeeds),
] satisfies Lesson[];
