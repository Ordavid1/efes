// ============================================================
// Regulatory Rules Database - Haifa Building Rights
// All values sourced from official Haifa municipal documents
// ============================================================

import type { Hfp2666District, Hfp2666SubArea } from '../engine/types'

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

  /** תוספת שטח עיקרי לדירה מוחזרת (מ"ר) - הרחבת תמ"א בלבד
   *  מקור: חפ/מד/2500 מדיניות 2020 */
  PRIMARY_RETURN_PER_UNIT: 13,

  /** ממ"ד לדירה מוחזרת (מ"ר) - מופרד מהשטח העיקרי לחישוב פלדלת
   *  מקור: חפ/מד/2500 מדיניות 2020 */
  MAMAD_RETURN_PER_UNIT: 12,

  /** תאריך פקיעת תמ"א 38 בחיפה */
  EXPIRY_DATE: '2026-05-18',

  /** שטח ממ"ר לדירה בגין תוספת חובה */
  MAMAD_PER_UNIT: 12,

  /** תקרת ממ"ד מקסימלית נטו (מ"ר) - תקנת רובוט רישוי 2025
   *  עודף מעל 12 מ"ר מנוכה מהשטח העיקרי של היזם */
  MAMAD_MAX_NET: 12,

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
// Source: חפ/2666 עדכון לטבלה 5 (נובמבר 2025) — ALL districts + sub-areas
// Each district has sub-areas with conditional multipliers based on:
//   - existing unit count (min/max threshold)
//   - named area (special streets, wadi-adjacent, etc.)
//   - strengthening-only status (25 sqm/unit addition, no demolition)
export const HFP2666_DISTRICTS: Hfp2666District[] = [
  {
    id: 1,
    name: 'ק. שמואל צפון',
    subAreas: [
      { id: '1a', districtId: 1, name: 'ק. שמואל צפון', multiplier: 2.50, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 21, isDefault: true },
    ],
  },
  {
    id: 2,
    name: 'ק.חיים מערבית — אברבנאל',
    subAreas: [
      { id: '2a', districtId: 2, name: 'ק.חיים מערבית', multiplier: 0, commercialBonus: 0, maxFloors: 0, unitsPerDunam: 0, condition: { type: 'strengthening_only' } },
      { id: '2b', districtId: 2, name: 'אברבנאל', multiplier: 2.50, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 21, isDefault: true },
    ],
  },
  {
    id: 3,
    name: 'ק.חיים מזרחית',
    subAreas: [
      { id: '3a', districtId: 3, name: 'ק.חיים מזרחית (4+ יח״ד)', multiplier: 2.50, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 21, condition: { type: 'min_existing_units', threshold: 4 } },
      { id: '3b', districtId: 3, name: 'ק.חיים מזרחית (עד 3 יח״ד)', multiplier: 2.30, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 19, condition: { type: 'max_existing_units', threshold: 3 }, isDefault: true },
      { id: '3c', districtId: 3, name: 'אח״י אילת', multiplier: 2.50, commercialBonus: 0.25, maxFloors: 10, unitsPerDunam: 25 },
      { id: '3d', districtId: 3, name: 'משה שרת', multiplier: 2.50, commercialBonus: 0, maxFloors: 10, unitsPerDunam: 25 },
      { id: '3e', districtId: 3, name: 'אח״י אילת (איחוד מגרשים)', multiplier: 3.00, commercialBonus: 0.40, maxFloors: 10, unitsPerDunam: 25, condition: { type: 'parcel_consolidation', minParcels: 2 } },
      { id: '3f', districtId: 3, name: 'משה שרת (איחוד מגרשים)', multiplier: 2.80, commercialBonus: 0.20, maxFloors: 10, unitsPerDunam: 22, condition: { type: 'parcel_consolidation', minParcels: 2 } },
      { id: '3g', districtId: 3, name: 'אח״י אילת + משה שרת (מוקד)', multiplier: 4.60, commercialBonus: 0.40, maxFloors: 18, unitsPerDunam: 35, condition: { type: 'focal_hub', minAreaDunams: 2.5 } },
    ],
  },
  {
    id: 4,
    name: 'בת גלים ואלנבי',
    subAreas: [
      { id: '4a', districtId: 4, name: 'בת גלים (6+ יח״ד)', multiplier: 2.80, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 25, condition: { type: 'min_existing_units', threshold: 6 } },
      { id: '4b', districtId: 4, name: 'בת גלים (עד 5 יח״ד)', multiplier: 2.50, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 22, condition: { type: 'max_existing_units', threshold: 5 }, isDefault: true },
      { id: '4c', districtId: 4, name: 'אלנבי', multiplier: 2.50, commercialBonus: 0, maxFloors: 8, unitsPerDunam: 22 },
      { id: '4d', districtId: 4, name: 'העלייה השנייה (רח׳ עירוני מיוחד)', multiplier: 2.80, commercialBonus: 0.20, maxFloors: 9, unitsPerDunam: 25 },
    ],
  },
  {
    id: 5,
    name: 'מושבה גרמנית',
    subAreas: [
      { id: '5a', districtId: 5, name: 'מושבה גרמנית', multiplier: 1.85, commercialBonus: 0.10, maxFloors: 6, unitsPerDunam: 15, isDefault: true },
    ],
  },
  {
    id: 6,
    name: 'הדר',
    subAreas: [
      { id: '6a', districtId: 6, name: 'הדר - עבאס', multiplier: 2.30, commercialBonus: 0, maxFloors: 8, unitsPerDunam: 22, isDefault: true },
      { id: '6b', districtId: 6, name: 'הדר רחוב עירוני מיוחד', multiplier: 2.50, commercialBonus: 0.15, maxFloors: 9, unitsPerDunam: 25 },
      { id: '6c', districtId: 6, name: 'ארלוזורוב', multiplier: 2.50, commercialBonus: 0.15, maxFloors: 9, unitsPerDunam: 25 },
      { id: '6d', districtId: 6, name: 'מורדות צפוניים - עבאס', multiplier: 1.35, commercialBonus: 0, maxFloors: 6, unitsPerDunam: 11 },
    ],
  },
  {
    id: 7,
    name: 'וינגייט וגולומב',
    subAreas: [
      { id: '7a', districtId: 7, name: 'וינגייט וגולומב', multiplier: 1.35, commercialBonus: 0.15, maxFloors: 6, unitsPerDunam: 11, isDefault: true },
    ],
  },
  {
    id: 8,
    name: 'כרמל',
    subAreas: [
      { id: '8a', districtId: 8, name: 'כרמל (5+ יח״ד)', multiplier: 2.10, commercialBonus: 0, maxFloors: 8, unitsPerDunam: 17, condition: { type: 'min_existing_units', threshold: 5 } },
      { id: '8b', districtId: 8, name: 'כרמל (עד 4 יח״ד)', multiplier: 1.95, commercialBonus: 0, maxFloors: 8, unitsPerDunam: 16, condition: { type: 'max_existing_units', threshold: 4 }, isDefault: true },
      { id: '8c', districtId: 8, name: 'כרמל גובלי ואדי', multiplier: 1.85, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 15 },
      { id: '8d', districtId: 8, name: 'אביגייל-אהוד', multiplier: 1.85, commercialBonus: 0.10, maxFloors: 7, unitsPerDunam: 16 },
      { id: '8e', districtId: 8, name: 'הנשיא רח׳ עירוני מיוחד', multiplier: 1.85, commercialBonus: 0.15, maxFloors: 9, unitsPerDunam: 15 },
      { id: '8f', districtId: 8, name: 'כרמל ותיק (היינה, הנדיב, תל מאנה, שמבור)', multiplier: 1.60, commercialBonus: 0, maxFloors: 8, unitsPerDunam: 13 },
    ],
  },
  {
    id: 9,
    name: 'נוה שאנן',
    subAreas: [
      { id: '9a', districtId: 9, name: 'נוה שאנן', multiplier: 2.50, commercialBonus: 0, maxFloors: 8, unitsPerDunam: 19, isDefault: true },
      { id: '9b', districtId: 9, name: 'שער הטכניון', multiplier: 2.50, commercialBonus: 0, maxFloors: 9, unitsPerDunam: 30 },
      { id: '9c', districtId: 9, name: 'נוה שאנן התיקה', multiplier: 2.25, commercialBonus: 0, maxFloors: 7, unitsPerDunam: 19 },
      { id: '9d', districtId: 9, name: 'חנקין-גורדון', multiplier: 2.50, commercialBonus: 0.10, maxFloors: 8, unitsPerDunam: 19 },
      { id: '9e', districtId: 9, name: 'גגות אדומים', multiplier: 0, commercialBonus: 0, maxFloors: 0, unitsPerDunam: 0, condition: { type: 'strengthening_only' } },
      { id: '9f', districtId: 9, name: 'טרומפלדור, חניתה, שלום עליכם', multiplier: 3.00, commercialBonus: 0.20, maxFloors: 10, unitsPerDunam: 30 },
      { id: '9g', districtId: 9, name: 'טרומפלדור, חניתה, שלום עליכם (איחוד מגרשים)', multiplier: 3.00, commercialBonus: 0.20, maxFloors: 10, unitsPerDunam: 30, condition: { type: 'parcel_consolidation', minParcels: 2 } },
      { id: '9h', districtId: 9, name: 'טרומפלדור + שלום עליכם (מוקד)', multiplier: 3.80, commercialBonus: 0.20, maxFloors: 18, unitsPerDunam: 30, condition: { type: 'focal_hub', minAreaDunams: 3 } },
    ],
  },
  {
    id: 10,
    name: 'ציר הרכס',
    subAreas: [
      { id: '10a', districtId: 10, name: 'ציר הרכס (2 מגרשים)', multiplier: 3.00, commercialBonus: 0.20, maxFloors: 10, unitsPerDunam: 30, isDefault: true },
      { id: '10b', districtId: 10, name: 'ציר הרכס מקטע 2+3 (מוריה, חורב, אבא חושי)', multiplier: 2.50, commercialBonus: 0.20, maxFloors: 10, unitsPerDunam: 25 },
      { id: '10c', districtId: 10, name: 'ציר הרכס (איחוד מגרשים)', multiplier: 3.00, commercialBonus: 0.20, maxFloors: 10, unitsPerDunam: 30, condition: { type: 'parcel_consolidation', minParcels: 2 } },
      { id: '10d', districtId: 10, name: 'ציר הרכס (מוקד)', multiplier: 3.40, commercialBonus: 0.60, maxFloors: 18, unitsPerDunam: 30, condition: { type: 'focal_hub', minAreaDunams: 3 } },
    ],
  },
]

