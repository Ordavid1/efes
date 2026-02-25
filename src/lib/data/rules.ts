// ============================================================
// Regulatory Rules Database - Haifa Building Rights
// All values sourced from official Haifa municipal documents
// ============================================================

import type { Hfp2666District } from '../engine/types'

// ----- TAMA 38 Policy Rules (חפ/מד/2500 - מדיניות 2020) -----
export const TAMA38_RULES = {
  /** מ"ר תוספת לכל יחידת דיור קיימת */
  EXPANSION_PER_UNIT: 13,

  /** גודל ממ"ד מינימלי (מ"ר) */
  MAMAD_MIN_SIZE: 12,

  /** שטח מרפסת זיזית לדירה (מ"ר) */
  BALCONY_SIZE: 12,

  /** שטח דירה מינימלי נטו בחיפה (מ"ר) - כולל ממ"ד */
  MIN_APARTMENT_SIZE: 54,

  /** אחוזי בנייה ברירת מחדל */
  DEFAULT_BUILDING_PCT: 0.60,

  /** הקלת שבס - אחוז */
  SHEVES_RELIEF: 0.06,

  /** שטח עמודים מפולשת ברירת מחדל (מ"ר) */
  DEFAULT_PILOTIS_AREA: 70,

  /** שטח דירה ממוצעת ברירת מחדל (מ"ר) */
  DEFAULT_AVG_APARTMENT: 85,

  /** תוספת ברירת מחדל לדירה מוחזרת (מ"ר)
   *  25 = 13 (תוספת תמ"א לשטח עיקרי) + 12 (ממ"ד)
   *  מקור: חפ/מד/2500 מדיניות 2020 */
  DEFAULT_RETURN_ADDITION: 25,

  /** תאריך פקיעת תמ"א 38 בחיפה */
  EXPIRY_DATE: '2026-05-18',

  /** שטח ממ"ר לדירה בגין תוספת חובה */
  MAMAD_PER_UNIT: 12,

  /** מרפסת זיזית לדירה */
  BALCONY_PER_UNIT: 12,
} as const

// ----- Shaked / Amendment 139 Rules (תיקון 139 - חלופת שקד) -----
export const SHAKED_RULES = {
  /** מכפיל מקסימלי למסלול הריסה ובנייה - 400% */
  MAX_DEMOLISH_REBUILD: 4.0,

  /** מכפיל מקסימלי למסלול חיזוק - 200% */
  MAX_STRENGTHEN: 2.0,

  /** שיעור היטל השבחה */
  BETTERMENT_LEVY_RATE: 0.25,
} as const

// ----- HFP/2666 District Configuration (10 מתחמי תכנון) -----
// Source: חפ/2666 עדכון לטבלה 5 (נובמבר 2023) — ALL districts verified
// Note: District 8 has sub-areas (כרמל ותיק 160%) and District 10 has 3 segments
// — sub-districts deferred to future UI update; main values used here
export const HFP2666_DISTRICTS: Hfp2666District[] = [
  {
    id: 1,
    name: 'ק. שמואל צפון',
    multiplier: 2.30, // 230% — טבלה 5
    maxFloors: 7,
    unitsPerDunam: [11, 19],
  },
  {
    id: 2,
    name: 'ק.חיים מערבית — אברבנאל',
    multiplier: 1.80, // 180% — טבלה 5
    maxFloors: 7,
    unitsPerDunam: [11, 15],
  },
  {
    id: 3,
    name: 'ק.חיים מזרחית',
    multiplier: 2.30, // 230% — טבלה 5
    maxFloors: 7,
    unitsPerDunam: [11, 19],
  },
  {
    id: 4,
    name: 'בת גלים ורחוב אלנבי',
    multiplier: 2.50, // 250% — טבלה 5
    maxFloors: 7, // 7 שטוח/עולה, 8 יורד
    unitsPerDunam: [11, 22],
  },
  {
    id: 5,
    name: 'מושבה גרמנית',
    multiplier: 1.85, // 185% — טבלה 5
    maxFloors: 6, // מוגבל ל-6 קומות
    unitsPerDunam: [11, 15],
  },
  {
    id: 6,
    name: 'הדר',
    multiplier: 2.30, // 230% — טבלה 5
    maxFloors: 6, // 6 שטוח/עולה, 8 יורד
    unitsPerDunam: [11, 22],
  },
  {
    id: 7,
    name: 'המורדות הצפוניים',
    multiplier: 1.35, // 135% — טבלה 5, אזור טופוגרפי רגיש
    maxFloors: 4, // 4 קומות + גג (לא יעלה על 8.5 מ')
    unitsPerDunam: [11, 11],
  },
  {
    id: 8,
    name: 'כרמל',
    multiplier: 1.85, // 185% — טבלה 5 (תת-אזור כרמל ותיק: 160%)
    maxFloors: 7, // 7 שטוח/עולה, 8 יורד
    unitsPerDunam: [11, 15],
  },
  {
    id: 9,
    name: 'נוה שאנן',
    multiplier: 2.25, // 225% — טבלה 5
    maxFloors: 7, // 7 שטוח/עולה, 8 יורד
    unitsPerDunam: [11, 18],
  },
  {
    id: 10,
    name: 'ציר הרכס - מקטע 2 מוריה',
    multiplier: 2.50, // 250% — טבלה 5 (מקטעים 1,3: 185%)
    maxFloors: 9, // מוקד ציפוף אינטנסיבי — 7 שטוח/עולה, 9 יורד
    unitsPerDunam: [11, 22],
  },
]

