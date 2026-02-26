// ============================================================
// Shaked / Amendment 139 Calculator (חלופת שקד - תיקון 139)
// Enhanced version of TAMA 38 with higher multipliers
// ============================================================

import type { BuildingInput, ParcelGeoData, ShakedResult } from './types'
import { calculateTama38 } from './tama38'
import { SHAKED_RULES, TAMA38_RULES } from '../data/rules'

/**
 * Calculate building rights under Shaked/Amendment 139
 * Same base as TAMA 38 but with:
 * - Up to 400% multiplier for demolition-rebuild
 * - Up to 200% for strengthening
 * - 25% betterment levy deducted
 *
 * estimatedValuePerSqm: optional user-provided land value estimate (₪/m²)
 * If not provided, betterment levy estimate will be null.
 */
export function calculateShaked(
  buildingInput: BuildingInput,
  geoData: ParcelGeoData,
  estimatedValuePerSqm?: number
): ShakedResult {
  // Start with base TAMA 38 calculation
  const tama38 = calculateTama38(buildingInput, geoData)

  // Calculate the Shaked enhanced multiplier
  const existingBuildingArea = buildingInput.existingContour * buildingInput.existingFloors
  const shakedMultiplier = SHAKED_RULES.MAX_DEMOLISH_REBUILD // 400%
  const shakedMaxArea = existingBuildingArea * shakedMultiplier

  // The Shaked total is the MAX of:
  // 1. The TAMA 38 calculated total (standard)
  // 2. The Shaked enhanced ceiling (400% of existing building)
  const shakedPrimaryArea = Math.max(tama38.totalPrimaryArea, Math.round(shakedMaxArea))

  // ========================================
  // Recalculate units from Shaked's larger area
  // ========================================
  const avgSize = buildingInput.minApartmentSize || TAMA38_RULES.DEFAULT_AVG_APARTMENT

  // Area-based derivation
  const areaBasedLow = Math.floor(shakedPrimaryArea / avgSize)
  const areaBasedHigh = Math.ceil(shakedPrimaryArea / avgSize)

  // Density-based derivation (same logic as TAMA 38 — Test 2)
  const plotArea = buildingInput.plotArea || geoData.plotArea
  const densityPerDunam = buildingInput.densityPerDunam
  let densityBasedUnits: number | undefined
  if (densityPerDunam && densityPerDunam > 0 && plotArea > 0) {
    densityBasedUnits = Math.floor((plotArea / 1000) * densityPerDunam)
  }

  const shakedUnitsLow = densityBasedUnits !== undefined
    ? Math.max(areaBasedLow, densityBasedUnits)
    : areaBasedLow
  const shakedUnitsHigh = densityBasedUnits !== undefined
    ? Math.max(areaBasedHigh, densityBasedUnits)
    : areaBasedHigh

  // Rights holders for return (Test 3)
  const rightsHolders = buildingInput.totalRightsHolders ?? buildingInput.totalExistingUnits
  const shakedDevUnitsLow = shakedUnitsLow - rightsHolders
  const shakedDevUnitsHigh = shakedUnitsHigh - rightsHolders

  // Recalculate service areas based on Shaked unit count
  const shakedTotalUnitsForCalc = shakedUnitsHigh
  const shakedTotalMamad = shakedTotalUnitsForCalc * TAMA38_RULES.MAMAD_PER_UNIT
  const shakedTotalBalcony = shakedTotalUnitsForCalc * TAMA38_RULES.BALCONY_PER_UNIT

  // Recalculate developer split
  const shakedDeveloperPrimary = shakedPrimaryArea - tama38.returnedPrimaryToTenants
  const shakedTotalService = shakedTotalMamad + shakedTotalBalcony
  const shakedDeveloperService = shakedTotalService - tama38.returnedServiceToTenants

  // Paledelet (Test 3)
  const shakedTotalPaledelet = shakedPrimaryArea + shakedTotalMamad
  const shakedReturnedPaledelToTenants = tama38.returnedPaledelToTenants
  const shakedDeveloperPaledelet = shakedTotalPaledelet - shakedReturnedPaledelToTenants

  // MAMAD Cap (Test 4.2)
  const mamadSize = buildingInput.mamadSize ?? TAMA38_RULES.MAMAD_PER_UNIT
  const mamadExcessPerUnit = Math.max(0, mamadSize - TAMA38_RULES.MAMAD_MAX_NET)
  const mamadExcessDeduction = mamadExcessPerUnit * Math.max(0, shakedDevUnitsHigh)
  const mamadCapWarning = mamadExcessPerUnit > 0
  const adjustedDeveloperPrimary = shakedDeveloperPrimary - mamadExcessDeduction

  // Betterment levy calculation
  const bettermentLevyRate = SHAKED_RULES.BETTERMENT_LEVY_RATE
  const additionalArea = shakedPrimaryArea - tama38.tbeTotal

  let bettermentLevyAmount: number | null = null
  if (estimatedValuePerSqm && estimatedValuePerSqm > 0) {
    bettermentLevyAmount = Math.round(additionalArea * estimatedValuePerSqm * bettermentLevyRate)
  }

  // Comparison vs base TAMA 38
  const areaDifference = shakedPrimaryArea - tama38.totalPrimaryArea
  const unitsDifference = shakedUnitsLow - tama38.potentialUnitsLow

  return {
    ...tama38,

    // Override with Shaked-recalculated values
    totalPrimaryArea: shakedPrimaryArea,
    potentialUnitsLow: shakedUnitsLow,
    potentialUnitsHigh: shakedUnitsHigh,
    developerUnitsLow: shakedDevUnitsLow,
    developerUnitsHigh: shakedDevUnitsHigh,
    totalUnitsForCalc: shakedTotalUnitsForCalc,
    totalMamad: shakedTotalMamad,
    totalBalcony: shakedTotalBalcony,
    developerPrimary: adjustedDeveloperPrimary,
    developerService: shakedDeveloperService,
    totalPrimaryProject: shakedPrimaryArea,
    totalServiceProject: shakedTotalService,

    // Paledelet overrides
    totalPaledelet: shakedTotalPaledelet,
    returnedPaledelToTenants: shakedReturnedPaledelToTenants,
    developerPaledelet: shakedDeveloperPaledelet,

    // MAMAD Cap overrides
    mamadExcessPerUnit,
    mamadExcessDeduction,
    mamadCapWarning,

    // Inclusive housing inherited from tama38 (same neighborhood check)

    // Shaked-specific fields
    shakedMultiplier,
    bettermentLevyRate,
    bettermentLevyAmount,
    comparisonVsTama: {
      areaDifference,
      unitsDifference,
    },
  }
}
