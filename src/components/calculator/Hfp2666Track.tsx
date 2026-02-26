'use client'

import { useState } from 'react'
import type { Hfp2666Result } from '@/lib/engine/types'
import { HFP2666_DISTRICTS } from '@/lib/data/rules'
import { useStore } from '@/lib/hooks/useStore'

interface Hfp2666TrackProps {
  result: Hfp2666Result
}

export function Hfp2666Track({ result }: Hfp2666TrackProps) {
  const [showDistrictOverride, setShowDistrictOverride] = useState(false)
  const { setManualHfpDistrict } = useStore()
  const fmtNum = (n: number | null) => n !== null ? n.toLocaleString('he-IL') : '---'

  const handleDistrictSelect = (districtId: number) => {
    setManualHfpDistrict(districtId)
    setShowDistrictOverride(false)
  }

  const handleSubAreaSelect = (subAreaId: string) => {
    if (result.district) {
      setManualHfpDistrict(result.district.id, subAreaId)
    }
  }

  const handleResetOverride = () => {
    setManualHfpDistrict(null)
    setShowDistrictOverride(false)
  }

  // Badge text for sub-area condition types
  const getSubAreaBadge = (condType?: string) => {
    if (condType === 'strengthening_only') return ' (חיזוק)'
    if (condType === 'parcel_consolidation') return ' [איחוד]'
    if (condType === 'focal_hub') return ' [מוקד]'
    return ''
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-haifa-blue font-hebrew flex items-center gap-2">
        {result.isBuildingH
          ? 'חישוב זכויות - מבני H (כלל העיר)'
          : 'חישוב זכויות - חפ/2666 (תוכנית התחדשות בניינית)'}
      </h3>

      {/* Building H header — no district picker */}
      {result.isBuildingH ? (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-teal-800 font-hebrew mb-2">
            מבני H — כלל העיר (פי 3 מהנפח הקיים)
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-teal-700 font-hebrew">
            <span>נפח קיים: <strong>{fmtNum(result.existingGrossArea)} מ״ר</strong></span>
            <span>מכפיל: <strong>×3</strong></span>
            <span>מקסימום קומות: <strong>12</strong></span>
          </div>
        </div>
      ) : (
        <>
          {/* District & Sub-area Info */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-teal-800 font-hebrew">
                {result.district?.name
                  ? `מתחם ${result.district.id}: ${result.district.name}`
                  : 'מתחם תכנון לא זוהה'
                }
              </span>
              <div className="flex gap-2">
                {result.district && (
                  <button
                    onClick={handleResetOverride}
                    className="text-xs text-gray-500 hover:text-gray-700 font-hebrew underline"
                  >
                    איפוס
                  </button>
                )}
                <button
                  onClick={() => setShowDistrictOverride(!showDistrictOverride)}
                  className="text-xs text-teal-600 hover:text-teal-800 font-hebrew underline"
                >
                  {showDistrictOverride ? 'סגור' : 'שנה מתחם'}
                </button>
              </div>
            </div>

            {/* Resolved sub-area info */}
            {result.subArea && !result.isStrengtheningOnly && (
              <div className="flex flex-wrap gap-3 text-xs text-teal-700 font-hebrew mb-2">
                <span className="bg-teal-100 px-2 py-0.5 rounded">{result.subArea.name}</span>
                <span>מכפיל: <strong>{result.multiplier ? `${(result.multiplier * 100)}%` : '---'}</strong></span>
                <span>מקסימום קומות: <strong>{result.subArea.maxFloors}</strong></span>
                <span>צפיפות: <strong>{result.subArea.unitsPerDunam} יח״ד/דונם</strong></span>
                {result.commercialBonus > 0 && (
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    + {Math.round(result.commercialBonus * 100)}% מסחרי
                  </span>
                )}
              </div>
            )}

            {/* Small building override banner */}
            {result.isSmallBuildingOverride && (
              <div className="bg-orange-50 border border-orange-300 rounded p-2 mt-2">
                <p className="text-xs text-orange-800 font-hebrew font-semibold">
                  מבנה עם פחות מ-4 יח״ד — מוגבל ל-135%, עד 8 יח״ד/דונם, עד 6 קומות
                </p>
              </div>
            )}

            {result.isStrengtheningOnly && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                <p className="text-xs text-yellow-800 font-hebrew font-semibold">
                  חיזוק בלבד — 25 מ״ר תוספת ליחידת דיור קיימת
                </p>
                <p className="text-xs text-yellow-700 font-hebrew mt-1">
                  באזור זה לא ניתן לבצע הריסה ובנייה. ניתן לבחור תת-אזור אחר במתחם.
                </p>
              </div>
            )}

            {!result.districtDataAvailable && !result.isStrengtheningOnly && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                <p className="text-xs text-yellow-800 font-hebrew">
                  מתחם תכנון לא זוהה. בחר מתחם ידנית.
                </p>
              </div>
            )}

            {/* Sub-area picker (when district has multiple sub-areas) */}
            {result.district && result.district.subAreas.length > 1 && !showDistrictOverride && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-hebrew mb-1">תת-אזור:</p>
                <div className="flex flex-wrap gap-1">
                  {result.district.subAreas.map((sub) => {
                    const isConsolidation = sub.condition?.type === 'parcel_consolidation'
                    const isHub = sub.condition?.type === 'focal_hub'
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubAreaSelect(sub.id)}
                        className={`text-xs px-2 py-1 rounded border font-hebrew ${
                          result.subArea?.id === sub.id
                            ? 'bg-teal-100 border-teal-400 text-teal-800'
                            : isHub
                              ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700'
                              : isConsolidation
                                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub.name}
                        {getSubAreaBadge(sub.condition?.type)}
                        {sub.multiplier > 0 ? ` ${Math.round(sub.multiplier * 100)}%` : ''}
                      </button>
                    )
                  })}
                </div>
                {/* Info banner for consolidation/hub selection */}
                {result.subArea?.condition?.type === 'parcel_consolidation' && (
                  <p className="text-[10px] text-blue-600 font-hebrew mt-1">
                    איחוד מגרשים — נדרש מינימום {result.subArea.condition.minParcels} מגרשים
                  </p>
                )}
                {result.subArea?.condition?.type === 'focal_hub' && (
                  <p className="text-[10px] text-purple-600 font-hebrew mt-1">
                    מוקד — נדרש מינימום {result.subArea.condition.minAreaDunams} דונם ותוכנית מפורטת. נדרשת תוספת שטחים ציבוריים.
                  </p>
                )}
              </div>
            )}

            {/* District override picker */}
            {showDistrictOverride && (
              <div className="mt-3 p-2 bg-white rounded border">
                <p className="text-xs text-gray-500 font-hebrew mb-2">בחר מתחם:</p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {HFP2666_DISTRICTS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleDistrictSelect(d.id)}
                      className={`text-xs p-1.5 rounded border font-hebrew text-right ${
                        result.district?.id === d.id
                          ? 'bg-teal-100 border-teal-400'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-bold">{d.id}.</span> {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Strengthening-only result */}
      {result.isStrengtheningOnly && result.strengthenAddition !== null && (
        <table className="efes-table">
          <thead>
            <tr>
              <th colSpan={2} className="section-header !bg-yellow-700">
                חיזוק בלבד — חפ/2666
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-hebrew text-xs">דירות קיימות</td>
              <td className="font-mono text-center">{result.existingUnitsToReturn}</td>
            </tr>
            <tr>
              <td className="font-hebrew text-xs">תוספת ליחידה</td>
              <td className="font-mono text-center">25 מ״ר</td>
            </tr>
            <tr className="total-row">
              <td className="font-hebrew text-xs">סה״כ תוספת</td>
              <td className="font-mono text-center text-lg">{fmtNum(result.strengthenAddition)} מ״ר</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Full Calculation Table */}
      {result.districtDataAvailable && !result.isStrengtheningOnly && result.finalPrimaryArea !== null ? (
        <>
          <table className="efes-table">
            <thead>
              <tr>
                <th colSpan={2} className="section-header !bg-teal-700">
                  {result.isBuildingH
                    ? 'חישוב שטחים - מבני H (פי 3 מהנפח הקיים)'
                    : 'חישוב שטחים - חפ/2666 מסלול הריסה ובנייה'}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.isBuildingH ? (
                <>
                  <tr>
                    <td className="font-hebrew text-xs">נפח קיים (קונטור × קומות)</td>
                    <td className="font-mono text-center">{fmtNum(result.existingGrossArea)}</td>
                  </tr>
                  <tr>
                    <td className="font-hebrew text-xs">מכפיל (×3)</td>
                    <td className="font-mono text-center">{fmtNum(result.rawPrimaryArea)}</td>
                  </tr>
                  <tr>
                    <td className="font-hebrew text-xs">תקרה לפי קומות (מקס. 12)</td>
                    <td className="font-mono text-center">{fmtNum(result.maxByFloors)}</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <td className="font-hebrew text-xs">שטח מגרש</td>
                    <td className="font-mono text-center">{fmtNum(result.plotArea)}</td>
                  </tr>
                  <tr>
                    <td className="font-hebrew text-xs">מכפיל ({result.multiplier ? `${result.multiplier * 100}%` : '---'})</td>
                    <td className="font-mono text-center">{fmtNum(result.rawPrimaryArea)}</td>
                  </tr>
                  <tr>
                    <td className="font-hebrew text-xs">תקרה לפי קומות (מקס. {result.subArea?.maxFloors})</td>
                    <td className="font-mono text-center">{fmtNum(result.maxByFloors)}</td>
                  </tr>
                  <tr>
                    <td className="font-hebrew text-xs">תקרה לפי צפיפות ({result.subArea?.unitsPerDunam} יח״ד/דונם)</td>
                    <td className="font-mono text-center">{fmtNum(result.maxByDensity)}</td>
                  </tr>
                  {result.commercialBonus > 0 && (
                    <tr className="text-amber-700 bg-amber-50">
                      <td className="font-hebrew text-xs">תוספת מסחרי ({Math.round(result.commercialBonus * 100)}%)</td>
                      <td className="font-mono text-center text-xs">(לא נכלל בשטח עיקרי)</td>
                    </tr>
                  )}
                </>
              )}
              <tr className="total-row">
                <td className="font-hebrew text-xs">סה״כ שטח עיקרי סופי</td>
                <td className="font-mono text-center text-lg">{fmtNum(result.finalPrimaryArea)}</td>
              </tr>
            </tbody>
          </table>

          {/* Units */}
          <table className="efes-table">
            <tbody>
              <tr>
                <td className="font-hebrew text-xs">דירות פוטנציאליות</td>
                <td className="font-mono text-center">{fmtNum(result.potentialUnitsLow)}-{fmtNum(result.potentialUnitsHigh)}</td>
              </tr>
              <tr>
                <td className="font-hebrew text-xs">דירות מוחזרות (בעלי זכויות)</td>
                <td className="font-mono text-center">{result.existingUnitsToReturn}</td>
              </tr>
              <tr className="summary-row">
                <td className="font-hebrew text-xs">דירות יזם</td>
                <td className="font-mono text-center font-bold">{fmtNum(result.developerUnitsLow)}-{fmtNum(result.developerUnitsHigh)}</td>
              </tr>
            </tbody>
          </table>

          {/* Service areas */}
          <table className="efes-table">
            <tbody>
              <tr>
                <td className="font-hebrew text-xs">סה״כ ממ״ד</td>
                <td className="font-mono text-center">{fmtNum(result.totalMamad)}</td>
              </tr>
              <tr>
                <td className="font-hebrew text-xs">סה״כ מרפסות</td>
                <td className="font-mono text-center">{fmtNum(result.totalBalcony)}</td>
              </tr>
            </tbody>
          </table>

          {/* Paledelet Summary */}
          <table className="efes-table">
            <thead>
              <tr>
                <th colSpan={3} className="section-header !bg-teal-700">סיכום: חלוקה כלכלית</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="!bg-gray-100 !text-gray-700 text-xs">פירוט</th>
                <th className="!bg-gray-100 !text-gray-700 text-xs">שטח עיקרי</th>
                <th className="!bg-gray-100 !text-gray-700 text-xs">פלדלת</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-hebrew text-xs">סה״כ החזרת שטח לדיירים</td>
                <td className="font-mono text-center">{fmtNum(result.returnedPrimaryToTenants)}</td>
                <td className="font-mono text-center">{fmtNum(result.returnedPaledelToTenants)}</td>
              </tr>
              <tr className="summary-row">
                <td className="font-hebrew text-xs">סה״כ נותר ליזם</td>
                <td className="font-mono text-center font-bold">{fmtNum(result.developerPrimary)}</td>
                <td className="font-mono text-center font-bold">{fmtNum(result.developerPaledelet)}</td>
              </tr>
              <tr className="total-row">
                <td className="font-hebrew text-xs">סה״כ פלדלת לפרויקט</td>
                <td className="font-mono text-center" />
                <td className="font-mono text-center">{fmtNum(result.totalPaledelet)}</td>
              </tr>
            </tbody>
          </table>

          {/* Inclusive Housing */}
          {result.inclusiveHousingApplies && (
            <table className="efes-table">
              <thead>
                <tr>
                  <th colSpan={2} className="section-header !bg-indigo-700">
                    דיור מכליל (חפ/מד/2699)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-hebrew text-xs">שיעור דיור מכליל</td>
                  <td className="font-mono text-center">{Math.round(result.inclusiveHousingRate * 100)}%</td>
                </tr>
                <tr>
                  <td className="font-hebrew text-xs">יח״ד מכליל</td>
                  <td className="font-mono text-center">{result.inclusiveHousingUnits}</td>
                </tr>
                <tr className="summary-row">
                  <td className="font-hebrew text-xs">דירות שוק ליזם</td>
                  <td className="font-mono text-center font-bold">{result.developerMarketableUnits}</td>
                </tr>
              </tbody>
            </table>
          )}
        </>
      ) : !result.isStrengtheningOnly ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 font-hebrew">
            בחר מתחם תכנון למעלה כדי לראות חישוב.
          </p>
        </div>
      ) : null}
    </div>
  )
}