// ----- Exclusion Zones (אזורי החרגה) -----
export const EXCLUSION_ZONES = {
  /** הוד הכרמל (דניה) - בנייה צמודת קרקע */
  DANYA: {
    name: 'הוד הכרמל (דניה)',
    gushNumbers: [10769, 10770, 10771, 10772, 10773, 10774, 10775, 10776, 12251],
    streets: [
      'שדרות אבא חושי', 'דניה', 'קוסטה ריקה', 'איטליה', 'ליבריה',
      'פינלנד', 'שוודיה', 'גרינבוים', 'הונדורס',
    ],
    maxAddition: 25,
    allowNewUnits: false,
    reason: 'אזור בנייה צמודת קרקע בצפיפות נמוכה - אסור בציפוף אינטנסיבי',
  },

  /** קריית חיים מערבית */
  WESTERN_KIRYAT_HAIM: {
    name: 'קריית חיים מערבית',
    gushRange: [11570, 11600] as [number, number],
    additionalGushim: [11624],
    streets: [
      'שדרות דגניה', 'שדרות טרומן', 'ורבורג', 'בן צבי',
      'הציוד', 'העמל', 'שדרות מח"ל',
    ],
    maxAddition: 25,
    allowNewUnits: false,
    reason: 'מרקם תכנוני נמוך ממערב למסילת הרכבת - רחובות צרים',
  },

  /** רמת רמז - "הגגות האדומים" */
  RAMAT_REMEZ_RED_ROOFS: {
    name: 'רמת רמז - הגגות האדומים',
    streets: ['קומוי', 'בורוכוב', 'דורות', 'אינטרנציונל'],
    maxAddition: 25,
    allowNewUnits: false,
    reason: 'אזור בתי מגורים נמוכים עם גגות רעפים - שימור אופי שכונתי',
    note: 'שאר רמת רמז (חביבה רייק, זלמן שזר) מאפשר פינוי-בינוי - רק רחובות הגגות האדומים מוחרגים',
  },
} as const

// ----- Pinui-Binui Master Plan Areas (תוכניות אב) -----
export const PINUI_BINUI_AREAS = [
  {
    name: 'שכונות החוף (חפ/2350)',
    planId: 'חפ/2350',
    neighborhoods: ['נווה דוד', 'שער העלייה', 'שפרינצק מערב', 'עין הים'],
    description: 'תוכנית אב להתחדשות שכונות החוף',
  },
  {
    name: 'קריית אליעזר',
    planId: 'קריית אליעזר פינוי-בינוי',
    neighborhoods: ['קריית אליעזר'],
    description: '216 יח"ד ישנות → 970 דירות חדשות, 7 מגדלים 18-34 קומות',
  },
  {
    name: 'רמת שאול',
    planId: 'רמת שאול תוכנית אב',
    neighborhoods: ['רמת שאול'],
    description: 'תוכנית אב שאושרה לאחרונה',
  },
  {
    name: 'שפרינצק',
    planId: 'שפרינצק תוכנית אב',
    neighborhoods: ['שפרינצק'],
    description: 'תוכנית אב שאושרה לאחרונה',
  },
] as const

// ----- HFP/2666 Calculation Parameters -----
export const HFP2666_PARAMS = {
  /** תכסית (כיסוי קרקע) — 80% משטח המגרש, עד 85% למגרשים קטנים/לא סדירים
   *  מקור: חפ/2666 מסמך מלא */
  COVERAGE: 0.80,

  /** שטח מרפסת לדירה (מ"ר) — 14 מ"ר per חפ/2666 (שונה מ-12 של תמ"א 38)
   *  מקור: חפ/2666 מסמך מלא */
  BALCONY_PER_UNIT: 14,
} as const

// ----- Licensing Timeline (ערוצי רישוי) -----
export const LICENSING_TRACKS = {
  SHORT: { name: 'מסלול מקוצר', days: 25, description: 'עבודות ללא סיכון קונסטרוקטיבי' },
  STANDARD: { name: 'מסלול מלא תואם תב"ע', days: 45, description: 'תוכניות תואמות ת.ב.ע ללא הקלות' },
  FULL: { name: 'מסלול מלא עם הקלות', days: 90, description: 'הקלות, שימושים חורגים, התחדשות עירונית' },
} as const
