// ============================================================
// HFP/2666 Calculator (תוכנית התחדשות בניינית - חפ/2666)
// The replacement plan for TAMA 38 in Haifa
// Source: חפ/2666 Table 5 (November 2025)
// ============================================================

import type { BuildingInput, ParcelGeoData, Hfp2666Result, Hfp2666District, Hfp2666SubArea } from './types'
import { HFP2666_DISTRICTS, TAMA38_RULES, HFP2666_PARAMS, HFP2666_STRENGTHENING_ADDITION, HFP2666_BUILDING_H, HFP2666_SMALL_BUILDING, INCLUSIVE_HOUSING_DISTRICTS } from '../data/rules'
import type { InclusiveHousingDistrict } from '../data/rules'

/**
 * Find which HFP/2666 district a parcel belongs to.
 * Uses neighborhood/quarter name matching (string-based).
 * Returns the parent district; sub-area is resolved separately.
 */
export function findDistrict(geoData: ParcelGeoData): Hfp2666District | null {
  const neighborhood = (geoData.neighborhood || '').trim()
  const quarter = (geoData.quarter || '').trim()

  // District matching based on neighborhood/quarter names
  // Aligned with חפ/2666 Table 5 district definitions (Nov 2025)
  const districtMap: Record<string, number> = {
    // District 1 - ק. שמואל צפון (250%)
    'קריית שמואל': 1,
    'קריית שמואל צפון': 1,

    // District 2 - ק.חיים מערבית — אברבנאל
    'קריית חיים מערבית': 2,
    'אברבנאל': 2,

    // District 3 - ק.חיים מזרחית
    'קריית חיים מזרחית': 3,
    'קריית חיים': 3, // default for unspecified ק.חיים → eastern (more common)
    'אח"י אילת': 3,
    'משה שרת': 3,

    // District 4 - בת גלים ואלנבי
    'בת גלים': 4,
    'אלנבי': 4,
    'העלייה השנייה': 4,

    // District 5 - מושבה גרמנית
    'מושבה גרמנית': 5,
    'המושבה הגרמנית': 5,

    // District 6 - הדר
    'הדר': 6,
    'הדר הכרמל': 6,
    'הדר העליון': 6,
    'הדר התחתון': 6,
    'העיר התחתית': 6,
    'ואדי סאליב': 6,
    'ואדי ניסנאס': 6,
    'ארלוזורוב': 6,

    // District 7 - וינגייט וגולומב
    'המורדות הצפוניים': 7,
    'וינגייט': 7,
    'גולומב': 7,
    'רמת שמואל': 7,

    // District 8 - כרמל
    'כרמל': 8,
    'כרמל מערבי': 8,
    'כרמל ותיק': 8,
    'אחוזה': 8,
    'מרכז הכרמל': 8,
    'כרמליה': 8,
    'אביגייל': 8,
    'אהוד': 8,
    'היינה': 8,
    'הנדיב': 8,
    'תל מאנה': 8,
    'שמבור': 8,

    // District 9 - נוה שאנן
    'נווה שאנן': 9,
    'נוה שאנן': 9,
    'רמת הנשיא': 9,
    'רמת אלמוגי': 9,
    'שער הטכניון': 9,
    'טרומפלדור': 9,
    'חניתה': 9,
    'שלום עליכם': 9,
    'חנקין': 9,
    'גורדון': 9,

    // District 10 - ציר הרכס
    'מוריה': 10,
    'חורב': 10,
    'אבא חושי': 10,
    'דניה': 10,
  }

  // Try neighborhood match first, then quarter
  for (const [key, districtId] of Object.entries(districtMap)) {
    if (neighborhood.includes(key) || quarter.includes(key)) {
      return HFP2666_DISTRICTS.find(d => d.id === districtId) || null
    }
  }

  // If no match, return null (user can manually select district)
  return null
}

/**
 * Resolve which sub-area applies within a district.
 * Auto-resolves unit-count conditions; named areas need manual selection.
 */
export function resolveSubArea(
  district: Hfp2666District,
  buildingInput: BuildingInput,
  manualSubAreaId?: string | null
): Hfp2666SubArea | null {
  if (!district.subAreas.length) return null

  // Manual override
  if (manualSubAreaId) {
    const manual = district.subAreas.find(s => s.id === manualSubAreaId)
    if (manual) return manual
  }

  // If only one sub-area, return it
  if (district.subAreas.length === 1) return district.subAreas[0]

  const totalUnits = buildingInput.totalExistingUnits || 0

  // Try to match unit-count conditions
  // Skip parcel_consolidation and focal_hub — these are manual-only selections
  for (const sub of district.subAreas) {
    if (!sub.condition) continue
    if (sub.condition.type === 'parcel_consolidation' || sub.condition.type === 'focal_hub') continue
    if (sub.condition.type === 'min_existing_units' && sub.condition.threshold != null) {
      if (totalUnits >= sub.condition.threshold) return sub
    }
    if (sub.condition.type === 'max_existing_units' && sub.condition.threshold != null) {
      if (totalUnits <= sub.condition.threshold) return sub
    }
  }

  // Fall back to default sub-area
  return district.subAreas.find(s => s.isDefault) || district.subAreas[0]
}

