'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/hooks/useStore'

interface ParcelSearchProps {
  onFlyTo: (lng: number, lat: number, geojson?: GeoJSON.Feature) => void
  onEnrich: (lng: number, lat: number, gush?: number, helka?: number) => Promise<Record<string, unknown>>
  clickedGush?: number | null
  clickedHelka?: number | null
}

export function ParcelSearch({ onFlyTo, onEnrich, clickedGush, clickedHelka }: ParcelSearchProps) {
  const [gush, setGush] = useState('')
  const [helka, setHelka] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const { setSelectedParcel, setParcelGeoData, setLoading } = useStore()

  // Reverse-fill: when a parcel is clicked on the map, update search inputs
  useEffect(() => {
    if (clickedGush) setGush(String(clickedGush))
    if (clickedHelka) setHelka(String(clickedHelka))
  }, [clickedGush, clickedHelka])

  const handleSearch = async () => {
    if (!gush || !helka) {
      setError('יש להזין גוש וחלקה')
      return
    }

    setSearching(true)
    setError('')
    setLoading(true)

    try {
      // Query GovMap WFS for parcel data
      const wfsUrl = `/api/govmap?gush=${gush}&helka=${helka}`
      const response = await fetch(wfsUrl)

      if (!response.ok) {
        throw new Error('שגיאה בחיפוש חלקה')
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const props = feature.properties || {}

        // Extract centroid for map fly-to
        const coords = feature.geometry.coordinates
        let lng: number, lat: number

        if (feature.geometry.type === 'Polygon') {
          const ring = coords[0]
          lng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length
          lat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length
        } else {
          lng = coords[0]
          lat = coords[1]
        }

        const parcelId = { gush: parseInt(gush), helka: parseInt(helka) }
        setSelectedParcel(parcelId)

        // Run server-side spatial enrichment (replaces old client-side queryRenderedFeatures)
        const enriched = await onEnrich(lng, lat, parcelId.gush, parcelId.helka)

        // Set geo data enriched with ALL fields populated
        setParcelGeoData({
          parcelId,
          plotArea: props.SHAPE_Area ? Math.round(Number(props.SHAPE_Area)) : 0,
          neighborhood: (enriched.neighborhood as string) || null,
          quarter: (enriched.quarter as string) || null,
          subQuarter: (enriched.subQuarter as string) || null,
          zoningType: (enriched.zoningType as string) || null,
          isConservationBuilding: (enriched.isConservationBuilding as boolean) || false,
          isInPreservationArea: (enriched.isInPreservationArea as boolean) || false,
          isArchaeologicalSite: (enriched.isArchaeologicalSite as boolean) || false,
          isUnescoCore: (enriched.isUnescoCore as boolean) || false,
          isUnescoBuffer: (enriched.isUnescoBuffer as boolean) || false,
          streetName: (enriched.streetName as string) || null,
          polygon: feature,
        })

        onFlyTo(lng, lat, feature)
      } else {
        setError('חלקה לא נמצאה')
      }
    } catch (err) {
      setError((err as Error).message || 'שגיאה בחיפוש')
      // For demo: set mock data so the calculator works
      const parcelId = { gush: parseInt(gush), helka: parseInt(helka) }
      setSelectedParcel(parcelId)
      setParcelGeoData({
        parcelId,
        plotArea: 1011,
        neighborhood: null,
        quarter: null,
        subQuarter: null,
        zoningType: 'מגורים',
        isConservationBuilding: false,
        isInPreservationArea: false,
        isArchaeologicalSite: false,
        isUnescoCore: false,
        isUnescoBuffer: false,
        streetName: null,
        polygon: null,
      })
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500 font-hebrew">גוש</label>
          <input
            type="number"
            value={gush}
            onChange={(e) => setGush(e.target.value)}
            placeholder="10769"
            className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500 font-hebrew">חלקה</label>
          <input
            type="number"
            value={helka}
            onChange={(e) => setHelka(e.target.value)}
            placeholder="15"
            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-1.5 bg-haifa-blue text-white rounded-lg text-sm font-hebrew font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {searching ? '...' : 'חפש'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 font-hebrew">{error}</p>
      )}
    </div>
  )
}
