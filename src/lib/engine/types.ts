// ============================================================
// Core Types for Haifa Building Rights Calculator
// ============================================================

/** Parcel identification */
export interface ParcelId {
  gush: number
  helka: number
}

/** GeoJSON feature representing a parcel */
export interface ParcelFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  properties: {
    GUSH_NUM?: number
    PARCEL?: number
    SHAPE_Area?: number
    [key: string]: unknown
  }
}

/** Data auto-fetched from GIS layers */
export interface ParcelGeoData {
  parcelId: ParcelId
  plotArea: number // m² from GovMap
  neighborhood: string | null
  quarter: string | null
  subQuarter: string | null
  zoningType: string | null // ייעוד קרקע
  isConservationBuilding: boolean
  isInPreservationArea: boolean
  isArchaeologicalSite: boolean
  isUnescoCore: boolean
  isUnescoBuffer: boolean
  streetName: string | null
  polygon: ParcelFeature | null
}

/** User-provided building data */
export interface BuildingInput {
  existingContour: number // m² קונטור קומה קיימת
  existingFloors: number // מספר קומות קיימות
  existingUnitsPerFloor: number // דירות בקומה טיפוסית
  totalExistingUnits: number // סה"כ דירות קיימות (לחישוב הרחבה)
  totalRightsHolders?: number // סה"כ בעלי זכויות כולל קומת קרקע (לחישוב החזרה) - defaults to totalExistingUnits
  existingUnitsInBuilding: number // מס. דירות קיימות בקומה טיפוסית
  pilotisArea: number // שטח עמודים מפולשת (m²)
  buildingType: 'multi_family' | 'single_family' | 'duplex'
  hasExistingTama38: boolean // האם מומש תמ"א 38
  minApartmentSize: number // שטח דירה מינימלי (default 85)
  buildingPercentage: number // אחוזי בנייה (default 0.60)
  additionalFloors: number // קומות מוצעות
  primaryReturnPerUnit: number // תוספת שטח עיקרי לדירה מוחזרת (default 13 - TAMA expansion only)
  mamadReturnPerUnit: number // ממ"ד לדירה מוחזרת (default 12)
  estimatedValuePerSqm?: number // שווי מוערך למ"ר (₪) - optional, for Shaked levy calc
  plotArea: number // שטח מגרש (מ"ר) - auto-filled from GIS, editable by user
  densityPerDunam?: number // צפיפות יח"ד לדונם - auto-filled from HFP/2666 district
  mamadSize?: number // שטח ממ"ד בפועל (מ"ר) - default 12, if > 12 triggers auto-deduction
  isBuildingH?: boolean // מבני H — H-shaped building, uses ×3 existing gross citywide
}

/** Exclusion filter result */
export type FilterStatus = 'CLEAR' | 'BLOCKED' | 'LIMITED' | 'REDIRECTED'

export interface FilterResult {
  status: FilterStatus
  reason: string
  details: string
  allowTama38: boolean
  allowShaked: boolean
  allowHfp2666: boolean
  maxAddition?: number // If LIMITED, max m² addition
  redirectPlan?: string // If REDIRECTED, name of master plan
}

/** TAMA 38 Calculation Result */
export interface Tama38Result {
  // Section 1: TAMA Policy Areas (חישוב שטחים בגין מדיניות הריסה ובנייה)
  existingContour: number // קונטור קומה קיימת
  existingFloors: number // מספר קומות קיימות
  additionalFloors: number // מספר קומות מוצעות
  existingUnitsPerFloor: number // מס. דירות קיימות בקומה טיפוסית
  totalExistingUnits: number // סה"כ דירות קיימות
  expandedFloorPerUnit: number // 13 מ"ר לכל דירה
  expandedTypicalFloor: number // קומה טיפוסית מורחבת
  expandedTotal: number // סה"כ קומה טיפוסית מורחבת כמנין קומות מוצעות
  existingUnitBonus: number // תוספת עבור דירות קיימות (13 × units)
  pilotisArea: number // תוספת שטחים בגין קומת עמודים מפולשת
  tamaPolicyTotal: number // סה"כ שטחים בגין מדיניות

