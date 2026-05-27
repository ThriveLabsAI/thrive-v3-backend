// Sefer Yetzirah month-based mapping (Gregorian zodiac dates)
const MONTH_MAPPING: Record<string, MonthInsight> = {
  'aries': {
    zodiac: 'Aries',
    letter: 'Heh (ה)',
    sense: 'Speech',
    bodyPart: 'Right Foot',
    element: 'Fire',
    planet: 'Mars',
    insight: 'Leadership through communication, initiating action with words',
    dateRange: { start: '03-21', end: '04-19' },
  },
  'taurus': {
    zodiac: 'Taurus',
    letter: 'Vav (ו)',
    sense: 'Thought',
    bodyPart: 'Right Kidney',
    element: 'Earth',
    planet: 'Venus',
    insight: 'Grounded intelligence, reflective thinking, inner alignment',
    dateRange: { start: '04-20', end: '05-20' },
  },
  'gemini': {
    zodiac: 'Gemini',
    letter: 'Zayin (ז)',
    sense: 'Walking',
    bodyPart: 'Left Foot',
    element: 'Air',
    planet: 'Mercury',
    insight: 'Momentum, dual awareness, movement between ideas and places',
    dateRange: { start: '05-21', end: '06-20' },
  },
  'cancer': {
    zodiac: 'Cancer',
    letter: 'Chet (ח)',
    sense: 'Sight',
    bodyPart: 'Right Eye',
    element: 'Water',
    planet: 'Moon',
    insight: 'Emotional clarity, deep perception, intuitive vision',
    dateRange: { start: '06-21', end: '07-22' },
  },
  'leo': {
    zodiac: 'Leo',
    letter: 'Tet (ט)',
    sense: 'Hearing',
    bodyPart: 'Left Ear',
    element: 'Fire',
    planet: 'Sun',
    insight: 'Purposeful listening, spiritual resonance, receiving guidance',
    dateRange: { start: '07-23', end: '08-22' },
  },
  'virgo': {
    zodiac: 'Virgo',
    letter: 'Yud (י)',
    sense: 'Action',
    bodyPart: 'Left Kidney',
    element: 'Earth',
    planet: 'Mercury',
    insight: 'Precision in deeds, integrity in details, service with humility',
    dateRange: { start: '08-23', end: '09-22' },
  },
  'libra': {
    zodiac: 'Libra',
    letter: 'Lamed (ל)',
    sense: 'Touch',
    bodyPart: 'Skin',
    element: 'Air',
    planet: 'Venus',
    insight: 'Balance in connection, sensitivity to others, harmony in presence',
    dateRange: { start: '09-23', end: '10-22' },
  },
  'scorpio': {
    zodiac: 'Scorpio',
    letter: 'Nun (נ)',
    sense: 'Smell',
    bodyPart: 'Nose',
    element: 'Water',
    planet: 'Mars',
    insight: 'Intuitive discernment, emotional alertness, detecting truth',
    dateRange: { start: '10-23', end: '11-21' },
  },
  'sagittarius': {
    zodiac: 'Sagittarius',
    letter: 'Samech (ס)',
    sense: 'Sleep',
    bodyPart: 'Stomach',
    element: 'Fire',
    planet: 'Jupiter',
    insight: 'Dreams, subconscious messages, restoring energy and hope',
    dateRange: { start: '11-22', end: '12-21' },
  },
  'capricorn': {
    zodiac: 'Capricorn',
    letter: 'Ayin (ע)',
    sense: 'Anger',
    bodyPart: 'Liver',
    element: 'Earth',
    planet: 'Saturn',
    insight: 'Boundaries, emotional pressure release, righteous indignation',
    dateRange: { start: '12-22', end: '01-19' },
  },
  'aquarius': {
    zodiac: 'Aquarius',
    letter: 'Tzadi (צ)',
    sense: 'Taste',
    bodyPart: 'Pancreas',
    element: 'Water',
    planet: 'Saturn',
    insight: 'Discernment, choosing what nourishes, refining truth and joy',
    dateRange: { start: '01-20', end: '02-18' },
  },
  'pisces': {
    zodiac: 'Pisces',
    letter: 'Kuf (ק)',
    sense: 'Laughter',
    bodyPart: 'Spleen',
    element: 'Air',
    planet: 'Jupiter',
    insight: 'Joy as healing, emotional release, light in the hidden places',
    dateRange: { start: '02-19', end: '03-20' },
  },
};

