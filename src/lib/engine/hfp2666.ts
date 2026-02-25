// ============================================================
// HFP/2666 Calculator (תוכנית התחדשות בניינית - חפ/2666)
// The replacement plan for TAMA 38 in Haifa
// ============================================================

import type { BuildingInput, ParcelGeoData, Hfp2666Result, Hfp2666District } from './types'
import { HFP2666_DISTRICTS, TAMA38_RULES, HFP2666_PARAMS } from '../data/rules'

/**
 * Find which HFP/2666 district a parcel belongs to
 * In the full implementation this would use spatial queries
 * For now uses neighborhood matching as approximation
 */
export function findDistrict(geoData: ParcelGeoData): Hfp2666District | null {
  const neighborhood = (geoData.neighborhood || '').trim()
  const quarter = (geoData.quarter || '').trim()

  // District matching based on neighborhood/quarter names
  // Aligned with חפ/2666 Table 5 district definitions (Nov 2023)
  const districtMap: Record<string, number> = {
    // District 1 - ק. שמואל צפון (230%)
    'קריית שמואל': 1,
    'קריית שמואל צפון': 1,

    // District 2 - ק.חיים מערבית — אברבנאל (180%)
    'קריית חיים מערבית': 2,
    'אברבנאל': 2,

    // District 3 - ק.חיים מזרחית (230%)
    'קריית חיים מזרחית': 3,
    'קריית חיים': 3, // default for unspecified ק.חיים → eastern (more common)

    // District 4 - בת גלים ורחוב אלנבי (250%)
    'בת גלים': 4,
    'אלנבי': 4,

    // District 5 - מושבה גרמנית (185%)
    'מושבה גרמנית': 5,
    'המושבה הגרמנית': 5,

    // District 6 - הדר (230%)
    'הדר': 6,
    'הדר הכרמל': 6,
    'הדר העליון': 6,
    'הדר התחתון': 6,
    'העיר התחתית': 6,
    'ואדי סאליב': 6,
    'ואדי ניסנאס': 6,

    // District 7 - המורדות הצפוניים (135%)
    'המורדות הצפוניים': 7,
    'רמת שמואל': 7,

    // District 8 - כרמל (185%)
    'כרמל': 8,
    'כרמל מערבי': 8,
    'כרמל ותיק': 8, // sub-area: 160%, but mapped to main district for now
    'אחוזה': 8,
    'מרכז הכרמל': 8,
    'כרמליה': 8,

    // District 9 - נוה שאנן (225%)
    'נווה שאנן': 9,
    'נוה שאנן': 9,
    'רמת הנשיא': 9,
    'רמת אלמוגי': 9,

    // District 10 - ציר הרכס - מקטע 2 מוריה (250%)
    'מוריה': 10,
    'דניה': 10, // Note: Danya excluded from TAMA but has HFP/2666 assignment
  }

  // Try neighborhood match first
  for (const [key, districtId] of Object.entries(districtMap)) {
    if (neighborhood.includes(key) || quarter.includes(key)) {
      return HFP2666_DISTRICTS.find(d => d.id === districtId) || null
    }
  }

  // If no match, return null (user can manually select district)
  return null
}

/**
 * Calculate building rights under HFP/2666
 */
