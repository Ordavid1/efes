'use client'

import { useStore } from '@/lib/hooks/useStore'
import { UserInputForm } from './UserInputForm'
import { ParcelInfoPanel } from './ParcelInfoPanel'
import { ExclusionWarnings } from './ExclusionWarnings'
import { Tama38Track } from './Tama38Track'
import { ShakedTrack } from './ShakedTrack'
import { Hfp2666Track } from './Hfp2666Track'
import { EfesReport } from './EfesReport'
import { runFilterPipeline } from '@/lib/engine/filters'
import { calculateTama38 } from '@/lib/engine/tama38'
import { calculateShaked } from '@/lib/engine/shaked'
import { calculateHfp2666 } from '@/lib/engine/hfp2666'
import { useCallback, useEffect, useState } from 'react'

export function CalculatorPanel() {
  const {
    selectedParcel,
    parcelGeoData,
    buildingInput,
    filterResult,
    tama38Result,
    shakedResult,
    hfp2666Result,
    activeTab,
    setActiveTab,
    setBuildingInput,
    setFilterResult,
    setTama38Result,
    setShakedResult,
    setHfp2666Result,
  } = useStore()

  // Auto-sync plot area from GIS data when a new parcel is selected
  useEffect(() => {
    if (parcelGeoData?.plotArea) {
      setBuildingInput({ plotArea: parcelGeoData.plotArea })
    }
  }, [parcelGeoData?.parcelId?.gush, parcelGeoData?.parcelId?.helka, parcelGeoData?.plotArea, setBuildingInput])

  // Run calculations whenever inputs change
  const runCalculations = useCallback(() => {
    if (!parcelGeoData || !buildingInput.existingContour) return

    // Step 1: Run filter pipeline
    const filters = runFilterPipeline(parcelGeoData, buildingInput)
    setFilterResult(filters)

    // Step 2: Run calculations (if not blocked)
    if (filters.allowTama38) {
      const tama = calculateTama38(buildingInput, parcelGeoData)
      setTama38Result(tama)

      const shaked = calculateShaked(buildingInput, parcelGeoData, buildingInput.estimatedValuePerSqm)
      setShakedResult(shaked)
    } else {
      setTama38Result(null)
      setShakedResult(null)
    }

    if (filters.allowHfp2666) {
      const hfp = calculateHfp2666(buildingInput, parcelGeoData)
      setHfp2666Result(hfp)
    } else {
      setHfp2666Result(null)
    }
  }, [parcelGeoData, buildingInput, setFilterResult, setTama38Result, setShakedResult, setHfp2666Result])

  useEffect(() => {
    if (buildingInput.existingContour > 0) {
      runCalculations()
    }
  }, [buildingInput, runCalculations])

  // Fetch data freshness date from manifest
  const [dataDate, setDataDate] = useState<string | null>(null)
  useEffect(() => {
    fetch('/data/manifest.json')
      .then((r) => r.json())
      .then((m) => setDataDate(m.fetchedAtLocal || null))
      .catch(() => {})
  }, [])

  const tabs = [
    { key: 'tama38' as const, label: 'תמ״א 38', icon: '🏗️' },
    { key: 'shaked' as const, label: 'חלופת שקד', icon: '📐' },
    { key: 'hfp2666' as const, label: 'חפ/2666', icon: '🏢' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-haifa-blue text-white px-6 py-4 flex-shrink-0">
        <h2 className="text-lg font-bold font-hebrew">מחשבון זכויות בנייה - חיפה</h2>
        <p className="text-sm text-blue-200 mt-1 font-hebrew">
          דוח אפס אוטומטי | תמ״א 38 · חלופת שקד · חפ/2666
        </p>
      </div>

      {/* Parcel Info Header */}
      {selectedParcel && (
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-200 flex-shrink-0">
          <div className="flex items-center gap-4 text-sm font-hebrew">
            <span className="font-semibold text-haifa-blue">
              גוש {selectedParcel.gush} | חלקה {selectedParcel.helka}
            </span>
            {parcelGeoData?.plotArea ? (
              <span className="text-gray-600">
                שטח מגרש: <strong>{parcelGeoData.plotArea.toLocaleString()}</strong> מ״ר
              </span>
            ) : null}
            {parcelGeoData?.zoningType && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                {parcelGeoData.zoningType}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rich Parcel Data Panel */}
      {selectedParcel && <ParcelInfoPanel />}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Exclusion Warnings */}
        {filterResult && filterResult.status !== 'CLEAR' && (
          <ExclusionWarnings filterResult={filterResult} />
        )}

        {/* User Input Form */}
        <div className="px-6 py-4 border-b border-gray-200">
          <UserInputForm />
        </div>

        {/* Calculation Results */}
        {buildingInput.existingContour > 0 && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-hebrew font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'tab-active'
                      : 'tab-inactive'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="px-6 py-4">
              {activeTab === 'tama38' && (
                tama38Result ? (
                  <Tama38Track result={tama38Result} />
                ) : (
                  <div className="text-center py-8 text-gray-400 font-hebrew">
                    {filterResult?.status === 'BLOCKED' || filterResult?.status === 'LIMITED'
                      ? 'חישוב תמ״א 38 חסום באזור זה'
                      : 'הזן נתוני מבנה לחישוב'}
                  </div>
                )
              )}

              {activeTab === 'shaked' && (
                shakedResult ? (
                  <ShakedTrack result={shakedResult} />
                ) : (
                  <div className="text-center py-8 text-gray-400 font-hebrew">
                    {filterResult?.status === 'BLOCKED' || filterResult?.status === 'LIMITED'
                      ? 'חישוב חלופת שקד חסום באזור זה'
                      : 'הזן נתוני מבנה לחישוב'}
                  </div>
                )
              )}

              {activeTab === 'hfp2666' && (
                hfp2666Result ? (
                  <Hfp2666Track result={hfp2666Result} />
                ) : (
                  <div className="text-center py-8 text-gray-400 font-hebrew">
                    {filterResult?.status === 'BLOCKED'
                      ? 'חישוב חפ/2666 חסום באזור זה'
                      : 'הזן נתוני מבנה לחישוב'}
                  </div>
                )
              )}
            </div>

            {/* Combined Efes Report */}
            {tama38Result && (
              <div className="px-6 py-4 border-t border-gray-200">
                <EfesReport
                  tama38={tama38Result}
                  shaked={shakedResult}
                  hfp2666={hfp2666Result}
                />
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!selectedParcel && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="text-6xl mb-4">🏘️</div>
            <h3 className="text-xl font-bold text-gray-700 font-hebrew mb-2">
              בחר חלקה להתחלה
            </h3>
            <p className="text-gray-500 font-hebrew text-sm leading-relaxed max-w-sm">
              חפש גוש וחלקה בשורת החיפוש שבמפה, או לחץ על חלקה במפה.
              המערכת תחשב אוטומטית את זכויות הבנייה לפי שלושה מסלולים:
              תמ״א 38, חלופת שקד, ותוכנית חפ/2666.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-2 text-xs text-gray-400 text-center font-hebrew border-t flex-shrink-0">
        {dataDate && <span>נתונים עודכנו: {dataDate} | </span>}
        הנתונים להערכה בלבד | אינם מהווים תחליף לייעוץ מקצועי | תמ״א 38 בתוקף עד 18.05.2026
      </div>
    </div>
  )
}
