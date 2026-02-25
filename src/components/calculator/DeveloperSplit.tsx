'use client'

import type { Tama38Result } from '@/lib/engine/types'

interface DeveloperSplitProps {
  result: Tama38Result
}

export function DeveloperSplit({ result }: DeveloperSplitProps) {
  const fmtNum = (n: number) => n.toLocaleString('he-IL')

  const tenantPct = Math.round((result.returnedPrimaryToTenants / result.totalPrimaryArea) * 100)
  const developerPct = 100 - tenantPct

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-gray-600 font-hebrew">📊 חלוקת שטחים: דיירים/יזם</h4>

      {/* Visual bar */}
      <div className="h-8 rounded-lg overflow-hidden flex">
        <div
          className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${tenantPct}%` }}
        >
          דיירים {tenantPct}%
        </div>
        <div
          className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${developerPct}%` }}
        >
          יזם {developerPct}%
        </div>
      </div>

      {/* Detailed split */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-hebrew mb-1">🏠 דיירים</div>
          <div className="text-lg font-bold text-blue-800 font-mono">
            {fmtNum(result.returnedPrimaryToTenants)} מ״ר
          </div>
          <div className="text-xs text-blue-600 font-hebrew">
            + {fmtNum(result.returnedServiceToTenants)} מ״ר שירות
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600 font-hebrew mb-1">💰 יזם</div>
          <div className="text-lg font-bold text-green-800 font-mono">
            {fmtNum(result.developerPrimary)} מ״ר
          </div>
          <div className="text-xs text-green-600 font-hebrew">
            + {fmtNum(result.developerService)} מ״ר שירות
          </div>
        </div>
      </div>
    </div>
  )
}