  // Section 2: TBE Base Rights (חישוב שטחים בגין ת.ב.ע)
  plotArea: number // שטח מגרש
  plotAreaForCalc: number // שטח מגרש לצורכי חישוב (after הפקעה)
  buildingPercentage: number // אחוזי בנייה
  tbeBaseArea: number // שטח בסיס ת.ב.ע
  reliefPercentage: number // אחוז הקלה
  tbeRelief: number // הקלה
  tbeBonusFloors: number // בניין תוספת קומה
  tbeTotal: number // סה"כ שטח עיקרי ת.ב.ע

  // Section 3: Combined
  totalPrimaryArea: number // סה"כ שטח עיקרי ת.מ.א + ת.ב.ע

  // Section 4: Unit Derivation
  minApartmentSize: number // שטח דירה מינימלי
  areaBasedUnitsLow: number // יח"ד מחישוב שטח (floor)
  areaBasedUnitsHigh: number // יח"ד מחישוב שטח (ceil)
  densityBasedUnits?: number // יח"ד מחישוב צפיפות לדונם
  potentialUnitsLow: number // סה"כ מס. דירות עפ"י מדיניות (low) = max(area, density)
  potentialUnitsHigh: number // סה"כ מס. דירות עפ"י מדיניות (high) = max(area, density)
  existingUnitsToReturn: number // בעלי זכויות להחזרה
  developerUnitsLow: number // דירות מוצעות (low)
  developerUnitsHigh: number // דירות מוצעות (high)

  // Section 5: Service Areas (סיכום חישוב שטחים)
  totalUnitsForCalc: number // Total units used for service calc
  numberOfFloors: string // מספר קומות
  maxUnitsPerFloor: number // מס. יחידות דיור עד 15 יח"ד
  mamadPerUnit: number // 12 m²
  totalMamad: number // תוספת ממ"ד
  balconyPerUnit: number // 12 m²
  totalBalcony: number // תוספת מרפסת זיזית

  // Section 6: Summary (סיכום)
  returnedPrimaryToTenants: number // סה"כ החזרת שטח עיקרי לדיירים
  returnedMamadToTenants: number // ממ"ד מוחזר לדיירים = MAMAD × rightsHolders
  returnedServiceToTenants: number // סה"כ שירות מוחזר (ממ"ד בלבד, ללא מרפסת)
  developerPrimary: number // סה"כ שטח עיקרי נותר ליזם
  developerService: number // סה"כ שטח שירות נותר ליזם
  totalPrimaryProject: number // סה"כ שטח עיקרי לפרויקט
  totalServiceProject: number // סה"כ שטח שירות לפרויקט

  // Section 6b: Paledelet (פלדלת = שטח עיקרי + ממ"ד, ללא מרפסת)
  totalPaledelet: number // סה"כ פלדלת = totalPrimaryArea + totalMamad
  returnedPaledelToTenants: number // פלדלת מוחזרת = returnedPrimary + returnedMamad
  developerPaledelet: number // פלדלת יזם = totalPaledelet - returnedPaledelet

  // Section 7: MAMAD Cap (תקרת ממ"ד - תקנה 2025)
  mamadExcessPerUnit: number // עודף ממ"ד ליחידה (mamadSize - 12, min 0)
  mamadExcessDeduction: number // ניכוי כולל מהשטח העיקרי
  mamadCapWarning: boolean // true if mamadSize > 12

  // Section 8: Inclusive Housing (דיור מכליל - חפ/מד/2699)
  inclusiveHousingApplies: boolean
  inclusiveHousingRate: number
  inclusiveHousingUnits: number // ceil(developerUnitsHigh × rate)
  inclusiveHousingArea: number // inclusiveUnits × maxUnitSize
  developerMarketableUnits: number // developerUnitsHigh - inclusiveUnits

  // Metadata
  buildingInfo: {
    plotArea: number
    buildingPercentage: number
    density: number // צפיפות לדונם
    unitsPerDunam: number
  }
}

/** Shaked/Amendment 139 Result */
export interface ShakedResult extends Tama38Result {
  shakedMultiplier: number // up to 400%
  bettermentLevyRate: number // 25%
  bettermentLevyAmount: number | null // null when user hasn't provided value estimate
  comparisonVsTama: {
    areaDifference: number
    unitsDifference: number
  }
}

