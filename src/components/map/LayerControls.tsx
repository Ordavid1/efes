'use client'

import { useState } from 'react'
import { useStore } from '@/lib/hooks/useStore'

interface LayerConfig {
  id: string
  name: string
  color: string
}

interface LayerControlsProps {
  layers: LayerConfig[]
}

export function LayerControls({ layers }: LayerControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { layerVisibility, toggleLayer } = useStore()

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-hebrew font-medium text-haifa-blue hover:bg-gray-50 rounded-lg transition-colors w-full"
      >
        <span className="text-lg">🗺️</span>
        <span>שכבות מפה</span>
        <span className={`mr-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Layer list */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-1 max-h-[300px] overflow-y-auto">
          {layers.map((layer) => (
            <label
              key={layer.id}
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1 text-sm font-hebrew"
            >
              <input
                type="checkbox"
                checked={layerVisibility[layer.id] !== false}
                onChange={() => toggleLayer(layer.id)}
                className="rounded border-gray-300 text-haifa-blue focus:ring-haifa-blue"
              />
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-gray-700">{layer.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
