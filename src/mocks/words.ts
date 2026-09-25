/**
 * TagLingo Phase 1 mock content — static fixtures, no backend.
 *
 * Mirrors the `words` table from docs/02-ARCHITECTURE.md §3.2 plus display
 * fields used by the UI (partOfSpeech, definition, example). Seeded
 * `initialStatus`/`initialFavorite` exist only so the prototype opens with
 * realistic progress numbers.
 *
 * `mockLookupFails` simulates the Free Dictionary API returning no match for
 * a phrase (`{ found: false }`, architecture doc §7) so the Definition
 * Lookup "not found" state is reviewable in the demo.
 */

export type LevelId = 'beginner' | 'intermediate' | 'advanced';
export type WordStatus = 'mastered' | 'learning' | 'new';
export type SourceLanguage = 'tagalog' | 'cebuano';

export interface Word {
  id: string;
  level: LevelId;
  tagalog: string;
  cebuano: string;
  english: string;
  partOfSpeech: string;
  definition: string;
  example: {
    language: SourceLanguage;
    text: string;
    english: string;
  };
  initialStatus: WordStatus;
  initialFavorite?: boolean;
  mockLookupFails?: boolean;
}

export const words: Word[] = [
  /* ---------------------------------------------------------------- beginner */
  {
    id: 'salamat',
    level: 'beginner',
    tagalog: 'salamat',
    cebuano: 'salamat',
    english: 'thank you',
    partOfSpeech: 'interjection',
    definition: 'used to express gratitude or polite appreciation.',
    example: {
      language: 'cebuano',
      text: 'Salamat kaayo sa imong tabang.',
      english: 'Thank you very much for your help.',
    },
    initialStatus: 'mastered',
    initialFavorite: true,
  },
  {
    id: 'kumusta',
    level: 'beginner',
    tagalog: 'kumusta',
    cebuano: 'kumusta',
    english: 'how are you?',
    partOfSpeech: 'greeting',
    definition:
      'a friendly greeting asking how someone is; also used to mean hello.',
    example: {
      language: 'tagalog',
      text: 'Kumusta ka ngayon?',
      english: 'How are you today?',
    },
    initialStatus: 'mastered',
    mockLookupFails: true,
  },
  {
    id: 'maayong-buntag',
    level: 'beginner',
    tagalog: 'magandang umaga',
    cebuano: 'maayong buntag',
    english: 'good morning',
    partOfSpeech: 'greeting',
    definition: 'a polite greeting used in the morning.',
    example: {
      language: 'cebuano',
      text: 'Maayong buntag, ate.',
      english: 'Good morning, older sister.',
    },
    initialStatus: 'mastered',
    mockLookupFails: true,
  },
  {
    id: 'maayong-gabii',
    level: 'beginner',
    tagalog: 'magandang gabi',
    cebuano: 'maayong gabii',
    english: 'good evening',
    partOfSpeech: 'greeting',
    definition: 'a polite greeting used in the evening or at night.',
    example: {
      language: 'cebuano',
      text: 'Maayong gabii sa tanan.',
      english: 'Good evening, everyone.',
    },
    initialStatus: 'mastered',
    initialFavorite: true,
    mockLookupFails: true,
  },
  {
    id: 'oo',
    level: 'beginner',
    tagalog: 'oo',
    cebuano: 'oo',
    english: 'yes',
    partOfSpeech: 'particle',
    definition: 'an affirmative answer; agreeing with a statement or request.',
    example: {
      language: 'tagalog',
      text: 'Oo, sasama ako.',
      english: 'Yes, I will come along.',
    },
    initialStatus: 'mastered',
  },
  {
    id: 'hindi',
    level: 'beginner',
    tagalog: 'hindi',
    cebuano: 'dili',
    english: 'no',
    partOfSpeech: 'particle',
    definition:
      'a negative answer; also used to negate a verb or an adjective.',
    example: {
      language: 'cebuano',
      text: 'Dili ko gusto ana.',
      english: "I don't want that.",
    },
    initialStatus: 'mastered',
  },
  {
    id: 'palihug',
    level: 'beginner',
    tagalog: 'paki-usap',
    cebuano: 'palihug',
    english: 'please',
    partOfSpeech: 'adverb',
    definition: 'used when asking for something politely.',
    example: {
      language: 'cebuano',
      text: "Palihug ko'g kuha sa tubig.",
      english: 'Please get me the water.',
    },
    initialStatus: 'mastered',
  },
  {
    id: 'pasaylo',
    level: 'beginner',
    tagalog: 'paumanhin',
    cebuano: 'pasaylo',
    english: 'sorry',
    partOfSpeech: 'interjection',
    definition:
      'an apology, or a polite word used to get someone\'s attention before a request.',
    example: {
      language: 'cebuano',
      text: 'Pasaylo, nalate ko.',
      english: 'Sorry, I was late.',
    },
    initialStatus: 'mastered',
  },
  {
    id: 'kaibigan',
    level: 'beginner',
    tagalog: 'kaibigan',
    cebuano: 'higala',
    english: 'friend',
    partOfSpeech: 'noun',
    definition: 'a person you know well and like, and who likes you.',
    example: {
      language: 'tagalog',
      text: 'Matagal ko nang kaibigan si Ana.',
      english: 'Ana has been my friend for a long time.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'tubig',
    level: 'beginner',
    tagalog: 'tubig',
    cebuano: 'tubig',
    english: 'water',
    partOfSpeech: 'noun',
    definition: 'the clear liquid that has no colour, taste or smell.',
    example: {
      language: 'tagalog',
      text: 'Uminom ka ng tubig.',
      english: 'Drink some water.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'pagkaon',
    level: 'beginner',
    tagalog: 'pagkain',
    cebuano: 'pagkaon',
    english: 'food',
    partOfSpeech: 'noun',
    definition: 'things that people and animals eat to live and grow.',
    example: {
      language: 'cebuano',
      text: 'Lami kaayo ang pagkaon.',
      english: 'The food is very delicious.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'balay',
    level: 'beginner',
    tagalog: 'bahay',
    cebuano: 'balay',
    english: 'house',
    partOfSpeech: 'noun',
    definition: 'a building where people live, especially a family home.',
    example: {
      language: 'cebuano',
      text: 'Naa siya sa balay.',
      english: 'He is at home.',
    },
    initialStatus: 'new',
  },

  /* ------------------------------------------------------------ intermediate */
  {
    id: 'gugma',
    level: 'intermediate',
    tagalog: 'pag-ibig',
    cebuano: 'gugma',
    english: 'love',
    partOfSpeech: 'noun',
    definition:
      'a strong feeling of deep affection for another person or thing.',
    example: {
      language: 'cebuano',
      text: 'Ang gugma sa pamilya walay katapusan.',
      english: 'Love for family has no end.',
    },
    initialStatus: 'mastered',
    initialFavorite: true,
  },
  {
    id: 'pagtuon',
    level: 'intermediate',
    tagalog: 'pag-aaral',
    cebuano: 'pagtuon',
    english: 'study',
    partOfSpeech: 'noun',
    definition:
      'the activity of learning about a subject, usually by reading or practising.',
    example: {
      language: 'cebuano',
      text: 'Ganahan ko sa pagtuon og Bisaya.',
      english: 'I enjoy studying Cebuano.',
    },
    initialStatus: 'mastered',
  },
  {
    id: 'trabaho',
    level: 'intermediate',
    tagalog: 'trabaho',
    cebuano: 'trabaho',
    english: 'work',
    partOfSpeech: 'noun',
    definition:
      'a job or the effort you put into doing something useful or necessary.',
    example: {
      language: 'tagalog',
      text: 'Maaga akong pumapasok sa trabaho.',
      english: 'I go to work early.',
    },
    initialStatus: 'mastered',
  },
  {
    id: 'lakaw',
    level: 'intermediate',
    tagalog: 'lakad',
    cebuano: 'lakaw',
    english: 'to walk',
    partOfSpeech: 'verb',
    definition: 'to move forward by putting one foot in front of the other.',
    example: {
      language: 'cebuano',
      text: 'Maglakaw kita padulong sa merkado.',
      english: "Let's walk to the market.",
    },
    initialStatus: 'learning',
  },
  {
    id: 'tingog',
    level: 'intermediate',
    tagalog: 'boses',
    cebuano: 'tingog',
    english: 'voice',
    partOfSpeech: 'noun',
    definition: 'the sound a person makes when speaking or singing.',
    example: {
      language: 'cebuano',
      text: 'Nindot kaayo ang iyang tingog.',
      english: 'Her voice is really lovely.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'kalipay',
    level: 'intermediate',
    tagalog: 'kasiyahan',
    cebuano: 'kalipay',
    english: 'joy',
    partOfSpeech: 'noun',
    definition: 'a feeling of great happiness and delight.',
    example: {
      language: 'cebuano',
      text: 'Kalipay ang gibati nako karon.',
      english: 'I feel joy right now.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'tabang',
    level: 'intermediate',
    tagalog: 'tulong',
    cebuano: 'tabang',
    english: 'help',
    partOfSpeech: 'noun',
    definition: 'assistance given to someone who needs it.',
    example: {
      language: 'cebuano',
      text: 'Nangayo siya og tabang.',
      english: 'He asked for help.',
    },
    initialStatus: 'learning',
    initialFavorite: true,
  },
  {
    id: 'oras',
    level: 'intermediate',
    tagalog: 'oras',
    cebuano: 'oras',
    english: 'time',
    partOfSpeech: 'noun',
    definition:
      'the thing measured in minutes, hours and days in which events happen.',
    example: {
      language: 'tagalog',
      text: 'Wala na akong oras.',
      english: 'I have no time left.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'adlaw',
    level: 'intermediate',
    tagalog: 'araw',
    cebuano: 'adlaw',
    english: 'day',
    partOfSpeech: 'noun',
    definition:
      'a period of twenty-four hours, or the light part of it between sunrise and sunset.',
    example: {
      language: 'cebuano',
      text: 'Tanan adlaw magbasa ko.',
      english: 'I read every day.',
    },
    initialStatus: 'new',
  },
  {
    id: 'bulan',
    level: 'intermediate',
    tagalog: 'buwan',
    cebuano: 'bulan',
    english: 'month',
    partOfSpeech: 'noun',
    definition:
      'one of the twelve periods of about thirty days that make up a year; also the moon.',
    example: {
      language: 'cebuano',
      text: 'Sunod bulan mubalik ko.',
      english: 'I will come back next month.',
    },
    initialStatus: 'new',
  },
  {
    id: 'bag-o',
    level: 'intermediate',
    tagalog: 'bago',
    cebuano: 'bag-o',
    english: 'new',
    partOfSpeech: 'adjective',
    definition: 'recently made, bought or started; not existing before.',
    example: {
      language: 'cebuano',
      text: 'Bag-o akong telepono.',
      english: 'My phone is new.',
    },
    initialStatus: 'new',
  },
  {
    id: 'gwapo',
    level: 'intermediate',
    tagalog: 'guwapo',
    cebuano: 'gwapo',
    english: 'handsome',
    partOfSpeech: 'adjective',
    definition: 'attractive in appearance, usually said of a man.',
    example: {
      language: 'cebuano',
      text: 'Gwapo ang iyang igsoon.',
      english: 'His brother is handsome.',
    },
    initialStatus: 'new',
  },

  /* ---------------------------------------------------------------- advanced */
  {
    id: 'paglaom',
    level: 'advanced',
    tagalog: 'pag-asa',
    cebuano: 'paglaom',
    english: 'hope',
    partOfSpeech: 'noun',
    definition:
      'the feeling that something good will happen, even when the situation is difficult.',
    example: {
      language: 'cebuano',
      text: 'Ayawg walaa ang imong paglaom.',
      english: 'Do not lose your hope.',
    },
    initialStatus: 'mastered',
  },
  {
    id: 'kamatuoran',
    level: 'advanced',
    tagalog: 'katotohanan',
    cebuano: 'kamatuoran',
    english: 'truth',
    partOfSpeech: 'noun',
    definition: 'the real facts about something, or the quality of being true.',
    example: {
      language: 'cebuano',
      text: 'Ang kamatuoran makapahigawas.',
      english: 'The truth sets you free.',
    },
    initialStatus: 'learning',
  },
  {
    id: 'kagawasan',
    level: 'advanced',
    tagalog: 'kalayaan',
    cebuano: 'kagawasan',
    english: 'freedom',
    partOfSpeech: 'noun',
    definition:
      'the right to live, speak and act the way you choose, without being controlled.',
    example: {
      language: 'cebuano',
      text: 'Gikinahanglan nato ang kagawasan.',
      english: 'We need freedom.',
    },
    initialStatus: 'learning',
    initialFavorite: true,
  },
  {
    id: 'kinaadman',
    level: 'advanced',
    tagalog: 'kaalaman',
    cebuano: 'kinaadman',
    english: 'knowledge',
    partOfSpeech: 'noun',
    definition:
      'the information and understanding a person has gained through learning or experience.',
    example: {
      language: 'cebuano',
      text: 'Ang kinaadman kabahandi sa kinabuhi.',
      english: 'Knowledge is wealth in life.',
    },
    initialStatus: 'new',
  },
  {
    id: 'kalinaw',
    level: 'advanced',
    tagalog: 'kapayapaan',
    cebuano: 'kalinaw',
    english: 'peace',
    partOfSpeech: 'noun',
    definition:
      'a state of quiet and calm, without war, noise or disturbance.',
    example: {
      language: 'cebuano',
      text: 'Kalinaw ang among gipangandoy.',
      english: 'Peace is what we long for.',
    },
    initialStatus: 'new',
  },
  {
    id: 'katungod',
    level: 'advanced',
    tagalog: 'karapatan',
    cebuano: 'katungod',
    english: 'right',
    partOfSpeech: 'noun',
    definition:
      'something a person is morally or legally allowed to have or to do.',
    example: {
      language: 'tagalog',
      text: 'Karapatan mong mag-aral.',
      english: 'It is your right to study.',
    },
    initialStatus: 'new',
  },
  {
    id: 'panaghiusa',
    level: 'advanced',
    tagalog: 'pagkakaisa',
    cebuano: 'panaghiusa',
    english: 'unity',
    partOfSpeech: 'noun',
    definition: 'the state of being joined together as one group or whole.',
    example: {
      language: 'cebuano',
      text: 'Ang panaghiusa makapalig-on sa nasod.',
      english: 'Unity strengthens the nation.',
    },
    initialStatus: 'new',
  },
  {
    id: 'pag-antos',
    level: 'advanced',
    tagalog: 'pagtitiis',
    cebuano: 'pag-antos',
    english: 'endurance',
    partOfSpeech: 'noun',
    definition:
      'the ability to keep going through something difficult or painful without giving up.',
    example: {
      language: 'cebuano',
      text: 'Dako ang iyang pag-antos aron makaeskwela.',
      english: 'He endured a lot in order to study.',
    },
    initialStatus: 'new',
  },
  {
    id: 'kaalam',
    level: 'advanced',
    tagalog: 'karunungan',
    cebuano: 'kaalam',
    english: 'wisdom',
    partOfSpeech: 'noun',
    definition:
      'the good judgement that comes from experience and understanding, not just knowledge.',
    example: {
      language: 'cebuano',
      text: 'Ang kaalam mas bililhon kay sa bulawan.',
      english: 'Wisdom is more precious than gold.',
    },
    initialStatus: 'new',
  },
  {
    id: 'pagbati',
    level: 'advanced',
    tagalog: 'damdamin',
    cebuano: 'pagbati',
    english: 'feeling',
    partOfSpeech: 'noun',
    definition:
      'something that you experience emotionally, such as love, worry or happiness.',
    example: {
      language: 'cebuano',
      text: 'Lisod isulti ang akong pagbati.',
      english: 'It is hard to say what I feel.',
    },
    initialStatus: 'new',
  },
  {
    id: 'hunahuna',
    level: 'advanced',
    tagalog: 'pag-iisip',
    cebuano: 'hunahuna',
    english: 'thought',
    partOfSpeech: 'noun',
    definition:
      'an idea or opinion produced by thinking, or the act of thinking itself.',
    example: {
      language: 'cebuano',
      text: 'Ang hunahuna nga hilom mao ang labing kusog.',
      english: 'A quiet thought is the strongest.',
    },
    initialStatus: 'new',
  },
  {
    id: 'kabubut-on',
    level: 'advanced',
    tagalog: 'kalooban',
    cebuano: 'kabubut-on',
    english: 'will',
    partOfSpeech: 'noun',
    definition:
      'the power of the mind to decide and to control your own actions.',
    example: {
      language: 'cebuano',
      text: 'Gamita ang imong kabubut-on.',
      english: 'Use your willpower.',
    },
    initialStatus: 'new',
  },
];

export const findWord = (id: string | undefined): Word | undefined =>
  words.find((word) => word.id === id);
