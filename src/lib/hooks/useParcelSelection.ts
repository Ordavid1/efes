import { useState, useCallback } from 'react'
import { useStore } from './useStore'

export function useParcelSelection() {
  const [clickLoading, setClickLoading] = useState(false)
  const [clickedGush, setClickedGush] = useState<number | null>(null)
  const [clickedHelka, setClickedHelka] = useState<number | null>(null)

  const { setSelectedParcel, setParcelGeoData, setLoading } = useStore()

  const fetchEnrichment = useCallback(async (
    lng: number, lat: number, gush?: number, helka?: number
  ) => {
    let url = `/api/enrich?lng=${lng}&lat=${lat}`
    if (gush !== undefined && helka !== undefined) {
      url += `&gush=${gush}&helka=${helka}`
    }
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.error('Enrichment API error:', err)
    }
    return {}
  }, [])

  const selectParcelAtPoint = useCallback(async (lng: number, lat: number) => {
    if (clickLoading) return null
    setClickLoading(true)
    setLoading(true)

    try {
      const delta = 0.0001 // ~10m tolerance
      const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
      const response = await fetch(`/api/govmap/bbox?bbox=${bbox}`)
      const data = await response.json()

      if (data.features?.length > 0) {
        const feature = data.features[0]
        const props = feature.properties || {}
        const gush = Number(props.GUSH_NUM)
        const helka = Number(props.PARCEL)
        const plotArea = props.SHAPE_Area ? Math.round(Number(props.SHAPE_Area)) : 0

        if (!gush || !helka) return null

        setClickedGush(gush)
        setClickedHelka(helka)

        const parcelId = { gush, helka }
        setSelectedParcel(parcelId)

        const enriched = await fetchEnrichment(lng, lat, gush, helka)

        const geoData = {
          parcelId,
          plotArea,
          neighborhood: enriched.neighborhood || null,
          quarter: enriched.quarter || null,
          subQuarter: enriched.subQuarter || null,
          zoningType: enriched.zoningType || null,
          streetName: enriched.streetName || null,
          isConservationBuilding: enriched.isConservationBuilding || false,
          isInPreservationArea: enriched.isInPreservationArea || false,
          isArchaeologicalSite: enriched.isArchaeologicalSite || false,
          isUnescoCore: enriched.isUnescoCore || false,
          isUnescoBuffer: enriched.isUnescoBuffer || false,
          polygon: feature,
        }
        setParcelGeoData(geoData)
        return { feature, parcelId, geoData }
      }
      return null
    } catch (err) {
      console.error('Failed to select parcel:', err)
      return null
    } finally {
      setClickLoading(false)
      setLoading(false)
    }
  }, [clickLoading, fetchEnrichment, setSelectedParcel, setParcelGeoData, setLoading])

  return {
    clickLoading,
    clickedGush,
    clickedHelka,
    fetchEnrichment,
    selectParcelAtPoint,
  }
}