/** Strengthening-only addition (25 sqm per existing unit) */
export const HFP2666_STRENGTHENING_ADDITION = 25

/** Building H parameters (מבני H — כלל העיר) */
export const HFP2666_BUILDING_H = {
  /** מכפיל: פי 3 מהנפח הקיים (ברוטו) */
  MULTIPLIER: 3,
  /** קומות מירבי — מגרש שטוח */
  MAX_FLOORS_FLAT: 12,
  /** קומות מירבי — מגרש משופע יורד */
  MAX_FLOORS_DESCENDING: 10,
} as const

/** Small building override (<4 units, districts 4-10) — כל המתחמים למעטי 1-3 */
export const HFP2666_SMALL_BUILDING = {
  /** <4 means ≤3 */
  MAX_UNITS: 3,
  /** 135% */
  MULTIPLIER: 1.35,
  /** 8 יח"ד לדונם */
  MAX_DENSITY: 8,
  /** לא יותר ממכפיל 2 מהקיים */
  MAX_MULTIPLIER_RATIO: 2,
  /** קומות מירבי — מגרש שטוח */
  MAX_FLOORS_FLAT: 6,
  /** קומות מירבי — מגרש משופע יורד */
  MAX_FLOORS_DESCENDING: 4,
  /** לא חל על מתחמים 1-3 */
  EXCLUDED_DISTRICTS: [1, 2, 3] as readonly number[],
} as const

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

