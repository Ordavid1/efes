// ============================================================
// Exclusion Filter Pipeline
// Runs sequential checks against GIS layers and rules
// ============================================================

import type { ParcelGeoData, BuildingInput, FilterResult, FilterStatus } from './types'
import { EXCLUSION_ZONES, PINUI_BINUI_AREAS } from '../data/rules'

/**
 * Run all exclusion filters on a parcel
 * Returns the most restrictive result
 */
export function runFilterPipeline(
  geoData: ParcelGeoData,
  buildingInput: BuildingInput
): FilterResult {
  // Run filters in priority order (most restrictive first)
  const filters = [
    () => checkConservationBuilding(geoData),
    () => checkExclusionZone(geoData),
    () => checkPinuiBinuiArea(geoData),
    () => checkSingleFamilyHome(buildingInput),
    () => checkExistingTama38(buildingInput),
  ]

  for (const filter of filters) {
    const result = filter()
    if (result.status !== 'CLEAR') {
      return result
    }
  }

  return {
    status: 'CLEAR',
    reason: '',
    details: '',
    allowTama38: true,
    allowShaked: true,
    allowHfp2666: true,
  }
}

/** Filter 1: Conservation Building Check */
function checkConservationBuilding(geoData: ParcelGeoData): FilterResult {
  if (geoData.isConservationBuilding) {
    return {
      status: 'BLOCKED',
      reason: 'מבנה לשימור',
      details: 'המבנה מסווג כמבנה לשימור. תמ"א 38 וחפ/2666 אינם חלים על מבנים לשימור. נדרש אישור מחלקת שימור.',
      allowTama38: false,
      allowShaked: false,
      allowHfp2666: false,
    }
  }
  return clearResult()
}

/** Filter 2: Exclusion Zone Check (חפ/2000) */
function checkExclusionZone(geoData: ParcelGeoData): FilterResult {
  const gush = geoData.parcelId.gush
  const street = geoData.streetName || ''

  // Check Danya
  if ((EXCLUSION_ZONES.DANYA.gushNumbers as readonly number[]).includes(gush)) {
    return limitedResult(
      EXCLUSION_ZONES.DANYA.name,
      EXCLUSION_ZONES.DANYA.reason,
      EXCLUSION_ZONES.DANYA.maxAddition
    )
  }

  // Check Western Kiryat Haim
  const [rangeStart, rangeEnd] = EXCLUSION_ZONES.WESTERN_KIRYAT_HAIM.gushRange
  if (
    (gush >= rangeStart && gush <= rangeEnd) ||
    (EXCLUSION_ZONES.WESTERN_KIRYAT_HAIM.additionalGushim as readonly number[]).includes(gush)
  ) {
    return limitedResult(
      EXCLUSION_ZONES.WESTERN_KIRYAT_HAIM.name,
      EXCLUSION_ZONES.WESTERN_KIRYAT_HAIM.reason,
      EXCLUSION_ZONES.WESTERN_KIRYAT_HAIM.maxAddition
    )
  }

  // Check Ramat Remez Red Roofs
  if (street) {
    const isRedRoofStreet = EXCLUSION_ZONES.RAMAT_REMEZ_RED_ROOFS.streets.some(
      s => street.includes(s)
    )
    if (isRedRoofStreet) {
      return limitedResult(
        EXCLUSION_ZONES.RAMAT_REMEZ_RED_ROOFS.name,
        EXCLUSION_ZONES.RAMAT_REMEZ_RED_ROOFS.reason,
        EXCLUSION_ZONES.RAMAT_REMEZ_RED_ROOFS.maxAddition
      )
    }
  }

  return clearResult()
}

/** Filter 3: Pinui-Binui Master Plan Area */
function checkPinuiBinuiArea(geoData: ParcelGeoData): FilterResult {
  const neighborhood = geoData.neighborhood || ''

  for (const area of PINUI_BINUI_AREAS) {
    if (area.neighborhoods.some(n => neighborhood.includes(n))) {
      return {
        status: 'REDIRECTED',
        reason: `אזור פינוי-בינוי מתחמי: ${area.name}`,
        details: `החלקה נמצאת באזור תוכנית אב ${area.planId}. ${area.description}. חישוב זכויות בודד אינו רלוונטי - הזכויות נקבעות ברמה המתחמית.`,
        allowTama38: false,
        allowShaked: false,
        allowHfp2666: false,
        redirectPlan: area.planId,
      }
    }
  }

  return clearResult()
}

/** Filter 4: Single Family Home (חד משפחתי — 1 unit only) */
function checkSingleFamilyHome(buildingInput: BuildingInput): FilterResult {
  if (buildingInput.buildingType === 'single_family') {
    return {
      status: 'LIMITED',
      reason: 'בית חד-משפחתי (יח״ד אחת)',
      details: 'מבנה הכולל יח״ד אחת בלבד ("חד משפחתי") זכאי לתוספת חיזוק סייסמי של 25 מ״ר בלבד (כולל ממ״ד). לא יותרו תוספת יח״ד וקומות מכח תמ״א 38.',
      allowTama38: false,
      allowShaked: false,
      allowHfp2666: false,
      maxAddition: 25,
    }
  }
  return clearResult()
}

/** Filter 5: Existing TAMA 38 */
function checkExistingTama38(buildingInput: BuildingInput): FilterResult {
  if (buildingInput.hasExistingTama38) {
    return {
      status: 'BLOCKED',
      reason: 'זכויות תמ"א 38 מומשו',
      details: 'המבנה כבר מימש זכויות בנייה מכוח תמ"א 38. תוכנית חפ/2666 אינה חלה על מבנים שכבר מימשו זכויות. ניתן לבחון רק מסלולי הקלה נוספים.',
      allowTama38: false,
      allowShaked: false,
      allowHfp2666: false,
    }
  }
  return clearResult()
}

// ----- Helper functions -----

function clearResult(): FilterResult {
  return {
    status: 'CLEAR',
    reason: '',
    details: '',
    allowTama38: true,
    allowShaked: true,
    allowHfp2666: true,
  }
}

function limitedResult(
  zoneName: string,
  reason: string,
  maxAddition: number
): FilterResult {
  return {
    status: 'LIMITED',
    reason: `אזור החרגה: ${zoneName}`,
    details: `${reason}. תוספת מקסימלית: ${maxAddition} מ"ר (ממ"ד בלבד) ללא דירות יזם חדשות.`,
    allowTama38: false,
    allowShaked: false,
    allowHfp2666: false,
    maxAddition,
  }
}