/**
 * Find inclusive housing district by neighborhood name
 */
function findInclusiveHousingDistrict(neighborhood: string | null): InclusiveHousingDistrict | null {
  if (!neighborhood) return null
  for (const district of INCLUSIVE_HOUSING_DISTRICTS) {
    for (const n of district.neighborhoods) {
      if (neighborhood.includes(n) || n.includes(neighborhood)) {
        return district
      }
    }
  }
  return null
}

/**
 * Calculate building rights under HFP/2666
 */
export function calculateHfp2666(
  buildingInput: BuildingInput,
  geoData: ParcelGeoData,
  manualDistrictId?: number | null,
  manualSubAreaId?: string | null,
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

  // Resolve sub-area within district
  const subArea = resolveSubArea(district, buildingInput, manualSubAreaId)

  // Handle strengthening-only sub-areas
  if (subArea?.condition?.type === 'strengthening_only') {
    return createStrengtheningResult(district, subArea, buildingInput, geoData)
  }

  // If no sub-area resolved, return null result with district info
  if (!subArea) {
    return createNullResult(buildingInput, geoData, district)
  }

  const plotArea = buildingInput.plotArea || geoData.plotArea
  const totalExistingUnits = buildingInput.totalExistingUnits || 0

  // Small building override: <4 units in districts 4-10 → cap at 135%
  const isSmallBuildingOverride = !HFP2666_SMALL_BUILDING.EXCLUDED_DISTRICTS.includes(district.id)
    && totalExistingUnits > 0
    && totalExistingUnits <= HFP2666_SMALL_BUILDING.MAX_UNITS

  const effectiveMultiplier = isSmallBuildingOverride
    ? Math.min(subArea.multiplier, HFP2666_SMALL_BUILDING.MULTIPLIER)
    : subArea.multiplier
  const effectiveDensity = isSmallBuildingOverride
    ? Math.min(subArea.unitsPerDunam, HFP2666_SMALL_BUILDING.MAX_DENSITY)
    : subArea.unitsPerDunam
  const effectiveMaxFloors = isSmallBuildingOverride
    ? HFP2666_SMALL_BUILDING.MAX_FLOORS_FLAT
    : subArea.maxFloors

  // Raw primary area = plot area × multiplier
  const rawPrimaryArea = Math.round(plotArea * effectiveMultiplier)

  // Cap by max floors — floor area = plot coverage (תכסית 80%) × plot area
  const maxFloorArea = plotArea * HFP2666_PARAMS.COVERAGE
  const maxByFloors = Math.round(effectiveMaxFloors * maxFloorArea)

  // Cap by density (units per dunam)
  const plotDunams = plotArea / 1000
  const maxUnits = Math.floor(plotDunams * effectiveDensity)
  const avgUnit = buildingInput.minApartmentSize || TAMA38_RULES.DEFAULT_AVG_APARTMENT
  const maxByDensity = maxUnits * avgUnit

  // Final = minimum of all caps
  const finalPrimaryArea = Math.min(rawPrimaryArea, maxByFloors, maxByDensity)

  // Units
  const potentialUnitsLow = Math.floor(finalPrimaryArea / avgUnit)
  const potentialUnitsHigh = Math.ceil(finalPrimaryArea / avgUnit)
  const existingUnitsToReturn = buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits
  const developerUnitsLow = Math.max(0, potentialUnitsLow - existingUnitsToReturn)
  const developerUnitsHigh = Math.max(0, potentialUnitsHigh - existingUnitsToReturn)

  // Service areas
  const totalUnits = potentialUnitsHigh
  const totalMamad = totalUnits * TAMA38_RULES.MAMAD_PER_UNIT
  const totalBalcony = totalUnits * HFP2666_PARAMS.BALCONY_PER_UNIT

  // Economic split
  const returnedPrimary = calculateReturnedPrimary(buildingInput)
  const returnedMamad = calculateReturnedMamad(buildingInput)
  const returnedService = returnedMamad // Service returned = MAMAD only
  const developerPrimary = finalPrimaryArea - returnedPrimary
  const developerService = (totalMamad + totalBalcony) - returnedService

  // Paledelet
  const totalPaledelet = finalPrimaryArea + totalMamad
  const returnedPaledelToTenants = returnedPrimary + returnedMamad
  const developerPaledelet = totalPaledelet - returnedPaledelToTenants

  // Inclusive Housing
  const inclusiveDistrict = findInclusiveHousingDistrict(geoData.neighborhood)
  const inclusiveHousingApplies = inclusiveDistrict !== null
  const inclusiveHousingRate = inclusiveDistrict?.rate ?? 0
  const inclusiveHousingUnits = inclusiveHousingApplies
    ? Math.ceil(developerUnitsHigh * inclusiveHousingRate)
    : 0
  const developerMarketableUnits = developerUnitsHigh - inclusiveHousingUnits

  return {
    district,
    subArea,
    districtDataAvailable: true,
    isStrengtheningOnly: false,
    strengthenAddition: null,
    isBuildingH: false,
    isSmallBuildingOverride,
    existingGrossArea: null,
    commercialBonus: subArea.commercialBonus,
    plotArea,
    multiplier: effectiveMultiplier,
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
    returnedMamadToTenants: returnedMamad,
    returnedServiceToTenants: returnedService,
    developerPrimary,
    developerService,
    totalPaledelet,
    returnedPaledelToTenants,
    developerPaledelet,
    inclusiveHousingApplies,
    inclusiveHousingRate,
    inclusiveHousingUnits,
    developerMarketableUnits,
  }
}

