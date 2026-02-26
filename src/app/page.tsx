'use client'

import dynamic from 'next/dynamic'
import { CalculatorPanel } from '@/components/calculator/CalculatorPanel'

// Map switcher handles both 2D (MapLibre) and 3D (ArcGIS) — must be client-side only
const MapViewSwitcher = dynamic(
  () => import('@/components/map/MapViewSwitcher').then(mod => ({ default: mod.MapViewSwitcher })),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> }
)

function MapLoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-haifa-blue mx-auto mb-4" />
        <p className="text-gray-500 font-hebrew">טוען מפה...</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="h-screen w-screen flex flex-row-reverse overflow-hidden">
      {/* Right side - Calculator Panel */}
      <div className="w-[45%] min-w-[420px] h-full border-r border-gray-200 bg-white overflow-y-auto calc-panel">
        <CalculatorPanel />
      </div>

      {/* Left side - Map (2D/3D) */}
      <div className="flex-1 h-full relative">
        <MapViewSwitcher />
      </div>
    </main>
  )
}
