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

const pronunciationPracticeInstructions = [
  "Sound out each target word or phrase using its pronunciation guide before asking the learner to repeat.",
  "Understanding is the pass condition. If you understand the learner's intended sentence or phrase, praise them briefly and continue without correcting pronunciation or asking them to repeat it.",
  "Only request another attempt when you genuinely cannot determine the sentence or phrase the learner intended.",
];

type LocalizedLessonSeed = LessonSeed & {
  politeTerm: string;
  politeTranslation: string;
  politeExample: string;
};

function getLocalizedLessonSeed(languageId: LanguageCode, seed: LessonSeed): LocalizedLessonSeed {
  const localizedSeeds: Record<LanguageCode, Record<string, LocalizedLessonSeed>> = {
    es: {
      cafe: {
        ...seed,
        focusTerm: "café",
        focusTranslation: "coffee",
        samplePhrase: "Un café, por favor.",
        sampleTranslation: "A coffee, please.",
        politeTerm: "por favor",
        politeTranslation: "please",
        politeExample: "Un café, por favor.",
      },
      "travel-directions": {
        ...seed,
        focusTerm: "estación",
        focusTranslation: "station",
        samplePhrase: "¿Dónde está la estación?",
        sampleTranslation: "Where is the station?",
        politeTerm: "por favor",
        politeTranslation: "please",
        politeExample: "¿Dónde está la estación, por favor?",
      },
      shopping: {
        ...seed,
        focusTerm: "cuánto cuesta",
        focusTranslation: "how much",
        samplePhrase: "¿Cuánto cuesta esto?",
        sampleTranslation: "How much is this?",
        politeTerm: "por favor",
        politeTranslation: "please",
        politeExample: "¿Cuánto cuesta esto, por favor?",
      },
      "family-friends": {
        ...seed,
        focusTerm: "amigo",
        focusTranslation: "friend",
        samplePhrase: "Este es mi amigo.",
        sampleTranslation: "This is my friend.",
        politeTerm: "por favor",
        politeTranslation: "please",
        politeExample: "Por favor, cuéntame sobre tu amigo.",
      },
    },
    fr: {
      cafe: {
        ...seed,
        focusTerm: "café",
        focusTranslation: "coffee",
        samplePhrase: "Un café, s'il vous plaît.",
        sampleTranslation: "A coffee, please.",
        politeTerm: "s'il vous plaît",
        politeTranslation: "please",
        politeExample: "Un café, s'il vous plaît.",
      },
      "travel-directions": {
        ...seed,
        focusTerm: "gare",
        focusTranslation: "station",
        samplePhrase: "Où se trouve la gare ?",
        sampleTranslation: "Where is the station?",
        politeTerm: "s'il vous plaît",
        politeTranslation: "please",
        politeExample: "Où se trouve la gare, s'il vous plaît ?",
      },
      shopping: {
        ...seed,
        focusTerm: "combien ça coûte",
        focusTranslation: "how much",
        samplePhrase: "Combien ça coûte ?",
        sampleTranslation: "How much is this?",
        politeTerm: "s'il vous plaît",
        politeTranslation: "please",
        politeExample: "Combien ça coûte, s'il vous plaît ?",
      },
      "family-friends": {
        ...seed,
        focusTerm: "ami",
        focusTranslation: "friend",
        samplePhrase: "C'est mon ami.",
        sampleTranslation: "This is my friend.",
        politeTerm: "s'il vous plaît",
        politeTranslation: "please",
        politeExample: "S'il vous plaît, parlez-moi de votre ami.",
      },
    },
    ja: {
      cafe: {
        ...seed,
        focusTerm: "コーヒー",
        focusTranslation: "coffee",
        samplePhrase: "コーヒーをお願いします。",
        sampleTranslation: "A coffee, please.",
        politeTerm: "お願いします",
        politeTranslation: "please",
        politeExample: "コーヒーをお願いします。",
      },
      "travel-directions": {
        ...seed,
        focusTerm: "駅",
        focusTranslation: "station",
        samplePhrase: "駅はどこですか？",
        sampleTranslation: "Where is the station?",
        politeTerm: "お願いします",
        politeTranslation: "please",
        politeExample: "駅はどこですか、お願いします？",
      },
      shopping: {
        ...seed,
        focusTerm: "いくらですか",
        focusTranslation: "how much",
        samplePhrase: "これはいくらですか？",
        sampleTranslation: "How much is this?",
        politeTerm: "お願いします",
        politeTranslation: "please",
        politeExample: "これはいくらですか、お願いします？",
      },
      "family-friends": {
        ...seed,
        focusTerm: "友達",
        focusTranslation: "friend",
        samplePhrase: "これは友達です。",
        sampleTranslation: "This is my friend.",
        politeTerm: "お願いします",
        politeTranslation: "please",
        politeExample: "これは友達です、お願いします。",
      },
    },
    ko: {
      greetings: {
        ...seed,
        focusTerm: "안녕하세요",
        focusTranslation: "hello",
        samplePhrase: "안녕하세요, 제 이름은 샘입니다.",
        sampleTranslation: "Hello, my name is Sam.",
        politeTerm: "부탁합니다",
        politeTranslation: "please",
        politeExample: "안녕하세요, 부탁합니다.",
      },
      "polite-words": {
        ...seed,
        focusTerm: "감사합니다",
        focusTranslation: "thank you",
        samplePhrase: "감사합니다.",
        sampleTranslation: "Thank you very much.",
        politeTerm: "부탁합니다",
        politeTranslation: "please",
        politeExample: "감사합니다, 부탁합니다.",
      },
      cafe: {
        ...seed,
        focusTerm: "커피",
        focusTranslation: "coffee",
        samplePhrase: "커피 주세요.",
        sampleTranslation: "A coffee, please.",
        politeTerm: "부탁합니다",
        politeTranslation: "please",
        politeExample: "커피 주세요, 부탁합니다.",
      },
      "travel-directions": {
        ...seed,
        focusTerm: "역",
        focusTranslation: "station",
        samplePhrase: "역이 어디예요?",
        sampleTranslation: "Where is the station?",
        politeTerm: "부탁합니다",
        politeTranslation: "please",
        politeExample: "역이 어디예요, 부탁합니다?",
      },
      shopping: {
        ...seed,
        focusTerm: "얼마예요",
        focusTranslation: "how much",
        samplePhrase: "이거 얼마예요?",
        sampleTranslation: "How much is this?",
        politeTerm: "부탁합니다",
        politeTranslation: "please",
        politeExample: "이거 얼마예요, 부탁합니다?",
      },
      "family-friends": {
        ...seed,
        focusTerm: "친구",
        focusTranslation: "friend",
        samplePhrase: "이건 제 친구예요.",
        sampleTranslation: "This is my friend.",
        politeTerm: "부탁합니다",
        politeTranslation: "please",
        politeExample: "친구를 소개해 주세요, 부탁합니다.",
      },
    },
    de: {
      greetings: {
        ...seed,
        focusTerm: "hallo",
        focusTranslation: "hello",
        samplePhrase: "Hallo, ich heiße Sam.",
        sampleTranslation: "Hello, my name is Sam.",
        politeTerm: "bitte",
        politeTranslation: "please",
        politeExample: "Hallo, bitte, nehmen Sie Platz.",
      },
      "polite-words": {
        ...seed,
        focusTerm: "danke",
        focusTranslation: "thank you",
        samplePhrase: "Vielen Dank.",
        sampleTranslation: "Thank you very much.",
        politeTerm: "bitte",
        politeTranslation: "please",
        politeExample: "Danke, bitte.",
      },
      cafe: {
        ...seed,
        focusTerm: "Kaffee",
        focusTranslation: "coffee",
        samplePhrase: "Einen Kaffee, bitte.",
        sampleTranslation: "A coffee, please.",
        politeTerm: "bitte",
        politeTranslation: "please",
        politeExample: "Einen Kaffee, bitte.",
      },
      "travel-directions": {
        ...seed,
        focusTerm: "Bahnhof",
        focusTranslation: "station",
        samplePhrase: "Wo ist der Bahnhof?",
        sampleTranslation: "Where is the station?",
        politeTerm: "bitte",
        politeTranslation: "please",
        politeExample: "Wo ist der Bahnhof, bitte?",
      },
      shopping: {
        ...seed,
        focusTerm: "wie viel kostet das",
        focusTranslation: "how much",
        samplePhrase: "Wie viel kostet das?",
        sampleTranslation: "How much is this?",
        politeTerm: "bitte",
        politeTranslation: "please",
        politeExample: "Wie viel kostet das, bitte?",
      },
      "family-friends": {
        ...seed,
        focusTerm: "Freund",
        focusTranslation: "friend",
        samplePhrase: "Das ist mein Freund.",
        sampleTranslation: "This is my friend.",
        politeTerm: "bitte",
        politeTranslation: "please",
        politeExample: "Bitte, erzähl mir von deinem Freund.",
      },
    },
    zh: {
      greetings: {
        ...seed,
        focusTerm: "你好",
        focusTranslation: "hello",
        samplePhrase: "你好，我叫萨姆。",
        sampleTranslation: "Hello, my name is Sam.",
        politeTerm: "请",
        politeTranslation: "please",
        politeExample: "你好，请进。",
      },
      "polite-words": {
        ...seed,
        focusTerm: "谢谢",
        focusTranslation: "thank you",
        samplePhrase: "非常感谢。",
        sampleTranslation: "Thank you very much.",
        politeTerm: "请",
        politeTranslation: "please",
        politeExample: "谢谢，请。",
      },
      cafe: {
        ...seed,
        focusTerm: "咖啡",
        focusTranslation: "coffee",
        samplePhrase: "一杯咖啡，谢谢。",
        sampleTranslation: "A coffee, please.",
        politeTerm: "请",
        politeTranslation: "please",
        politeExample: "一杯咖啡，请。",
      },
      "travel-directions": {
        ...seed,
        focusTerm: "车站",
        focusTranslation: "station",
        samplePhrase: "车站在哪里？",
        sampleTranslation: "Where is the station?",
        politeTerm: "请",
        politeTranslation: "please",
        politeExample: "车站在哪里，请？",
      },
      shopping: {
        ...seed,
        focusTerm: "多少钱",
        focusTranslation: "how much",
        samplePhrase: "这个多少钱？",
        sampleTranslation: "How much is this?",
        politeTerm: "请",
        politeTranslation: "please",
        politeExample: "这个多少钱，请？",
      },
      "family-friends": {
        ...seed,
        focusTerm: "朋友",
        focusTranslation: "friend",
        samplePhrase: "这是我的朋友。",
        sampleTranslation: "This is my friend.",
        politeTerm: "请",
        politeTranslation: "please",
        politeExample: "请告诉我关于你的朋友。",
      },
    },
  };

  return localizedSeeds[languageId]?.[seed.id] ?? { ...seed, politeTerm: "please", politeTranslation: "please", politeExample: seed.samplePhrase };
}