export function calculateHfp2666(
  buildingInput: BuildingInput,
  geoData: ParcelGeoData,
  manualDistrictId?: number,
  manualMultiplier?: number
): Hfp2666Result {
  // Find district
  let district: Hfp2666District | null = null
  if (manualDistrictId) {
    district = HFP2666_DISTRICTS.find(d => d.id === manualDistrictId) || null
  } else {
    district = findDistrict(geoData)
  }

  // If no district found, return null result
  if (!district) {
    return createNullResult(buildingInput, geoData)
  }

  // Determine multiplier (manual override > district data)
  const multiplier = manualMultiplier ?? district.multiplier

  // If no multiplier data available
  if (multiplier === null) {
    return {
      district,
      districtDataAvailable: false,
      plotArea: buildingInput.plotArea || geoData.plotArea,
      multiplier: null,
      rawPrimaryArea: null,
      maxByFloors: null,
      maxByDensity: null,
      finalPrimaryArea: null,
      potentialUnitsLow: null,
      potentialUnitsHigh: null,
      existingUnitsToReturn: buildingInput.totalExistingUnits,
      developerUnitsLow: null,
      developerUnitsHigh: null,
      totalMamad: null,
      totalBalcony: null,
      returnedPrimaryToTenants: calculateReturnedPrimary(buildingInput),
      returnedServiceToTenants: calculateReturnedService(buildingInput),
      developerPrimary: null,
      developerService: null,
    }
  }

  const plotArea = buildingInput.plotArea || geoData.plotArea

  // Raw primary area = plot area × multiplier
  const rawPrimaryArea = Math.round(plotArea * multiplier)

  // Cap by max floors — floor area = plot coverage (תכסית 80%) × plot area
  // In demolition-rebuild the existing contour is irrelevant; new footprint = coverage × plot
  const maxFloorArea = plotArea * HFP2666_PARAMS.COVERAGE
  const maxByFloors = Math.round(district.maxFloors * maxFloorArea)

  // Cap by density (units per dunam)
  const plotDunams = plotArea / 1000
  const [, maxUnitsPerDunam] = district.unitsPerDunam
  const maxUnits = Math.floor(plotDunams * maxUnitsPerDunam)
  const avgUnit = buildingInput.minApartmentSize || TAMA38_RULES.DEFAULT_AVG_APARTMENT
  const maxByDensity = maxUnits * avgUnit

  // Final = minimum of all caps
  const finalPrimaryArea = Math.min(rawPrimaryArea, maxByFloors, maxByDensity)

  // Units
  const potentialUnitsLow = Math.floor(finalPrimaryArea / avgUnit)
  const potentialUnitsHigh = Math.ceil(finalPrimaryArea / avgUnit)
  const existingUnitsToReturn = buildingInput.totalExistingUnits
  const developerUnitsLow = Math.max(0, potentialUnitsLow - existingUnitsToReturn)
  const developerUnitsHigh = Math.max(0, potentialUnitsHigh - existingUnitsToReturn)

  // Service areas
  const totalUnits = potentialUnitsHigh
  const totalMamad = totalUnits * TAMA38_RULES.MAMAD_PER_UNIT
  const totalBalcony = totalUnits * HFP2666_PARAMS.BALCONY_PER_UNIT

  // Economic split
  const returnedPrimary = calculateReturnedPrimary(buildingInput)
  const returnedService = calculateReturnedService(buildingInput)
  const developerPrimary = finalPrimaryArea - returnedPrimary
  const developerService = (totalMamad + totalBalcony) - returnedService

  return {
    district,
    districtDataAvailable: true,
    plotArea,
    multiplier,
    rawPrimaryArea,
    maxByFloors,
    maxByDensity,
    finalPrimaryArea,
    potentialUnitsLow,
    potentialUnitsHigh,
    existingUnitsToReturn,
    developerUnitsLow,
    developerUnitsHigh,
    totalMamad,
    totalBalcony,
    returnedPrimaryToTenants: returnedPrimary,
    returnedServiceToTenants: returnedService,
    developerPrimary,
    developerService,
  }
}

// ----- Helper functions -----

function calculateReturnedPrimary(buildingInput: BuildingInput): number {
  const avgExistingUnit = buildingInput.existingContour / (buildingInput.existingUnitsPerFloor || 1)
  const returnPerTenant = avgExistingUnit + buildingInput.returnPerUnit
  return Math.round(returnPerTenant * buildingInput.totalExistingUnits)
}

function calculateReturnedService(buildingInput: BuildingInput): number {
  const servicePerTenant = TAMA38_RULES.MAMAD_PER_UNIT + HFP2666_PARAMS.BALCONY_PER_UNIT
  return servicePerTenant * buildingInput.totalExistingUnits
}

function createNullResult(buildingInput: BuildingInput, geoData: ParcelGeoData): Hfp2666Result {
  return {
    district: null as unknown as Hfp2666District,
    districtDataAvailable: false,
    plotArea: geoData.plotArea,
    multiplier: null,
    rawPrimaryArea: null,
    maxByFloors: null,
    maxByDensity: null,
    finalPrimaryArea: null,
    potentialUnitsLow: null,
    potentialUnitsHigh: null,
    existingUnitsToReturn: buildingInput.totalExistingUnits,
    developerUnitsLow: null,
    developerUnitsHigh: null,
    totalMamad: null,
    totalBalcony: null,
    returnedPrimaryToTenants: calculateReturnedPrimary(buildingInput),
    returnedServiceToTenants: calculateReturnedService(buildingInput),
    developerPrimary: null,
    developerService: null,
  }
}
