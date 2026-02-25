// ============================================================
// TAMA 38 Calculator (מסלול הריסה ובנייה מחדש)
// Based on חפ/מד/2500 - מדיניות 2020
// ============================================================

import type { BuildingInput, ParcelGeoData, Tama38Result } from './types'
import { TAMA38_RULES } from '../data/rules'

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
    returnPerUnit,
  } = buildingInput

  const plotArea = buildingInput.plotArea || geoData.plotArea
  const plotAreaForCalc = plotArea // After deducting הפקעות if any

  // ========================================
  // Section 1: TAMA Policy Areas
  // חישוב שטחים בגין מדיניות הריסה ובנייה
  // ========================================

  // קומה טיפוסית מורחבת = קונטור + (13 × דירות בקומה)
  const expandedFloorPerUnit = TAMA38_RULES.EXPANSION_PER_UNIT
  const expandedTypicalFloor = existingContour + (expandedFloorPerUnit * existingUnitsPerFloor)

  // סה"כ קומה טיפוסית מורחבת × קומות מוצעות
  const expandedTotal = expandedTypicalFloor * additionalFloors

  // תוספת עבור דירות קיימות (13 × סה"כ דירות)
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
  // מקור: חפ/מד/2500 מדיניות 2020, סעיף 4.11
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
  const potentialUnitsLow = Math.floor(totalPrimaryArea / avgSize)
  const potentialUnitsHigh = Math.ceil(totalPrimaryArea / avgSize)
  const existingUnitsToReturn = totalExistingUnits
  const developerUnitsLow = potentialUnitsLow - existingUnitsToReturn
  const developerUnitsHigh = potentialUnitsHigh - existingUnitsToReturn

  // ========================================
  // Section 5: Service Areas
  // סיכום חישוב שטחים
  // ========================================
  const totalUnitsForCalc = potentialUnitsHigh
  const numberOfFloors = `עד${Math.ceil(totalUnitsForCalc / existingUnitsPerFloor || 2)}קומות`
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
  const returnedPrimaryPerTenant = avgExistingUnitSize + returnPerUnit
  const returnedPrimaryToTenants = Math.round(returnedPrimaryPerTenant * existingUnitsToReturn)

  // שטח פלדלת מוחזר לדיירים
  const returnedServicePerTenant = mamadPerUnit + balconyPerUnit
  const returnedServiceToTenants = returnedServicePerTenant * existingUnitsToReturn

  // שטח נותר ליזם
  const developerPrimary = totalPrimaryArea - returnedPrimaryToTenants
  const totalServiceArea = totalMamad + totalBalcony
  const developerService = totalServiceArea - returnedServiceToTenants

  // שטחים כוללים לפרויקט
  const totalPrimaryProject = totalPrimaryArea
  const totalServiceProject = totalServiceArea

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
    returnedServiceToTenants,
    developerPrimary,
    developerService,
    totalPrimaryProject,
    totalServiceProject,

    // Building info
    buildingInfo: {
      plotArea,
      buildingPercentage,
      density,
      unitsPerDunam,
    },
  }
}
