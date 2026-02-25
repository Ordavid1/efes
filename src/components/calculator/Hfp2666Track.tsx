'use client'

import { useState } from 'react'
import type { Hfp2666Result } from '@/lib/engine/types'
import { HFP2666_DISTRICTS } from '@/lib/data/rules'

interface Hfp2666TrackProps {
  result: Hfp2666Result
}

export function Hfp2666Track({ result }: Hfp2666TrackProps) {
  const [showDistrictOverride, setShowDistrictOverride] = useState(false)
  const fmtNum = (n: number | null) => n !== null ? n.toLocaleString('he-IL') : '---'

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-haifa-blue font-hebrew flex items-center gap-2">
        🏢 חישוב זכויות - חפ/2666 (תוכנית התחדשות בניינית)
      </h3>

      {/* District Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-teal-800 font-hebrew">
            {result.district?.name
              ? `מתחם ${result.district.id}: ${result.district.name}`
              : 'מתחם תכנון לא זוהה'
            }
          </span>
          <button
            onClick={() => setShowDistrictOverride(!showDistrictOverride)}
            className="text-xs text-teal-600 hover:text-teal-800 font-hebrew underline"
          >
            {showDistrictOverride ? 'סגור' : 'שנה מתחם'}
          </button>
        </div>

        {result.districtDataAvailable ? (
          <div className="flex gap-4 text-xs text-teal-700 font-hebrew">
            <span>מכפיל: <strong>{result.multiplier ? `${(result.multiplier * 100)}%` : '---'}</strong></span>
            <span>מקסימום קומות: <strong>{result.district?.maxFloors}</strong></span>
            <span>צפיפות: <strong>{result.district?.unitsPerDunam.join('-')} יח״ד/דונם</strong></span>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
            <p className="text-xs text-yellow-800 font-hebrew">
              ⏳ נתוני המכפיל למתחם זה טרם פורסמו. ניתן להזין ערך ידני.
            </p>
          </div>
        )}

        {showDistrictOverride && (
          <div className="mt-3 p-2 bg-white rounded border">
            <p className="text-xs text-gray-500 font-hebrew mb-2">בחר מתחם או הזן מכפיל ידני:</p>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {HFP2666_DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  className={`text-xs p-1.5 rounded border font-hebrew text-right ${
                    result.district?.id === d.id
                      ? 'bg-teal-100 border-teal-400'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-bold">{d.id}.</span> {d.name}
                  {d.multiplier ? ` (${d.multiplier * 100}%)` : ' ⏳'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calculation Table */}
      {result.districtDataAvailable && result.finalPrimaryArea !== null ? (
        <>
          <table className="efes-table">
            <thead>
              <tr>
                <th colSpan={2} className="section-header !bg-teal-700">
                  חישוב שטחים - חפ/2666 מסלול הריסה ובנייה
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-hebrew text-xs">שטח מגרש</td>
                <td className="font-mono text-center">{fmtNum(result.plotArea)}</td>
              </tr>
              <tr>
                <td className="font-hebrew text-xs">מכפיל מתחם ({result.multiplier ? `${result.multiplier * 100}%` : '---'})</td>
                <td className="font-mono text-center">{fmtNum(result.rawPrimaryArea)}</td>
              </tr>
              <tr>
                <td className="font-hebrew text-xs">תקרה לפי קומות (מקס. {result.district?.maxFloors})</td>
                <td className="font-mono text-center">{fmtNum(result.maxByFloors)}</td>
              </tr>
              <tr>
                <td className="font-hebrew text-xs">תקרה לפי צפיפות (יח״ד/דונם)</td>
                <td className="font-mono text-center">{fmtNum(result.maxByDensity)}</td>
              </tr>
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
                <td className="font-hebrew text-xs">דירות מוחזרות לדיירים</td>
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

          {/* Developer split */}
          <table className="efes-table">
            <thead>
              <tr>
                <th colSpan={2} className="section-header !bg-teal-700">סיכום חלוקה</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-hebrew text-xs">שטח עיקרי מוחזר לדיירים</td>
                <td className="font-mono text-center">{fmtNum(result.returnedPrimaryToTenants)}</td>
              </tr>
              <tr className="summary-row">
                <td className="font-hebrew text-xs">שטח עיקרי נותר ליזם</td>
                <td className="font-mono text-center font-bold">{fmtNum(result.developerPrimary)}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-sm text-gray-600 font-hebrew">
            נתוני מכפיל המתחם טרם פורסמו.
            <br />
            הזן מכפיל ידני למעלה כדי לראות חישוב.
          </p>
        </div>
      )}
    </div>
  )
}
