'use client'

import { useState } from 'react'
import type { Tama38Result, ShakedResult, Hfp2666Result } from '@/lib/engine/types'
import { useStore } from '@/lib/hooks/useStore'
import { generateEfesExcel, downloadExcel } from '@/lib/export/excelExport'

interface EfesReportProps {
  tama38: Tama38Result | null
  shaked: ShakedResult | null
  hfp2666: Hfp2666Result | null
}

export function EfesReport({ tama38, shaked, hfp2666 }: EfesReportProps) {
  const [exporting, setExporting] = useState(false)
  const { selectedParcel, buildingInput } = useStore()

  if (!tama38) return null

  const handleExport = async () => {
    if (!selectedParcel || !tama38) return
    setExporting(true)
    try {
      const workbook = await generateEfesExcel(
        tama38,
        shaked,
        hfp2666,
        selectedParcel,
        buildingInput
      )
      await downloadExcel(workbook, selectedParcel)
    } catch (err) {
      console.error('Excel export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const fmtNum = (n: number | null | undefined) =>
    n != null ? n.toLocaleString('he-IL') : '---'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-haifa-blue font-hebrew flex items-center gap-2">
          📄 דוח אפס השוואתי
        </h3>
        {selectedParcel && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-hebrew font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {exporting ? '⏳ מייצא...' : '📥 ייצוא לאקסל'}
          </button>
        )}
      </div>

      {/* Comparison Table */}
      <table className="efes-table">
        <thead>
          <tr>
            <th className="!text-right">נתון</th>
            <th className="text-center">תמ״א 38</th>
            <th className="text-center">חלופת שקד</th>
            <th className="text-center">חפ/2666</th>
          </tr>
        </thead>
        <tbody>
          <CompRow
            label="סה״כ שטח עיקרי (מ״ר)"
            tama={tama38?.totalPrimaryArea}
            shaked={shaked?.totalPrimaryArea}
            hfp={hfp2666?.finalPrimaryArea}
          />
          <CompRow
            label="דירות פוטנציאליות"
            tama={`${tama38?.potentialUnitsLow}-${tama38?.potentialUnitsHigh}`}
            shaked={`${shaked?.potentialUnitsLow}-${shaked?.potentialUnitsHigh}`}
            hfp={hfp2666?.potentialUnitsLow != null ? `${hfp2666.potentialUnitsLow}-${hfp2666.potentialUnitsHigh}` : null}
          />
          <CompRow
            label="דירות יזם"
            tama={`${tama38?.developerUnitsLow}-${tama38?.developerUnitsHigh}`}
            shaked={`${shaked?.developerUnitsLow}-${shaked?.developerUnitsHigh}`}
            hfp={hfp2666?.developerUnitsLow != null ? `${hfp2666.developerUnitsLow}-${hfp2666.developerUnitsHigh}` : null}
          />
          <CompRow
            label="שטח עיקרי ליזם (מ״ר)"
            tama={tama38?.developerPrimary}
            shaked={shaked?.developerPrimary}
            hfp={hfp2666?.developerPrimary}
            highlight
          />
          <CompRow
            label="שטח ממ״ד כולל (מ״ר)"
            tama={tama38?.totalMamad}
            shaked={shaked?.totalMamad}
            hfp={hfp2666?.totalMamad}
          />
          <CompRow
            label="שטח מרפסות כולל (מ״ר)"
            tama={tama38?.totalBalcony}
            shaked={shaked?.totalBalcony}
            hfp={hfp2666?.totalBalcony}
          />
          <CompRow
            label="היטל השבחה"
            tama="פטור"
            shaked={shaked ? (shaked.bettermentLevyAmount != null ? `₪${fmtNum(shaked.bettermentLevyAmount)}` : 'הזן שווי מ״ר') : null}
            hfp="לפי תוכנית"
          />
        </tbody>
      </table>

      {/* Building Info Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-xs font-bold text-gray-600 font-hebrew mb-2">ת.מ.א .בניינית</h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-hebrew">
          <div>
            <span className="text-gray-500">שטח מגרש:</span>{' '}
            <span className="font-semibold">{fmtNum(tama38.buildingInfo.plotArea)} מ״ר</span>
          </div>
          <div>
            <span className="text-gray-500">אחוזי בנייה:</span>{' '}
            <span className="font-semibold">{Math.round(tama38.buildingInfo.buildingPercentage * 100)}%</span>
          </div>
          <div>
            <span className="text-gray-500">צפיפות לדונם:</span>{' '}
            <span className="font-semibold">{fmtNum(Math.round(tama38.buildingInfo.unitsPerDunam * 10) / 10)} יח״ד</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-hebrew">
        <p className="font-semibold mb-1">⚠️ הערות חשובות:</p>
        <ul className="space-y-0.5">
          <li>• מספר הקומות מותנה באישור מהנדס העיר</li>
          <li>• הדירות יתאפשר במידה ויהיה פתרון חניה מלא, לשיקול צוות מהנדס העיר</li>
          <li>• הרפסת המבנה מותנית באישור ע״פי היתר מקורי</li>
          <li>• שטח הדירות מחושב עפ״י היתר מקורי</li>
        </ul>
      </div>

      {/* Timestamp */}
      <p className="text-xs text-gray-400 text-center font-hebrew">
        נוצר: {new Date().toLocaleDateString('he-IL')} {new Date().toLocaleTimeString('he-IL')}
        {' | '}מחשבון זכויות בנייה חיפה v0.1
      </p>
    </div>
  )
}

function CompRow({
  label,
  tama,
  shaked,
  hfp,
  highlight = false,
}: {
  label: string
  tama: number | string | null | undefined
  shaked: number | string | null | undefined
  hfp: number | string | null | undefined
  highlight?: boolean
}) {
  const fmt = (v: number | string | null | undefined) => {
    if (v == null) return '---'
    if (typeof v === 'string') return v
    return v.toLocaleString('he-IL')
  }

  return (
    <tr className={highlight ? 'summary-row' : ''}>
      <td className="font-hebrew text-xs">{label}</td>
      <td className="font-mono text-center text-sm">{fmt(tama)}</td>
      <td className="font-mono text-center text-sm">{fmt(shaked)}</td>
      <td className="font-mono text-center text-sm">{fmt(hfp)}</td>
    </tr>
  )
}
