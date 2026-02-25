'use client'

import dynamic from 'next/dynamic'
import { CalculatorPanel } from '@/components/calculator/CalculatorPanel'

// MapLibre must be loaded client-side only (no SSR)
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then(mod => ({ default: mod.MapContainer })),
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

      {/* Left side - Map */}
      <div className="flex-1 h-full relative">
        <MapContainer />
      </div>
    </main>
  )
}
