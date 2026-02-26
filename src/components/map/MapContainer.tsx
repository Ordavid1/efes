'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStore } from '@/lib/hooks/useStore'
import { useParcelSelection } from '@/lib/hooks/useParcelSelection'
import { LayerControls } from './LayerControls'
import { ParcelSearch } from './ParcelSearch'

// Initialize RTL text plugin for Hebrew labels (call once)
try {
  maplibregl.setRTLTextPlugin(
    'https://unpkg.com/@maplibre/maplibre-gl-rtl-text@0.1.3/dist/maplibre-gl-rtl-text.umd.js',
    true // lazy load
  )
} catch {
  // Plugin may already be loaded
}

// GeoJSON overlay layer configurations (zoning removed - now via WMS tiles)
export const GEO_LAYERS = [
  { id: 'neighborhoods', file: 'neighborhoods.geojson', color: '#2d8a4e', opacity: 0.3, type: 'line' as const, name: 'שכונות' },
  { id: 'conservation-buildings', file: 'conservation-buildings.geojson', color: '#c0392b', opacity: 0.6, type: 'fill' as const, name: 'מבנים לשימור' },
  { id: 'preservation-areas', file: 'preservation-areas.geojson', color: '#e67e22', opacity: 0.2, type: 'fill' as const, name: 'מתחמים לשימור' },
  { id: 'archaeological-sites', file: 'archaeological-sites.geojson', color: '#8e44ad', opacity: 0.3, type: 'fill' as const, name: 'אתרי עתיקות' },
  { id: 'unesco-core', file: 'unesco-core.geojson', color: '#d4a843', opacity: 0.25, type: 'fill' as const, name: 'אונסקו - ליבה' },
  { id: 'unesco-buffer', file: 'unesco-buffer.geojson', color: '#d4a843', opacity: 0.1, type: 'fill' as const, name: 'אונסקו - חיץ' },
  { id: 'streets', file: 'streets.geojson', color: '#7f8c8d', opacity: 0.4, type: 'line' as const, name: 'רחובות' },
]

// Base map style: MapTiler (if key provided) or OpenFreeMap (free, no key needed)
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || ''
const hasValidMaptilerKey = MAPTILER_KEY && !MAPTILER_KEY.includes('MAPTILER') && !MAPTILER_KEY.includes('YOUR')

function getMapStyle(): string {
  if (hasValidMaptilerKey) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  }
  // OpenFreeMap — 100% free, no API key, no limits
  return 'https://tiles.openfreemap.org/styles/liberty'
}

