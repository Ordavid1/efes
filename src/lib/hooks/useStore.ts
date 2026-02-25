// ============================================================
// Zustand Store - Application State Management
// ============================================================

import { create } from 'zustand'
import type { AppState, BuildingInput } from '../engine/types'
import { TAMA38_RULES } from '../data/rules'

const defaultBuildingInput: BuildingInput = {
  existingContour: 0,
  existingFloors: 0,
  existingUnitsPerFloor: 0,
  totalExistingUnits: 0,
  existingUnitsInBuilding: 0,
  pilotisArea: TAMA38_RULES.DEFAULT_PILOTIS_AREA,
  buildingType: 'multi_family',
  hasExistingTama38: false,
  minApartmentSize: TAMA38_RULES.DEFAULT_AVG_APARTMENT,
  buildingPercentage: TAMA38_RULES.DEFAULT_BUILDING_PCT,
  additionalFloors: 2.5,
  returnPerUnit: TAMA38_RULES.DEFAULT_RETURN_ADDITION,
  plotArea: 0,
}

export const useStore = create<AppState>((set) => ({
  // Selection
  selectedParcel: null,
  parcelGeoData: null,
  buildingInput: { ...defaultBuildingInput },

  // Results
  filterResult: null,
  tama38Result: null,
  shakedResult: null,
  hfp2666Result: null,

  // UI
  activeTab: 'tama38',
  isLoading: false,
  error: null,
  layerVisibility: {
    'govmap-parcels': true,
    'conservation-buildings': true,
    'preservation-areas': false,
    neighborhoods: true,
    streets: false,
    'archaeological-sites': false,
    'unesco-core': false,
    'unesco-buffer': false,
  },

  // Actions
  setSelectedParcel: (parcel) => set({ selectedParcel: parcel }),
  setParcelGeoData: (data) => set({ parcelGeoData: data }),
  setBuildingInput: (input) =>
    set((state) => ({
      buildingInput: { ...state.buildingInput, ...input },
    })),
  setFilterResult: (result) => set({ filterResult: result }),
  setTama38Result: (result) => set({ tama38Result: result }),
  setShakedResult: (result) => set({ shakedResult: result }),
  setHfp2666Result: (result) => set({ hfp2666Result: result }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleLayer: (layerId) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerId]: !state.layerVisibility[layerId],
      },
    })),
  resetAll: () =>
    set({
      selectedParcel: null,
      parcelGeoData: null,
      buildingInput: { ...defaultBuildingInput },
      filterResult: null,
      tama38Result: null,
      shakedResult: null,
      hfp2666Result: null,
      activeTab: 'tama38',
      isLoading: false,
      error: null,
    }),
}))