/**
 * Calculate building rights for Building H (מבני H) — Citywide ×3 existing gross
 * From חפ/2666 Table 5, last row + section 1.9:
 * - Total rights = existing gross area × 3
 * - Max 12 floors (flat) / 10 floors (descending)
 * - No density cap — only capped by ×3 gross and floor limit
 */
export function calculateBuildingH(
  buildingInput: BuildingInput,
  geoData: ParcelGeoData,
): Hfp2666Result {
  const plotArea = buildingInput.plotArea || geoData.plotArea
  const existingGrossArea = buildingInput.existingContour * buildingInput.existingFloors
  const totalRights = existingGrossArea * HFP2666_BUILDING_H.MULTIPLIER

  // Cap by max floors (default flat)
  const maxFloors = HFP2666_BUILDING_H.MAX_FLOORS_FLAT
  const maxFloorArea = plotArea * HFP2666_PARAMS.COVERAGE
  const maxByFloors = Math.round(maxFloors * maxFloorArea)

  const finalPrimaryArea = Math.min(totalRights, maxByFloors)

  // Units
  const avgUnit = buildingInput.minApartmentSize || TAMA38_RULES.DEFAULT_AVG_APARTMENT
  const potentialUnitsLow = Math.floor(finalPrimaryArea / avgUnit)
  const potentialUnitsHigh = Math.ceil(finalPrimaryArea / avgUnit)
  const existingUnitsToReturn = buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits
  const developerUnitsLow = Math.max(0, potentialUnitsLow - existingUnitsToReturn)
  const developerUnitsHigh = Math.max(0, potentialUnitsHigh - existingUnitsToReturn)

  // Service areas
  const totalUnits = potentialUnitsHigh
  const totalMamad = totalUnits * TAMA38_RULES.MAMAD_PER_UNIT
  const totalBalcony = totalUnits * HFP2666_PARAMS.BALCONY_PER_UNIT

  // Economic split
  const returnedPrimary = calculateReturnedPrimary(buildingInput)
  const returnedMamad = calculateReturnedMamad(buildingInput)
  const returnedService = returnedMamad
  const developerPrimary = finalPrimaryArea - returnedPrimary
  const developerService = (totalMamad + totalBalcony) - returnedService

  // Paledelet
  const totalPaledelet = finalPrimaryArea + totalMamad
  const returnedPaledelToTenants = returnedPrimary + returnedMamad
  const developerPaledelet = totalPaledelet - returnedPaledelToTenants

  // Inclusive Housing
  const inclusiveDistrict = findInclusiveHousingDistrict(geoData.neighborhood)
  const inclusiveHousingApplies = inclusiveDistrict !== null
  const inclusiveHousingRate = inclusiveDistrict?.rate ?? 0
  const inclusiveHousingUnits = inclusiveHousingApplies
    ? Math.ceil(developerUnitsHigh * inclusiveHousingRate)
    : 0
  const developerMarketableUnits = developerUnitsHigh - inclusiveHousingUnits

  return {
    district: null,
    subArea: null,
    districtDataAvailable: true,
    isStrengtheningOnly: false,
    strengthenAddition: null,
    isBuildingH: true,
    isSmallBuildingOverride: false,
    existingGrossArea,
    commercialBonus: 0,
    plotArea,
    multiplier: HFP2666_BUILDING_H.MULTIPLIER,
    rawPrimaryArea: totalRights,
    maxByFloors,
    maxByDensity: null,
    finalPrimaryArea,
    potentialUnitsLow,
    potentialUnitsHigh,
    existingUnitsToReturn,
    developerUnitsLow,
    developerUnitsHigh,
    totalMamad,
    totalBalcony,
    returnedPrimaryToTenants: returnedPrimary,
    returnedMamadToTenants: returnedMamad,
    returnedServiceToTenants: returnedService,
    developerPrimary,
    developerService,
    totalPaledelet,
    returnedPaledelToTenants,
    developerPaledelet,
    inclusiveHousingApplies,
    inclusiveHousingRate,
    inclusiveHousingUnits,
    developerMarketableUnits,
  }
}