export function MapContainer() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showZoomHint, setShowZoomHint] = useState(false)

  const { layerVisibility, parcelGeoData } = useStore()
  const { clickLoading, clickedGush, clickedHelka, fetchEnrichment, selectParcelAtPoint } = useParcelSelection()

  // Handle map click - identify parcel and auto-fill everything
  const handleMapClick = useCallback(async (e: maplibregl.MapMouseEvent) => {
    const map = mapRef.current
    if (!map || clickLoading) return

    const { lng, lat } = e.lngLat

    // Only trigger parcel selection at zoom levels where parcels are visible
    if (map.getZoom() < 14) return

    const result = await selectParcelAtPoint(lng, lat)

    if (result) {
      // Highlight selected parcel
      const source = map.getSource('selected-parcel') as maplibregl.GeoJSONSource
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [result.feature],
        })
      }

      // Fly to parcel
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 17),
        duration: 1000,
      })
    }
  }, [clickLoading, selectParcelAtPoint])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      center: [34.99, 32.79], // Haifa center
      zoom: 13,
      maxBounds: [[34.8, 32.7], [35.15, 32.9]], // Restrict to Haifa area
    })

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), 'bottom-left')

    map.on('load', () => {
      // === GovMap WMS Parcel Tile Layer ===
      map.addSource('govmap-parcels', {
        type: 'raster',
        tiles: [
          'https://open.govmap.gov.il/geoserver/opendata/wms?' +
          'service=WMS&version=1.1.1&request=GetMap' +
          '&layers=opendata:PARCEL_ALL' +
          '&bbox={bbox-epsg-3857}' +
          '&width=256&height=256' +
          '&srs=EPSG:3857' +
          '&format=image/png' +
          '&transparent=true' +
          '&styles='
        ],
        tileSize: 256,
      })

      map.addLayer({
        id: 'govmap-parcels-layer',
        type: 'raster',
        source: 'govmap-parcels',
        minzoom: 14,
        paint: { 'raster-opacity': 0.55 },
      })

      // === GeoJSON Overlay Layers ===
      GEO_LAYERS.forEach((layer) => {
        const sourceId = `source-${layer.id}`

        map.addSource(sourceId, {
          type: 'geojson',
          data: `/data/${layer.file}`,
        })

        if (layer.type === 'fill') {
          map.addLayer({
            id: `layer-${layer.id}-fill`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': layer.color,
              'fill-opacity': layer.opacity,
            },
            layout: { visibility: 'visible' },
          })

          map.addLayer({
            id: `layer-${layer.id}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': layer.color,
              'line-width': 1,
              'line-opacity': Math.min(layer.opacity + 0.3, 1),
            },
            layout: { visibility: 'visible' },
          })
        } else {
          map.addLayer({
            id: `layer-${layer.id}-line`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': layer.color,
              'line-width': 2,
              'line-opacity': layer.opacity,
            },
            layout: { visibility: 'visible' },
          })
        }
      })

      // === Selected Parcel Highlight ===
      map.addSource('selected-parcel', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'selected-parcel-fill',
        type: 'fill',
        source: 'selected-parcel',
        paint: {
          'fill-color': '#1e3a5f',
          'fill-opacity': 0.3,
        },
      })

      map.addLayer({
        id: 'selected-parcel-outline',
        type: 'line',
        source: 'selected-parcel',
        paint: {
          'line-color': '#1e3a5f',
          'line-width': 3,
          'line-opacity': 0.9,
        },
      })

      // Restore selected parcel if one exists (e.g. switching back from 3D)
      const currentGeoData = useStore.getState().parcelGeoData
      if (currentGeoData?.polygon) {
        const source = map.getSource('selected-parcel') as maplibregl.GeoJSONSource
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [currentGeoData.polygon as GeoJSON.Feature],
          })
        }
      }

      setMapLoaded(true)
    })

    // Track zoom for hint display
    map.on('zoomend', () => {
      setShowZoomHint(map.getZoom() < 14)
    })
    // Initial check
    map.on('load', () => {
      setShowZoomHint(map.getZoom() < 14)
    })

    // Pointer cursor when hovering at parcel-visible zoom levels
    map.on('mousemove', () => {
      if (map.getZoom() >= 14) {
        map.getCanvas().style.cursor = 'pointer'
      } else {
        map.getCanvas().style.cursor = ''
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Register click handler (separate effect so it uses latest callback)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [handleMapClick])

  // Update layer visibility when store changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const map = mapRef.current

    // GovMap parcels layer visibility
    const parcelsVisible = layerVisibility['govmap-parcels'] !== false
    try {
      map.setLayoutProperty('govmap-parcels-layer', 'visibility', parcelsVisible ? 'visible' : 'none')
    } catch { /* layer might not exist yet */ }

    GEO_LAYERS.forEach((layer) => {
      const isVisible = layerVisibility[layer.id] !== false
      const visibility = isVisible ? 'visible' : 'none'

      if (layer.type === 'fill') {
        try {
          map.setLayoutProperty(`layer-${layer.id}-fill`, 'visibility', visibility)
          map.setLayoutProperty(`layer-${layer.id}-outline`, 'visibility', visibility)
        } catch { /* layer might not exist yet */ }
      } else {
        try {
          map.setLayoutProperty(`layer-${layer.id}-line`, 'visibility', visibility)
        } catch { /* layer might not exist yet */ }
      }
    })
  }, [layerVisibility, mapLoaded])

  // Fly to parcel (called from ParcelSearch)
  const handleFlyToParcel = (lng: number, lat: number, geojson?: GeoJSON.Feature) => {
    if (!mapRef.current) return

    if (isNaN(lng) || isNaN(lat)) {
      console.warn('Invalid coordinates for flyTo:', lng, lat)
      return
    }

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 17,
      duration: 1500,
    })

    if (geojson) {
      const source = mapRef.current.getSource('selected-parcel') as maplibregl.GeoJSONSource
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [geojson],
        })
      }
    }
  }

  // All layers for the layer control (including GovMap parcels)
  const allLayers = [
    { id: 'govmap-parcels', name: 'חלקות (GovMap)', color: '#3b82f6' },
    ...GEO_LAYERS,
  ]

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Parcel Search - top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <ParcelSearch
          onFlyTo={handleFlyToParcel}
          onEnrich={fetchEnrichment}
          clickedGush={clickedGush}
          clickedHelka={clickedHelka}
        />
      </div>

      {/* Layer Controls - bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <LayerControls layers={allLayers} />
      </div>

      {/* Haifa branding */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <h1 className="text-sm font-bold text-haifa-blue font-hebrew">מחשבון זכויות בנייה - חיפה</h1>
      </div>

      {/* Zoom hint */}
      {showZoomHint && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
          <p className="text-sm text-gray-600 font-hebrew">התקרב למפה לראות ולבחור חלקות</p>
        </div>
      )}

      {/* Click loading indicator */}
      {clickLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-haifa-blue border-t-transparent rounded-full" />
            <span className="text-sm font-hebrew text-gray-700">מזהה חלקה...</span>
          </div>
        </div>
      )}
    </div>
  )
}