type PronunciationGuide = {
  focusTerm: string;
  politeTerm: string;
  samplePhrase: string;
};

const generatedPronunciationGuides: Partial<Record<LanguageCode, Record<string, PronunciationGuide>>> = {
  es: {
    cafe: {
      focusTerm: "kah-FEH",
      politeTerm: "por fah-VOR",
      samplePhrase: "oon kah-FEH, por fah-VOR",
    },
    "travel-directions": {
      focusTerm: "ehs-tah-SYOHN",
      politeTerm: "por fah-VOR",
      samplePhrase: "DOHN-deh ehs-TAH lah ehs-tah-SYOHN",
    },
    shopping: {
      focusTerm: "KWAHN-toh KWEHS-tah",
      politeTerm: "por fah-VOR",
      samplePhrase: "KWAHN-toh KWEHS-tah EHS-toh",
    },
    "family-friends": {
      focusTerm: "ah-MEE-goh",
      politeTerm: "por fah-VOR",
      samplePhrase: "EHS-teh ehs mee ah-MEE-goh",
    },
  },
  fr: {
    cafe: {
      focusTerm: "kah-FEH",
      politeTerm: "seel voo PLEH",
      samplePhrase: "uhn kah-FEH, seel voo PLEH",
    },
    "travel-directions": {
      focusTerm: "gahr",
      politeTerm: "seel voo PLEH",
      samplePhrase: "oo suh troov lah gahr",
    },
    shopping: {
      focusTerm: "kohm-BYEN sah koot",
      politeTerm: "seel voo PLEH",
      samplePhrase: "kohm-BYEN sah koot",
    },
    "family-friends": {
      focusTerm: "ah-MEE",
      politeTerm: "seel voo PLEH",
      samplePhrase: "seh mohn ah-MEE",
    },
  },
  ja: {
    cafe: {
      focusTerm: "koh-hee",
      politeTerm: "oh-neh-guy-shee-mahss",
      samplePhrase: "koh-hee oh oh-neh-guy-shee-mahss",
    },
    "travel-directions": {
      focusTerm: "eh-kee",
      politeTerm: "oh-neh-guy-shee-mahss",
      samplePhrase: "eh-kee wah doh-koh dess kah",
    },
    shopping: {
      focusTerm: "ee-koo-rah dess kah",
      politeTerm: "oh-neh-guy-shee-mahss",
      samplePhrase: "koh-reh wah ee-koo-rah dess kah",
    },
    "family-friends": {
      focusTerm: "toh-moh-dah-chee",
      politeTerm: "oh-neh-guy-shee-mahss",
      samplePhrase: "koh-reh wah toh-moh-dah-chee dess",
    },
  },
  ko: {
    greetings: {
      focusTerm: "ahn-nyung-hah-seh-yo",
      politeTerm: "boo-tahk-hahm-nee-dah",
      samplePhrase: "ahn-nyung-hah-seh-yo, jeh ee-reum-eun Sam-im-nee-dah",
    },
    "polite-words": {
      focusTerm: "gahm-sah-hahm-nee-dah",
      politeTerm: "boo-tahk-hahm-nee-dah",
      samplePhrase: "gahm-sah-hahm-nee-dah",
    },
    cafe: {
      focusTerm: "kuh-pee",
      politeTerm: "boo-tahk-hahm-nee-dah",
      samplePhrase: "kuh-pee joo-seh-yo",
    },
    "travel-directions": {
      focusTerm: "yuk",
      politeTerm: "boo-tahk-hahm-nee-dah",
      samplePhrase: "yuk-ee uh-dee-yeh-yo",
    },
    shopping: {
      focusTerm: "uhl-mah-yeh-yo",
      politeTerm: "boo-tahk-hahm-nee-dah",
      samplePhrase: "ee-guh uhl-mah-yeh-yo",
    },
    "family-friends": {
      focusTerm: "chin-goo",
      politeTerm: "boo-tahk-hahm-nee-dah",
      samplePhrase: "ee-guhn jeh chin-goo-yeh-yo",
    },
  },
  de: {
    greetings: {
      focusTerm: "HAH-loh",
      politeTerm: "BIT-tuh",
      samplePhrase: "HAH-loh, ikh HIGH-suh Sam",
    },
    "polite-words": {
      focusTerm: "DAHN-kuh",
      politeTerm: "BIT-tuh",
      samplePhrase: "FEE-len DAHNK",
    },
    cafe: {
      focusTerm: "KAH-feh",
      politeTerm: "BIT-tuh",
      samplePhrase: "EYE-nen KAH-feh, BIT-tuh",
    },
    "travel-directions": {
      focusTerm: "BAHN-hohf",
      politeTerm: "BIT-tuh",
      samplePhrase: "voh ist dair BAHN-hohf",
    },
    shopping: {
      focusTerm: "vee feel KOS-tet dahs",
      politeTerm: "BIT-tuh",
      samplePhrase: "vee feel KOS-tet dahs",
    },
    "family-friends": {
      focusTerm: "froynt",
      politeTerm: "BIT-tuh",
      samplePhrase: "dahs ist mine froynt",
    },
  },
  zh: {
    greetings: {
      focusTerm: "nee how",
      politeTerm: "ching",
      samplePhrase: "nee how, woh jyow Sah-moo",
    },
    "polite-words": {
      focusTerm: "shyeh-shyeh",
      politeTerm: "ching",
      samplePhrase: "fey-chahng gahn-shyeh",
    },
    cafe: {
      focusTerm: "kah-fey",
      politeTerm: "ching",
      samplePhrase: "ee bay kah-fey, shyeh-shyeh",
    },
    "travel-directions": {
      focusTerm: "chuh-jahn",
      politeTerm: "ching",
      samplePhrase: "chuh-jahn dzai nah-lee",
    },
    shopping: {
      focusTerm: "dwoh-shao chyen",
      politeTerm: "ching",
      samplePhrase: "juh-guh dwoh-shao chyen",
    },
    "family-friends": {
      focusTerm: "pung-yo",
      politeTerm: "ching",
      samplePhrase: "juh shih woh duh pung-yo",
    },
  },
};

