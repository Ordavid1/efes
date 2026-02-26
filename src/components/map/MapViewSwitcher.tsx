'use client'

import { useStore } from '@/lib/hooks/useStore'
import dynamic from 'next/dynamic'
import { MapContainer } from './MapContainer'

// ArcGIS SceneContainer is loaded ONLY when the user toggles to 3D
const SceneContainer = dynamic(
  () => import('./SceneContainer').then((mod) => ({ default: mod.SceneContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-haifa-blue mx-auto mb-4" />
          <p className="text-gray-500 font-hebrew">...טוען מפה תלת-ממדית</p>
        </div>
      </div>
    ),
  }
)

export function MapViewSwitcher() {
  const { mapMode, setMapMode } = useStore()

  return (
    <div className="relative w-full h-full">
      {/* Map content */}
      {mapMode === '2d' ? <MapContainer /> : <SceneContainer />}

      {/* 2D/3D Toggle Button */}
      <div className="absolute top-20 left-4 z-20">
        <button
          onClick={() => setMapMode(mapMode === '2d' ? '3d' : '2d')}
          className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm font-hebrew font-medium text-haifa-blue hover:bg-gray-50 transition-colors border border-gray-200 flex items-center gap-2"
          title={mapMode === '2d' ? 'עבור לתצוגה תלת-ממדית' : 'עבור לתצוגה דו-ממדית'}
        >
          <span>{mapMode === '2d' ? '3D' : '2D'}</span>
        </button>
      </div>
    </div>
  )
}