/** HFP/2666 Sub-area within a district (2025 Table 5) */
export interface Hfp2666SubArea {
  id: string               // "1a", "4b", etc.
  districtId: number       // parent district 1-10
  name: string             // Hebrew name
  multiplier: number       // residential multiplier (e.g., 2.50 = 250%)
  commercialBonus: number  // additional commercial % (0 if none, 0.15 = 15%)
  maxFloors: number        // max floors (higher value for slope-descending)
  unitsPerDunam: number    // max density (units/dunam)
  condition?: {
    type: 'min_existing_units' | 'max_existing_units' | 'strengthening_only' | 'parcel_consolidation' | 'focal_hub'
    threshold?: number     // for unit count conditions
    minParcels?: number    // for parcel_consolidation: minimum parcels to consolidate
    minAreaDunams?: number // for focal_hub: minimum consolidated area in dunams
  }
  isDefault?: boolean      // fallback sub-area when no condition matches
}

/** HFP/2666 District (parent grouping — 10 planning districts) */
export interface Hfp2666District {
  id: number
  name: string
  subAreas: Hfp2666SubArea[]
}

/** HFP/2666 Calculation Result */
export interface Hfp2666Result {
  district: Hfp2666District | null
  subArea: Hfp2666SubArea | null
  districtDataAvailable: boolean
  isStrengtheningOnly: boolean // true for areas that only allow 25 sqm/unit
  strengthenAddition: number | null // total addition for strengthening-only (25 × units)
  isBuildingH: boolean // true when using Building H ×3 existing gross calc
  isSmallBuildingOverride: boolean // true when <4 units in districts 4-10 caps at 135%
  existingGrossArea: number | null // for Building H: contour × floors
  commercialBonus: number // commercial bonus % for display
  plotArea: number
  multiplier: number | null
  rawPrimaryArea: number | null // plotArea × multiplier
  maxByFloors: number | null
  maxByDensity: number | null
  finalPrimaryArea: number | null
  potentialUnitsLow: number | null
  potentialUnitsHigh: number | null
  existingUnitsToReturn: number
  developerUnitsLow: number | null
  developerUnitsHigh: number | null
  // Service areas
  totalMamad: number | null
  totalBalcony: number | null
  // Summary
  returnedPrimaryToTenants: number
  returnedMamadToTenants: number
  returnedServiceToTenants: number
  developerPrimary: number | null
  developerService: number | null
  // Paledelet
  totalPaledelet: number | null
  returnedPaledelToTenants: number
  developerPaledelet: number | null
  // Inclusive Housing
  inclusiveHousingApplies: boolean
  inclusiveHousingRate: number
  inclusiveHousingUnits: number
  developerMarketableUnits: number | null
}

/** Combined Efes Report */
export interface EfesReport {
  parcelId: ParcelId
  geoData: ParcelGeoData
  filterResult: FilterResult
  buildingInput: BuildingInput
  tama38: Tama38Result | null
  shaked: ShakedResult | null
  hfp2666: Hfp2666Result | null
  generatedAt: string
}

/** GeoJSON layer configuration */
export interface GeoLayerConfig {
  id: string
  name: string // Hebrew display name
  fileName: string
  sourceUrl: string
  visible: boolean
  color: string
  opacity: number
  type: 'fill' | 'line' | 'circle'
}

/** App-level state */
export interface AppState {
  // Selection
  selectedParcel: ParcelId | null
  parcelGeoData: ParcelGeoData | null
  buildingInput: BuildingInput

  // Results
  filterResult: FilterResult | null
  tama38Result: Tama38Result | null
  shakedResult: ShakedResult | null
  hfp2666Result: Hfp2666Result | null

  // UI
  activeTab: 'tama38' | 'shaked' | 'hfp2666'
  isLoading: boolean
  error: string | null
  layerVisibility: Record<string, boolean>

  // HFP/2666 manual overrides
  manualHfpDistrictId: number | null
  manualHfpSubAreaId: string | null

  // Actions
  setSelectedParcel: (parcel: ParcelId | null) => void
  setParcelGeoData: (data: ParcelGeoData | null) => void
  setBuildingInput: (input: Partial<BuildingInput>) => void
  setFilterResult: (result: FilterResult | null) => void
  setTama38Result: (result: Tama38Result | null) => void
  setShakedResult: (result: ShakedResult | null) => void
  setHfp2666Result: (result: Hfp2666Result | null) => void
  setActiveTab: (tab: 'tama38' | 'shaked' | 'hfp2666') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleLayer: (layerId: string) => void
  setManualHfpDistrict: (districtId: number | null, subAreaId?: string | null) => void
  resetAll: () => void
}