// ----- Helper functions -----

function calculateReturnedPrimary(buildingInput: BuildingInput): number {
  const avgExistingUnit = buildingInput.existingContour / (buildingInput.existingUnitsPerFloor || 1)
  const returnPerTenant = avgExistingUnit + buildingInput.primaryReturnPerUnit
  const rightsHolders = buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits
  return Math.round(returnPerTenant * rightsHolders)
}

function calculateReturnedMamad(buildingInput: BuildingInput): number {
  const rightsHolders = buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits
  return buildingInput.mamadReturnPerUnit * rightsHolders
}

/** Result for strengthening-only sub-areas (חיזוק בלבד — 25 sqm per unit) */
function createStrengtheningResult(
  district: Hfp2666District,
  subArea: Hfp2666SubArea,
  buildingInput: BuildingInput,
  geoData: ParcelGeoData,
): Hfp2666Result {
  const existingUnits = buildingInput.totalExistingUnits || 0
  const strengthenAddition = existingUnits * HFP2666_STRENGTHENING_ADDITION
  const returnedPrimary = calculateReturnedPrimary(buildingInput)
  const returnedMamad = calculateReturnedMamad(buildingInput)

  return {
    district,
    subArea,
    districtDataAvailable: true,
    isStrengtheningOnly: true,
    strengthenAddition,
    isBuildingH: false,
    isSmallBuildingOverride: false,
    existingGrossArea: null,
    commercialBonus: 0,
    plotArea: buildingInput.plotArea || geoData.plotArea,
    multiplier: null,
    rawPrimaryArea: null,
    maxByFloors: null,
    maxByDensity: null,
    finalPrimaryArea: null,
    potentialUnitsLow: null,
    potentialUnitsHigh: null,
    existingUnitsToReturn: buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits,
    developerUnitsLow: null,
    developerUnitsHigh: null,
    totalMamad: null,
    totalBalcony: null,
    returnedPrimaryToTenants: returnedPrimary,
    returnedMamadToTenants: returnedMamad,
    returnedServiceToTenants: returnedMamad,
    developerPrimary: null,
    developerService: null,
    totalPaledelet: null,
    returnedPaledelToTenants: returnedPrimary + returnedMamad,
    developerPaledelet: null,
    inclusiveHousingApplies: false,
    inclusiveHousingRate: 0,
    inclusiveHousingUnits: 0,
    developerMarketableUnits: null,
  }
}

function createNullResult(
  buildingInput: BuildingInput,
  geoData: ParcelGeoData,
  district?: Hfp2666District | null,
): Hfp2666Result {
  const returnedPrimary = calculateReturnedPrimary(buildingInput)
  const returnedMamad = calculateReturnedMamad(buildingInput)
  return {
    district: district || null,
    subArea: null,
    districtDataAvailable: false,
    isStrengtheningOnly: false,
    strengthenAddition: null,
    isBuildingH: false,
    isSmallBuildingOverride: false,
    existingGrossArea: null,
    commercialBonus: 0,
    plotArea: geoData.plotArea,
    multiplier: null,
    rawPrimaryArea: null,
    maxByFloors: null,
    maxByDensity: null,
    finalPrimaryArea: null,
    potentialUnitsLow: null,
    potentialUnitsHigh: null,
    existingUnitsToReturn: buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits,
    developerUnitsLow: null,
    developerUnitsHigh: null,
    totalMamad: null,
    totalBalcony: null,
    returnedPrimaryToTenants: returnedPrimary,
    returnedMamadToTenants: returnedMamad,
    returnedServiceToTenants: returnedMamad,
    developerPrimary: null,
    developerService: null,
    totalPaledelet: null,
    returnedPaledelToTenants: returnedPrimary + returnedMamad,
    developerPaledelet: null,
    inclusiveHousingApplies: false,
    inclusiveHousingRate: 0,
    inclusiveHousingUnits: 0,
    developerMarketableUnits: null,
  }
}
