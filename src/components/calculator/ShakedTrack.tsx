'use client'

import type { ShakedResult } from '@/lib/engine/types'

interface ShakedTrackProps {
  result: ShakedResult
}

export function ShakedTrack({ result }: ShakedTrackProps) {
  const fmtNum = (n: number) => n.toLocaleString('he-IL')

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-haifa-blue font-hebrew flex items-center gap-2">
        📐 חישוב זכויות - חלופת שקד (תיקון 139)
      </h3>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm font-hebrew">
        <p className="font-semibold text-purple-800 mb-1">שינויים עיקריים מתמ״א 38:</p>
        <ul className="text-purple-700 space-y-1 text-xs">
          <li>• מכפיל זכויות: עד {result.shakedMultiplier * 100}% משטח המבנה (הריסה ובנייה)</li>
          <li>• היטל השבחה: {result.bettermentLevyRate * 100}% (במקום פטור)</li>
          <li>• ביטול תקרת 3.5 קומות</li>
        </ul>
      </div>

      {/* Main calculation table - same as TAMA with Shaked overrides */}
      <table className="efes-table">
        <thead>
          <tr>
            <th colSpan={2} className="section-header !bg-purple-700">
              חישוב שטחים - חלופת שקד
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-hebrew text-xs">שטח מבנה קיים</td>
            <td className="font-mono text-center">
              {fmtNum(result.existingContour * result.existingFloors)}
            </td>
          </tr>
          <tr>
            <td className="font-hebrew text-xs">מכפיל שקד ({result.shakedMultiplier * 100}%)</td>
            <td className="font-mono text-center">
              {fmtNum(Math.round(result.existingContour * result.existingFloors * result.shakedMultiplier))}
            </td>
          </tr>
          <tr>
            <td className="font-hebrew text-xs">זכויות בסיס ת.ב.ע</td>
            <td className="font-mono text-center">{fmtNum(result.tbeTotal)}</td>
          </tr>
          <tr className="total-row">
            <td className="font-hebrew text-xs">סה״כ שטח עיקרי</td>
            <td className="font-mono text-center text-lg">{fmtNum(result.totalPrimaryArea)}</td>
          </tr>
        </tbody>
      </table>

      {/* Unit derivation */}
      <table className="efes-table">
        <tbody>
          <tr>
            <td className="font-hebrew text-xs">שטח דירה מינימלי</td>
            <td className="font-mono text-center">{result.minApartmentSize}</td>
          </tr>
          <tr>
            <td className="font-hebrew text-xs">סה״כ דירות פוטנציאליות</td>
            <td className="font-mono text-center">{result.potentialUnitsLow}-{result.potentialUnitsHigh}</td>
          </tr>
          <tr>
            <td className="font-hebrew text-xs">דירות מוחזרות לדיירים</td>
            <td className="font-mono text-center">{result.existingUnitsToReturn}</td>
          </tr>
          <tr className="summary-row">
            <td className="font-hebrew text-xs">דירות יזם</td>
            <td className="font-mono text-center font-bold">{result.developerUnitsLow}-{result.developerUnitsHigh}</td>
          </tr>
        </tbody>
      </table>

      {/* Betterment Levy */}
      <table className="efes-table">
        <thead>
          <tr>
            <th colSpan={2} className="section-header !bg-red-700">
              היטל השבחה (חלופת שקד)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-hebrew text-xs">שיעור היטל</td>
            <td className="font-mono text-center">{result.bettermentLevyRate * 100}%</td>
          </tr>
          <tr>
            <td className="font-hebrew text-xs">אומדן היטל השבחה</td>
            <td className="font-mono text-center text-red-600 font-bold">
              {result.bettermentLevyAmount != null
                ? `₪${fmtNum(result.bettermentLevyAmount)}`
                : <span className="text-gray-400 text-xs font-hebrew font-normal">הזן שווי מ״ר לחישוב</span>
              }
            </td>
          </tr>
        </tbody>
      </table>

      {result.bettermentLevyAmount == null && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 font-hebrew">
          ⚠️ אומדן היטל השבחה מחייב הערכת שווי מ״ר. השווי משתנה לפי שכונה ומיקום ואינו ניתן להערכה אוטומטית.
        </div>
      )}

      {/* Comparison vs TAMA 38 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-bold text-gray-600 font-hebrew mb-2">📊 השוואה מול תמ״א 38 רגילה:</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`rounded p-2 ${result.comparisonVsTama.areaDifference > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs text-gray-500 font-hebrew">הפרש שטח</div>
            <div className={`font-bold font-mono ${result.comparisonVsTama.areaDifference > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {result.comparisonVsTama.areaDifference > 0 ? '+' : ''}{fmtNum(result.comparisonVsTama.areaDifference)} מ״ר
            </div>
          </div>
          <div className={`rounded p-2 ${result.comparisonVsTama.unitsDifference > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 font-hebrew">הפרש דירות</div>
            <div className="font-bold font-mono">
              {result.comparisonVsTama.unitsDifference > 0 ? '+' : ''}{result.comparisonVsTama.unitsDifference}
            </div>
          </div>
          <div className="rounded p-2 bg-red-50">
            <div className="text-xs text-gray-500 font-hebrew">היטל השבחה</div>
            <div className="font-bold font-mono text-red-600">
              {result.bettermentLevyAmount != null
                ? `₪${fmtNum(result.bettermentLevyAmount)}`
                : '---'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
