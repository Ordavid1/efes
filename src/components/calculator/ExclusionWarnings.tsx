'use client'

import type { FilterResult } from '@/lib/engine/types'

interface ExclusionWarningsProps {
  filterResult: FilterResult
}

export function ExclusionWarnings({ filterResult }: ExclusionWarningsProps) {
  const { status, reason, details, maxAddition, redirectPlan } = filterResult

  const config = {
    BLOCKED: {
      icon: '🚫',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      textColor: 'text-red-800',
      titleColor: 'text-red-900',
      label: 'חסום',
    },
    LIMITED: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-800',
      titleColor: 'text-yellow-900',
      label: 'מוגבל',
    },
    REDIRECTED: {
      icon: '🔄',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900',
      label: 'מופנה',
    },
    CLEAR: {
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      textColor: 'text-green-800',
      titleColor: 'text-green-900',
      label: 'תקין',
    },
  }

  const c = config[status]

  return (
    <div className={`mx-6 mt-4 p-4 ${c.bgColor} border-r-4 ${c.borderColor} rounded-lg`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{c.icon}</span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-bold ${c.titleColor} font-hebrew`}>
              {reason}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.bgColor} ${c.textColor} border ${c.borderColor}`}>
              {c.label}
            </span>
          </div>
          <p className={`text-sm ${c.textColor} font-hebrew leading-relaxed`}>
            {details}
          </p>
          {maxAddition && (
            <p className={`text-sm ${c.textColor} font-hebrew mt-2 font-semibold`}>
              תוספת מקסימלית: {maxAddition} מ״ר (ממ״ד בלבד)
            </p>
          )}
          {redirectPlan && (
            <p className={`text-sm ${c.textColor} font-hebrew mt-2`}>
              📋 תוכנית: <strong>{redirectPlan}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