// Day of week mapping
const DAY_MAPPING: Record<number, DayInsight> = {
  0: {
    day: 'Sunday',
    letter: 'Kaf (כ)',
    element: 'Fire',
    quality: 'Radiance / Expansion',
    fuels: 'Self-expression, confidence, illuminating inner truth',
    theme: 'Step into your light. Share what\'s real. Be seen.',
  },
  1: {
    day: 'Monday',
    letter: 'Resh (ר)',
    element: 'Water',
    quality: 'Receptivity / Memory',
    fuels: 'Emotional processing, intuition, nurturing reflection',
    theme: 'Honor your feelings. Let them teach you.',
  },
  2: {
    day: 'Tuesday',
    letter: 'Dalet (ד)',
    element: 'Fire',
    quality: 'Courage / Action',
    fuels: 'Movement, initiative, willpower, healthy confrontation',
    theme: 'Take the step. Say the thing. Move forward.',
  },
  3: {
    day: 'Wednesday',
    letter: 'Gimel (ג)',
    element: 'Air',
    quality: 'Communication / Flow',
    fuels: 'Expression, adaptability, learning, connection',
    theme: 'Speak with intention. Ask better questions. Connect.',
  },
  4: {
    day: 'Thursday',
    letter: 'Tav (ת)',
    element: 'Air',
    quality: 'Expansion / Integration',
    fuels: 'Wisdom, leadership, synthesis, higher vision',
    theme: 'Think big. Rise above the noise. Teach through living.',
  },
  5: {
    day: 'Friday',
    letter: 'Peh (פ)',
    element: 'Earth',
    quality: 'Beauty / Receiving',
    fuels: 'Pleasure, love, grounding in relationship, gratitude',
    theme: 'Let yourself enjoy. Love more openly. Feel your worth.',
  },
  6: {
    day: 'Saturday',
    letter: 'Bet (ב)',
    element: 'Earth',
    quality: 'Discipline / Creation',
    fuels: 'Structure, stillness, intention, building inner space',
    theme: 'Stop doing. Start being. Make space for what matters.',
  },
};

interface MonthInsight {
  zodiac: string;
  letter: string;
  sense: string;
  bodyPart: string;
  element: string;
  planet: string;
  insight: string;
  dateRange: { start: string; end: string };
}

interface DayInsight {
  day: string;
  letter: string;
  element: string;
  quality: string;
  fuels: string;
  theme: string;
}

export interface SefarYetzirahInsight {
  zodiac: string;
  letter: string;
  sense: string;
  element: string;
  planet: string;
  insight: string;
  dayOfWeek: string;
  dayLetter: string;
  dayQuality: string;
}

export function getZodiacFromDate(month: number, day: number): string | null {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const dateStr = `${monthStr}-${dayStr}`;

  for (const [key, mapping] of Object.entries(MONTH_MAPPING)) {
    const [startMM, startDD] = mapping.dateRange.start.split('-');
    const [endMM, endDD] = mapping.dateRange.end.split('-');
    const startDate = `${startMM}-${startDD}`;
    const endDate = `${endMM}-${endDD}`;

    // Handle year boundary (Capricorn crosses Dec/Jan)
    if (startDate > endDate) {
      if (dateStr >= startDate || dateStr <= endDate) {
        return key;
      }
    } else {
      if (dateStr >= startDate && dateStr <= endDate) {
        return key;
      }
    }
  }

  return null;
}

export function getSefarYetzirahInsight(birthdate: string): SefarYetzirahInsight | null {
  try {
    // Parse birthdate (ISO format: YYYY-MM-DD)
    const date = new Date(birthdate);
    if (isNaN(date.getTime())) {
      return null;
    }

    const month = date.getMonth() + 1; // getMonth is 0-indexed
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    const zodiacKey = getZodiacFromDate(month, day);
    if (!zodiacKey) {
      return null;
    }

    const monthInsight = MONTH_MAPPING[zodiacKey];
    const dayInsight = DAY_MAPPING[dayOfWeek];

    if (!monthInsight || !dayInsight) {
      return null;
    }

    return {
      zodiac: monthInsight.zodiac,
      letter: monthInsight.letter,
      sense: monthInsight.sense,
      element: monthInsight.element,
      planet: monthInsight.planet,
      insight: monthInsight.insight,
      dayOfWeek: dayInsight.day,
      dayLetter: dayInsight.letter,
      dayQuality: dayInsight.quality,
    };
  } catch (error) {
    return null;
  }
}
