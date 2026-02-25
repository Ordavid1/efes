'use client'

import { useStore } from '@/lib/hooks/useStore'

export function ParcelInfoPanel() {
  const { parcelGeoData } = useStore()
  if (!parcelGeoData) return null

  const {
    neighborhood,
    quarter,
    subQuarter,
    zoningType,
    streetName,
    isConservationBuilding,
    isInPreservationArea,
    isArchaeologicalSite,
    isUnescoCore,
    isUnescoBuffer,
    plotArea,
  } = parcelGeoData

  // Build status badges for spatial flags
  const badges: { label: string; colorClass: string }[] = []
  if (isConservationBuilding) badges.push({ label: 'מבנה לשימור', colorClass: 'bg-red-100 text-red-700' })
  if (isInPreservationArea) badges.push({ label: 'מתחם שימור', colorClass: 'bg-orange-100 text-orange-700' })
  if (isArchaeologicalSite) badges.push({ label: 'אתר עתיקות', colorClass: 'bg-purple-100 text-purple-700' })
  if (isUnescoCore) badges.push({ label: 'אונסקו ליבה', colorClass: 'bg-yellow-100 text-yellow-700' })
  if (isUnescoBuffer) badges.push({ label: 'אונסקו חיץ', colorClass: 'bg-yellow-50 text-yellow-600' })

  // Only show if we have meaningful data
  const hasData = zoningType || neighborhood || quarter || streetName || plotArea > 0 || badges.length > 0
  if (!hasData) return null

  return (
    <div className="bg-gradient-to-l from-blue-50 to-white px-6 py-3 border-b border-blue-100">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm font-hebrew">
        {zoningType && <InfoRow label="ייעוד קרקע" value={zoningType} />}
        {neighborhood && <InfoRow label="שכונה" value={neighborhood} />}
        {quarter && <InfoRow label="רובע" value={quarter} />}
        {subQuarter && <InfoRow label="תת-רובע" value={subQuarter} />}
        {streetName && <InfoRow label="רחוב" value={streetName} />}
        {plotArea > 0 && <InfoRow label="שטח מגרש" value={`${plotArea.toLocaleString()} מ"ר`} />}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.colorClass}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-gray-400 text-xs whitespace-nowrap">{label}:</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  )
}