// ----- Inclusive Housing Districts (דיור מכליל - חפ/מד/2699) -----
// Source: מדיניות עירונית ל'דיור מכליל' בהתחדשות עירונית ובנייה חדשה בחיפה
// Scoring: 1-1.5 = 5%, 2-2.5 = 10%, 3-3.5 = 15%
// Applies to plans with 100+ housing units
export interface InclusiveHousingDistrict {
  id: number
  name: string
  score: number // 1-3.5 composite score from 4 parameters
  rate: number // 0.05, 0.10, or 0.15
  minUnitSize: number // 30 מ"ר
  maxUnitSize: number // 55 מ"ר
  neighborhoods: string[] // for GIS neighborhood matching
}

export const INCLUSIVE_HOUSING_DISTRICTS: InclusiveHousingDistrict[] = [
  { id: 1, name: 'שכונות החוף', score: 2.5, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['נווה דוד', 'שער העלייה'] },
  { id: 2, name: 'עין הים', score: 1.5, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['עין הים'] },
  { id: 3, name: 'קריית שפרינצק-רמת שאול', score: 1.5, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['שפרינצק', 'רמת שאול'] },
  { id: 4, name: 'בת גלים', score: 3, rate: 0.15, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['בת גלים'] },
  { id: 5, name: 'קריית אליעזר-אליהו', score: 2.5, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['קריית אליעזר', 'קריית אליהו'] },
  { id: 6, name: 'עיר תחתית', score: 3.5, rate: 0.15, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['העיר התחתית', 'ואדי סאליב'] },
  { id: 7, name: 'הדר-כרמל', score: 1.5, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['הדר', 'הדר הכרמל', 'הדר העליון', 'הדר התחתון'] },
  { id: 8, name: 'ואדי סאליב', score: 1.5, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['ואדי ניסנאס'] },
  { id: 9, name: 'שכונות מזרחיות', score: 1, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['נווה יוסף', 'תל עמל', 'חליסה'] },
  { id: 10, name: 'מבואות מזרחיים', score: 2, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['מבואות מזרחיים'] },
  { id: 11, name: 'מורדות נו"ש', score: 1, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['מורדות נווה שאנן'] },
  { id: 12, name: 'נווה שאנן + יזרעאליה', score: 2.5, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['נווה שאנן', 'נוה שאנן', 'יזרעאליה'] },
  { id: 13, name: 'מרכז זיו + רח\' טרומפלדור', score: 3.5, rate: 0.15, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['מרכז זיו', 'טרומפלדור'] },
  { id: 14, name: 'רמות רמז', score: 2, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['רמת רמז', 'רמות רמז'] },
  { id: 15, name: 'ציר הרכס', score: 3, rate: 0.15, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['מוריה', 'ציר הרכס'] },
  { id: 16, name: 'גרנד קניון', score: 2.5, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['גרנד קניון'] },
  { id: 17, name: 'טרומן', score: 2, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['טרומן', 'קריית חיים מערבית'] },
  { id: 18, name: 'דגניה', score: 2, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['דגניה', 'דניה'] },
  { id: 19, name: 'ורבורג', score: 1.5, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['ורבורג'] },
  { id: 20, name: 'בן צבי', score: 1.5, rate: 0.05, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['בן צבי', 'קריית חיים מזרחית'] },
  { id: 21, name: 'שבטי ישראל', score: 2, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['שבטי ישראל'] },
  { id: 22, name: 'אח"י אילת', score: 2, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['אח"י אילת'] },
  { id: 23, name: 'מבואות דרומיים', score: 2.5, rate: 0.10, minUnitSize: 30, maxUnitSize: 55, neighborhoods: ['מבואות דרומיים'] },
]

export const INCLUSIVE_HOUSING_PARAMS = {
  /** תכנית מינימלית שמחילה דיור מכליל */
  MIN_UNITS_FOR_POLICY: 100,
  /** מקדם יחידת דיור מכלילה (0.5 ביחס ליח"ד רגילה) */
  UNIT_MULTIPLIER: 0.5,
} as const
