'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/lib/hooks/useStore'
import { useParcelSelection } from '@/lib/hooks/useParcelSelection'
import { geojsonFeatureToGraphic } from './arcgisHelpers'
import { GEO_LAYERS } from './MapContainer'
import { LayerControls } from './LayerControls'
import { ParcelSearch } from './ParcelSearch'

import EsriMap from '@arcgis/core/Map'
import SceneView from '@arcgis/core/views/SceneView'
import SceneLayer from '@arcgis/core/layers/SceneLayer'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import WMSLayer from '@arcgis/core/layers/WMSLayer'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import esriConfig from '@arcgis/core/config'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import Color from '@arcgis/core/Color'

// Hex color string to ArcGIS Color
function hexToColor(hex: string, opacity: number): Color {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return new Color([r, g, b, opacity])
}

export function SceneContainer() {
  const mapRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<SceneView | null>(null)
  const selectedLayerRef = useRef<GraphicsLayer | null>(null)
  const [sceneReady, setSceneReady] = useState(false)

  const { layerVisibility, parcelGeoData } = useStore()
  const { clickLoading, clickedGush, clickedHelka, fetchEnrichment, selectParcelAtPoint } = useParcelSelection()

  // Check for API key
  const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY || ''

  useEffect(() => {
    if (!mapRef.current || viewRef.current || !apiKey) return

    // Configure ArcGIS
    esriConfig.apiKey = apiKey
    esriConfig.assetsPath = 'https://js.arcgis.com/5.0/@arcgis/core/assets'

    // Create the Map with elevation
    const map = new EsriMap({
      basemap: 'arcgis/topographic',
      ground: 'world-elevation',
    })

    // 3D Buildings (OSM global — Living Atlas)
    const buildingsLayer = new SceneLayer({
      portalItem: { id: 'ca0470dbbddb4db28bad74ed39949e25' },
      popupEnabled: false,
      title: '3d-buildings',
    })
    map.add(buildingsLayer)

    // GovMap WMS Parcels
    const govmapParcels = new WMSLayer({
      url: 'https://open.govmap.gov.il/geoserver/opendata/wms',
      sublayers: [{ name: 'opendata:PARCEL_ALL' }],
      title: 'govmap-parcels',
      opacity: 0.55,
    })
    map.add(govmapParcels)

    // GeoJSON overlay layers
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    GEO_LAYERS.forEach((layer) => {
      const geoLayer = new GeoJSONLayer({
        url: `${origin}/data/${layer.file}`,
        title: layer.id,
        elevationInfo: { mode: 'on-the-ground' },
        visible: layerVisibility[layer.id] !== false,
        renderer: layer.type === 'fill'
          ? new SimpleRenderer({
              symbol: new SimpleFillSymbol({
                color: hexToColor(layer.color, layer.opacity),
                outline: new SimpleLineSymbol({
                  color: hexToColor(layer.color, Math.min(layer.opacity + 0.3, 1)),
                  width: 1,
                }),
              }),
            })
          : new SimpleRenderer({
              symbol: new SimpleLineSymbol({
                color: hexToColor(layer.color, layer.opacity),
                width: 2,
              }),
            }),
      })
      map.add(geoLayer)
    })

    // Selected parcel highlight layer
    const selectedParcelLayer = new GraphicsLayer({
      title: 'selected-parcel',
      elevationInfo: { mode: 'on-the-ground' },
    })
    map.add(selectedParcelLayer)
    selectedLayerRef.current = selectedParcelLayer

    // Create the 3D SceneView
    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: {
          x: 34.9888,
          y: 32.7740,
          z: 1500,
        },
        tilt: 65,
        heading: 0,
      },
      qualityProfile: 'high',
      environment: {
        lighting: {
          directShadowsEnabled: true,
          date: new Date('July 15, 2026 11:00:00 UTC'),
        },
      },
    })

    viewRef.current = view

    view.when(() => {
      setSceneReady(true)

      // Restore selected parcel if one exists (e.g. switching from 2D)
      const currentGeoData = useStore.getState().parcelGeoData
      if (currentGeoData?.polygon) {
        const graphic = geojsonFeatureToGraphic(currentGeoData.polygon)
        selectedParcelLayer.removeAll()
        selectedParcelLayer.add(graphic)
        if (graphic.geometry) {
          view.goTo(
            { target: graphic.geometry, tilt: 65 },
            { duration: 0 }
          )
        }
      }
    })

    return () => {
      if (view) {
        view.destroy()
      }
      viewRef.current = null
      selectedLayerRef.current = null
    }
  }, [apiKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Click handler for parcel selection
  useEffect(() => {
    const view = viewRef.current
    if (!view || !sceneReady) return

    const handle = view.on('click', async (event) => {
      const mapPoint = view.toMap(event)
      if (!mapPoint) return

      const lng = mapPoint.longitude
      const lat = mapPoint.latitude

      if (lng == null || lat == null) return

      // Only allow selection when zoomed in enough
      if (view.scale > 10000) return

      const result = await selectParcelAtPoint(lng, lat)

      if (result && selectedLayerRef.current) {
        const graphic = geojsonFeatureToGraphic(result.feature)
        selectedLayerRef.current.removeAll()
        selectedLayerRef.current.add(graphic)

        if (graphic.geometry) {
          view.goTo(
            { target: graphic.geometry, tilt: 65, zoom: 17 },
            { duration: 1500 }
          )
        }
      }
    })

    return () => handle.remove()
  }, [sceneReady, selectParcelAtPoint])

  // Sync layer visibility from store
  useEffect(() => {
    const view = viewRef.current
    if (!view || !sceneReady || !view.map) return

    view.map.layers.forEach((layer) => {
      const layerId = layer.title
      if (layerId && layerVisibility[layerId] !== undefined) {
        layer.visible = layerVisibility[layerId] !== false
      }
    })
  }, [layerVisibility, sceneReady])

  // Fly to parcel (called from ParcelSearch)
  const handleFlyToParcel = useCallback((lng: number, lat: number, geojson?: GeoJSON.Feature) => {
    const view = viewRef.current
    if (!view) return

    if (isNaN(lng) || isNaN(lat)) {
      console.warn('Invalid coordinates for flyTo:', lng, lat)
      return
    }

    view.goTo(
      {
        center: [lng, lat],
        zoom: 17,
        tilt: 65,
      },
      { duration: 1500 }
    )

    if (geojson && selectedLayerRef.current) {
      const graphic = geojsonFeatureToGraphic(geojson)
      selectedLayerRef.current.removeAll()
      selectedLayerRef.current.add(graphic)
    }
  }, [])

  // All layers for the layer control
  const allLayers = [
    { id: 'govmap-parcels', name: 'חלקות (GovMap)', color: '#3b82f6' },
    ...GEO_LAYERS,
  ]

  // Fallback if no API key
  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-lg font-hebrew text-gray-600 mb-2">מפת 3D דורשת מפתח API של ArcGIS</p>
          <p className="text-sm font-hebrew text-gray-400">
            הגדר NEXT_PUBLIC_ARCGIS_API_KEY בקובץ .env.local
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

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
