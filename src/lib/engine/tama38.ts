// ============================================================
// TAMA 38 Calculator (מסלול הריסה ובנייה מחדש)
// Based on חפ/מד/2500 - מדיניות 2020
// ============================================================

import type { BuildingInput, ParcelGeoData, Tama38Result } from './types'
import { TAMA38_RULES, INCLUSIVE_HOUSING_DISTRICTS } from '../data/rules'
import type { InclusiveHousingDistrict } from '../data/rules'

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
 * Calculate building rights under TAMA 38 demolition-rebuild track
 * Algorithm matches the exact output format from the image template
 */
export function calculateTama38(
  buildingInput: BuildingInput,
  geoData: ParcelGeoData
): Tama38Result {
  const {
    existingContour,
    existingFloors,
    existingUnitsPerFloor,
    totalExistingUnits,
    additionalFloors,
    pilotisArea,
    buildingPercentage,
    minApartmentSize,
    primaryReturnPerUnit,
    mamadReturnPerUnit,
  } = buildingInput

  const plotArea = buildingInput.plotArea || geoData.plotArea
  const plotAreaForCalc = plotArea // After deducting הפקעות if any

  // Rights holders: separate from expansion units (Test 3)
  const rightsHolders = buildingInput.totalRightsHolders ?? totalExistingUnits

  // ========================================
  // Section 1: TAMA Policy Areas
  // חישוב שטחים בגין מדיניות הריסה ובנייה
  // ========================================

  // קומה טיפוסית מורחבת = קונטור + (13 × דירות בקומה)
  const expandedFloorPerUnit = TAMA38_RULES.EXPANSION_PER_UNIT
  const expandedTypicalFloor = existingContour + (expandedFloorPerUnit * existingUnitsPerFloor)

  // סה"כ קומה טיפוסית מורחבת × קומות מוצעות
  const expandedTotal = expandedTypicalFloor * additionalFloors

  // תוספת עבור דירות קיימות (13 × סה"כ דירות) — uses totalExistingUnits, NOT rightsHolders
  const existingUnitBonus = totalExistingUnits * TAMA38_RULES.EXPANSION_PER_UNIT

  // תוספת שטחים בגין קומת עמודים מפולשת
  const pilotis = pilotisArea

  // סה"כ שטחים בגין מדיניות
  const tamaPolicyTotal = expandedTotal + existingUnitBonus + pilotis

  // ========================================
  // Section 2: TBE Base Rights
  // חישוב שטחים בגין ת.ב.ע
  // ========================================

  // שטח בסיס = שטח מגרש × אחוזי בנייה
  const tbeBaseArea = Math.round(plotAreaForCalc * buildingPercentage)

  // הקלה 6% — תוספת 6% על שטח המגרש (לא על שטח הבסיס)
  const reliefPercentage = TAMA38_RULES.SHEVES_RELIEF
  const tbeRelief = Math.round(plotAreaForCalc * reliefPercentage)

  // בניין תוספת קומה (if applicable from TBE) - usually 0 or ---
  const tbeBonusFloors = 0

  // סה"כ שטח עיקרי ת.ב.ע
  const tbeTotal = tbeBaseArea + tbeRelief + tbeBonusFloors

  // ========================================
  // Section 3: Combined Total
  // סה"כ שטח עיקרי ת.מ.א + ת.ב.ע
  // ========================================
  const totalPrimaryArea = tamaPolicyTotal + tbeTotal

  // ========================================
  // Section 4: Unit Derivation
  // גזירת מספר יחידות דיור
  // ========================================
  const avgSize = minApartmentSize || TAMA38_RULES.DEFAULT_AVG_APARTMENT

  // Method A: Area-based derivation
  const areaBasedUnitsLow = Math.floor(totalPrimaryArea / avgSize)
  const areaBasedUnitsHigh = Math.ceil(totalPrimaryArea / avgSize)

  // Method B: Density-based derivation (if densityPerDunam provided)
  const densityPerDunam = buildingInput.densityPerDunam
  let densityBasedUnits: number | undefined
  if (densityPerDunam && densityPerDunam > 0 && plotArea > 0) {
    densityBasedUnits = Math.floor((plotArea / 1000) * densityPerDunam)
  }

  // Final: take MAX of both methods (Test 2)
  const potentialUnitsHigh = densityBasedUnits !== undefined
    ? Math.max(areaBasedUnitsHigh, densityBasedUnits)
    : areaBasedUnitsHigh
  const potentialUnitsLow = densityBasedUnits !== undefined
    ? Math.max(areaBasedUnitsLow, densityBasedUnits)
    : areaBasedUnitsLow

  const existingUnitsToReturn = rightsHolders
  const developerUnitsLow = potentialUnitsLow - existingUnitsToReturn
  const developerUnitsHigh = potentialUnitsHigh - existingUnitsToReturn

  // ========================================
  // Section 5: Service Areas
  // סיכום חישוב שטחים
  // ========================================
  const totalUnitsForCalc = potentialUnitsHigh
  const numberOfFloors = `עד ${Math.ceil(totalUnitsForCalc / (existingUnitsPerFloor || 2))} קומות`
  const maxUnitsPerFloor = Math.min(totalUnitsForCalc, 15)

  // ממ"ד = 12 מ"ר × מספר דירות
  const mamadPerUnit = TAMA38_RULES.MAMAD_PER_UNIT
  const totalMamad = totalUnitsForCalc * mamadPerUnit

  // מרפסת זיזית = 12 מ"ר × מספר דירות
  const balconyPerUnit = TAMA38_RULES.BALCONY_PER_UNIT
  const totalBalcony = totalUnitsForCalc * balconyPerUnit

  // ========================================
  // Section 6: Summary (סיכום)
  // Economic Split - Developer vs Tenants
  // ========================================

  // שטח עיקרי מוחזר לדיירים
  const avgExistingUnitSize = existingContour / (existingUnitsPerFloor || 1)
  const returnedPrimaryPerTenant = avgExistingUnitSize + primaryReturnPerUnit
  const returnedPrimaryToTenants = Math.round(returnedPrimaryPerTenant * existingUnitsToReturn)

  // ממ"ד מוחזר לדיירים (MAMAD only, separate from balcony — Test 3)
  const returnedMamadToTenants = mamadReturnPerUnit * existingUnitsToReturn

  // Legacy: service returned = MAMAD only for tenants
  const returnedServiceToTenants = returnedMamadToTenants

  // שטח נותר ליזם
  const developerPrimary = totalPrimaryArea - returnedPrimaryToTenants
  const totalServiceArea = totalMamad + totalBalcony
  const developerService = totalServiceArea - returnedServiceToTenants

  // שטחים כוללים לפרויקט
  const totalPrimaryProject = totalPrimaryArea
  const totalServiceProject = totalServiceArea

  // ========================================
  // Section 6b: Paledelet (פלדלת)
  // פלדלת = שטח עיקרי + ממ"ד (ללא מרפסת)
  // ========================================
  const totalPaledelet = totalPrimaryArea + totalMamad
  const returnedPaledelToTenants = returnedPrimaryToTenants + returnedMamadToTenants
  const developerPaledelet = totalPaledelet - returnedPaledelToTenants

  // ========================================
  // Section 7: MAMAD Cap (תקרת ממ"ד - תקנה 2025)
  // ========================================
  const mamadSize = buildingInput.mamadSize ?? TAMA38_RULES.MAMAD_PER_UNIT
  const mamadExcessPerUnit = Math.max(0, mamadSize - TAMA38_RULES.MAMAD_MAX_NET)
  const mamadExcessDeduction = mamadExcessPerUnit * Math.max(0, developerUnitsHigh)
  const mamadCapWarning = mamadExcessPerUnit > 0

  // Adjust developer primary for MAMAD excess
  const adjustedDeveloperPrimary = developerPrimary - mamadExcessDeduction

  // ========================================
  // Section 8: Inclusive Housing (דיור מכליל)
  // ========================================
  const inclusiveDistrict = findInclusiveHousingDistrict(geoData.neighborhood)
  const inclusiveHousingApplies = inclusiveDistrict !== null
  const inclusiveHousingRate = inclusiveDistrict?.rate ?? 0
  const inclusiveHousingUnits = inclusiveHousingApplies
    ? Math.ceil(developerUnitsHigh * inclusiveHousingRate)
    : 0
  const inclusiveHousingArea = inclusiveHousingUnits * (inclusiveDistrict?.maxUnitSize ?? 55)
  const developerMarketableUnits = developerUnitsHigh - inclusiveHousingUnits

  // ========================================
  // Building info for display
  // ========================================
  const density = (totalUnitsForCalc / (plotArea / 1000)) // units per dunam
  const unitsPerDunam = Math.round(density * 10) / 10

  return {
    // Section 1
    existingContour,
    existingFloors,
    additionalFloors,
    existingUnitsPerFloor,
    totalExistingUnits,
    expandedFloorPerUnit,
    expandedTypicalFloor,
    expandedTotal: Math.round(expandedTotal),
    existingUnitBonus,
    pilotisArea: pilotis,
    tamaPolicyTotal: Math.round(tamaPolicyTotal),

    // Section 2
    plotArea,
    plotAreaForCalc,
    buildingPercentage,
    tbeBaseArea,
    reliefPercentage,
    tbeRelief,
    tbeBonusFloors,
    tbeTotal,

    // Section 3
    totalPrimaryArea,

    // Section 4
    minApartmentSize: avgSize,
    areaBasedUnitsLow,
    areaBasedUnitsHigh,
    densityBasedUnits,
    potentialUnitsLow,
    potentialUnitsHigh,
    existingUnitsToReturn,
    developerUnitsLow,
    developerUnitsHigh,

    // Section 5
    totalUnitsForCalc,
    numberOfFloors,
    maxUnitsPerFloor,
    mamadPerUnit,
    totalMamad,
    balconyPerUnit,
    totalBalcony,

    // Section 6
    returnedPrimaryToTenants,
    returnedMamadToTenants,
    returnedServiceToTenants,
    developerPrimary: adjustedDeveloperPrimary,
    developerService,
    totalPrimaryProject,
    totalServiceProject,

    // Section 6b: Paledelet
    totalPaledelet,
    returnedPaledelToTenants,
    developerPaledelet,

    // Section 7: MAMAD Cap
    mamadExcessPerUnit,
    mamadExcessDeduction,
    mamadCapWarning,

    // Section 8: Inclusive Housing
    inclusiveHousingApplies,
    inclusiveHousingRate,
    inclusiveHousingUnits,
    inclusiveHousingArea,
    developerMarketableUnits,

    // Building info
    buildingInfo: {
      plotArea,
      buildingPercentage,
      density,
      unitsPerDunam,
    },
  }
}