function getPronunciationGuide(languageId: LanguageCode, seed: LocalizedLessonSeed) {
  const guide = generatedPronunciationGuides[languageId]?.[seed.id];

  return {
    focusTerm: guide?.focusTerm ?? seed.focusTerm,
    politeTerm: guide?.politeTerm ?? seed.politeTerm,
    samplePhrase: guide?.samplePhrase ?? seed.samplePhrase,
  };
}

function createLesson(languageId: LanguageCode, unitId: string, seed: LessonSeed): Lesson {
  const lessonId = `${languageId}-${seed.id}`;
  const localizedSeed = getLocalizedLessonSeed(languageId, seed);
  const pronunciationGuide = getPronunciationGuide(languageId, localizedSeed);

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
        term: localizedSeed.focusTerm,
        translation: localizedSeed.focusTranslation,
        pronunciation: pronunciationGuide.focusTerm,
        partOfSpeech: "expression",
        example: localizedSeed.samplePhrase,
      },
      {
        id: `${lessonId}-vocab-please`,
        term: localizedSeed.politeTerm,
        translation: localizedSeed.politeTranslation,
        pronunciation: pronunciationGuide.politeTerm,
        partOfSpeech: "expression",
        example: localizedSeed.politeExample,
      },
    ],
    phrases: [
      {
        id: `${lessonId}-phrase-main`,
        text: localizedSeed.samplePhrase,
        translation: localizedSeed.sampleTranslation,
        pronunciation: pronunciationGuide.samplePhrase,
        context: seed.description,
      },
    ],
    activities: [
      {
        id: `${lessonId}-activity-1`,
        kind: "multiple-choice",
        prompt: "Choose the matching meaning.",
        question: `What does "${localizedSeed.focusTerm}" mean?`,
        options: [localizedSeed.focusTranslation, "good night", "see you tomorrow"],
        correctAnswer: localizedSeed.focusTranslation,
      },
      {
        id: `${lessonId}-activity-2`,
        kind: "speaking",
        prompt: "Practice the phrase out loud.",
        phrase: localizedSeed.samplePhrase,
        expectedWords: localizedSeed.samplePhrase
          .replace(/[?.!,]/g, "")
          .toLowerCase()
          .split(" ")
          .slice(0, 3),
      },
    ],
    aiTeacherPrompt: {
      persona: "Warm, energetic real-world language teacher for absolute beginners",
      systemPrompt:
        `Stay inside this ${seed.title.toLowerCase()} lesson only. Mostly speak English, introduce only "${localizedSeed.focusTerm}" (${localizedSeed.focusTranslation}), "${localizedSeed.politeTerm}" (${localizedSeed.politeTranslation}), and "${localizedSeed.samplePhrase}" (${localizedSeed.sampleTranslation}) slowly. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.`,
      openingLine:
        `Let's practice ${seed.title.toLowerCase()} together. "${localizedSeed.samplePhrase}" means "${localizedSeed.sampleTranslation}", so listen once and then try it with me.`,
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same lesson phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only this lesson's goals, vocabulary, phrase, and context.",
        "Mostly speak English, but say the target phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny roleplay.",
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
      persona: "Warm, energetic Spanish teacher for absolute beginners",
      systemPrompt:
        "Stay inside this Spanish greetings lesson only. Mostly speak English, introduce only hola, adiós, me llamo, Hola, me llamo Sam, and Adiós, nos vemos with translations. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.",
      openingLine:
        "Hola means hello, and me llamo means my name is. Let's say it together slowly: Hola, me llamo Sam.",
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same Spanish phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only hola, adiós, me llamo, and the two greeting phrases from this lesson.",
        "Mostly speak English, but say the Spanish phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny introduction roleplay.",
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
      persona: "Warm, energetic Spanish conversation coach",
      systemPrompt:
        "Stay inside this Spanish polite words lesson only. Mostly speak English, introduce only por favor, gracias, de nada, and Café, por favor with translations. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.",
      openingLine:
        "Let's make your Spanish sound friendly. Por favor means please, so listen once and then try it with me: por favor.",
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same polite phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only por favor, gracias, de nada, and the cafe phrase from this lesson.",
        "Mostly speak English, but say the Spanish phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny ordering roleplay.",
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
      persona: "Warm, energetic French teacher for first-time learners",
      systemPrompt:
        "Stay inside this French greetings lesson only. Mostly speak English, introduce only bonjour, au revoir, je m'appelle, and Bonjour, je m'appelle Sam with translations. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.",
      openingLine:
        "Bonjour means hello, and je m'appelle means my name is. Let's say it together slowly: Bonjour, je m'appelle Sam.",
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same French phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only bonjour, au revoir, je m'appelle, and the introduction phrase from this lesson.",
        "Mostly speak English, but say the French phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny introduction roleplay.",
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
      persona: "Warm, energetic French cafe conversation coach",
      systemPrompt:
        "Stay inside this French polite words lesson only. Mostly speak English, introduce only s'il vous plaît, merci, de rien, and Un café, s'il vous plaît with translations. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.",
      openingLine:
        "Let's make your French sound polite and friendly. Merci means thank you, so listen once and then try it with me: merci.",
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same polite phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only s'il vous plaît, merci, de rien, and the cafe phrase from this lesson.",
        "Mostly speak English, but say the French phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny ordering roleplay.",
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
      persona: "Warm, energetic Japanese teacher for brand-new learners",
      systemPrompt:
        "Stay inside this Japanese greetings lesson only. Mostly speak English, introduce only こんにちは, さようなら, です, and こんにちは、サムです with translations. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.",
      openingLine:
        "Konnichiwa means hello, and desu helps make a simple introduction. Let's say it together slowly: konnichiwa, Sam desu.",
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same Japanese phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only こんにちは, さようなら, です, and the introduction phrase from this lesson.",
        "Mostly speak English, but say the Japanese phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny introduction roleplay.",
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
      persona: "Warm, energetic Japanese pronunciation coach",
      systemPrompt:
        "Stay inside this Japanese polite words lesson only. Mostly speak English, introduce only ありがとう, お願いします, すみません, and 水をお願いします with translations. Sound out each taught word or phrase, then compare the learner's attempt with the target sound. Each turn should include a warm reaction, one tiny explanation or model, and one repeat prompt.",
      openingLine:
        "Let's practice polite Japanese you can use right away. Arigatou means thank you, so listen once and then try it with me: arigatou.",
      correctionStyle:
        "Listen first, repeat back what you heard, compare it to the target pronunciation, then model the same polite phrase slowly and ask them to try again.",
      practiceInstructions: [
        "Keep each reply to one or two natural, encouraging sentences with a little teacher energy.",
        "Use only ありがとう, お願いします, すみません, and the water request phrase from this lesson.",
        "Mostly speak English, but say the Japanese phrase slowly and clearly before asking for practice.",
        ...pronunciationPracticeInstructions,
        "After each repeat prompt or question, stop speaking and wait for the learner's response.",
        "Adapt to that response before asking for another repeat or tiny request roleplay.",
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
