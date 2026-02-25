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
  // In practice, Shaked usually provides MORE rights than standard TAMA
  const shakedPrimaryArea = Math.max(tama38.totalPrimaryArea, Math.round(shakedMaxArea))

  // ========================================
  // Fix: Recalculate units from Shaked's larger area
  // (Instead of inheriting TAMA 38's lower unit count)
  // ========================================
  const avgSize = buildingInput.minApartmentSize || TAMA38_RULES.DEFAULT_AVG_APARTMENT
  const shakedUnitsLow = Math.floor(shakedPrimaryArea / avgSize)
  const shakedUnitsHigh = Math.ceil(shakedPrimaryArea / avgSize)
  const shakedDevUnitsLow = shakedUnitsLow - buildingInput.totalExistingUnits
  const shakedDevUnitsHigh = shakedUnitsHigh - buildingInput.totalExistingUnits

  // Recalculate service areas based on Shaked unit count
  const shakedTotalUnitsForCalc = shakedUnitsHigh
  const shakedTotalMamad = shakedTotalUnitsForCalc * TAMA38_RULES.MAMAD_PER_UNIT
  const shakedTotalBalcony = shakedTotalUnitsForCalc * TAMA38_RULES.BALCONY_PER_UNIT

  // Recalculate developer split
  const shakedDeveloperPrimary = shakedPrimaryArea - tama38.returnedPrimaryToTenants
  const shakedTotalService = shakedTotalMamad + shakedTotalBalcony
  const shakedDeveloperService = shakedTotalService - tama38.returnedServiceToTenants

  // Betterment levy calculation
  const bettermentLevyRate = SHAKED_RULES.BETTERMENT_LEVY_RATE
  const additionalArea = shakedPrimaryArea - tama38.tbeTotal // Area above base TBE rights

  // Betterment levy estimate: only calculated if user provides a value per m²
  // Without a real market valuation, displaying an estimate would be misleading
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
    developerPrimary: shakedDeveloperPrimary,
    developerService: shakedDeveloperService,
    totalPrimaryProject: shakedPrimaryArea,
    totalServiceProject: shakedTotalService,

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
