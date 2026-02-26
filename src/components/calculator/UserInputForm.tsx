'use client'

import { useStore } from '@/lib/hooks/useStore'

export function UserInputForm() {
  const { buildingInput, setBuildingInput, parcelGeoData } = useStore()

  const updateField = (field: string, value: number | string | boolean | undefined) => {
    setBuildingInput({ [field]: value })
  }

  // Auto-calculate total units when per-floor changes
  const handleUnitsPerFloorChange = (val: number) => {
    updateField('existingUnitsPerFloor', val)
    const total = val * buildingInput.existingFloors
    updateField('totalExistingUnits', total)
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 font-hebrew mb-3 flex items-center gap-2">
        נתוני מבנה קיים
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* קונטור קומה קיימת */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            קונטור קומה קיימת (מ״ר)
          </label>
          <input
            type="number"
            value={buildingInput.existingContour || ''}
            onChange={(e) => updateField('existingContour', Number(e.target.value))}
            placeholder="142"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
        </div>

        {/* מספר קומות קיימות */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            מספר קומות קיימות
          </label>
          <input
            type="number"
            value={buildingInput.existingFloors || ''}
            onChange={(e) => updateField('existingFloors', Number(e.target.value))}
            placeholder="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
        </div>

        {/* דירות בקומה טיפוסית */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            דירות בקומה טיפוסית
          </label>
          <input
            type="number"
            value={buildingInput.existingUnitsPerFloor || ''}
            onChange={(e) => handleUnitsPerFloorChange(Number(e.target.value))}
            placeholder="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
        </div>

        {/* סה״כ דירות קיימות */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            סה״כ דירות קיימות (להרחבה)
          </label>
          <input
            type="number"
            value={buildingInput.totalExistingUnits || ''}
            onChange={(e) => updateField('totalExistingUnits', Number(e.target.value))}
            placeholder="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none bg-blue-50"
          />
        </div>

        {/* בעלי זכויות */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            בעלי זכויות (כולל קרקע)
          </label>
          <input
            type="number"
            value={buildingInput.totalRightsHolders || ''}
            onChange={(e) => updateField('totalRightsHolders', Number(e.target.value) || undefined)}
            placeholder={String(buildingInput.totalExistingUnits || '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
          <p className="text-[10px] text-gray-400 font-hebrew mt-0.5">אם שונה ממספר דירות להרחבה</p>
        </div>

        {/* קומות מוצעות */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            קומות מוצעות (תוספת)
          </label>
          <input
            type="number"
            step="0.5"
            value={buildingInput.additionalFloors || ''}
            onChange={(e) => updateField('additionalFloors', Number(e.target.value))}
            placeholder="2.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
        </div>

        {/* שטח עמודים מפולשת */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            שטח עמודים מפולשת (מ״ר)
          </label>
          <input
            type="number"
            value={buildingInput.pilotisArea || ''}
            onChange={(e) => updateField('pilotisArea', Number(e.target.value))}
            placeholder="70"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
        </div>

        {/* שטח מגרש - auto-filled from GIS, editable by user */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            שטח מגרש (מ״ר) {parcelGeoData?.plotArea ? ' *' : ''}
          </label>
          <input
            type="number"
            value={buildingInput.plotArea || ''}
            onChange={(e) => updateField('plotArea', Number(e.target.value))}
            placeholder="1011"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
        </div>

        {/* אחוזי בנייה */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            אחוזי בנייה (ת.ב.ע)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={Math.round(buildingInput.buildingPercentage * 100)}
              onChange={(e) => updateField('buildingPercentage', Number(e.target.value) / 100)}
              placeholder="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <p className="text-[10px] text-amber-600 font-hebrew mt-0.5">ברירת מחדל 60%. בדוק לפי תב״ע ספציפית</p>
        </div>

        {/* שטח דירה ממוצעת */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            שטח דירה ממוצעת (מ״ר)
          </label>
          <input
            type="number"
            value={buildingInput.minApartmentSize || ''}
            onChange={(e) => updateField('minApartmentSize', Number(e.target.value))}
            placeholder="85"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
          <p className="text-[10px] text-gray-400 font-hebrew mt-0.5">לחישוב מספר דירות פוטנציאליות</p>
        </div>

        {/* צפיפות לדונם */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            צפיפות לדונם (יח״ד)
          </label>
          <input
            type="number"
            value={buildingInput.densityPerDunam || ''}
            onChange={(e) => updateField('densityPerDunam', Number(e.target.value) || undefined)}
            placeholder="15"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
          <p className="text-[10px] text-gray-400 font-hebrew mt-0.5">ממולא אוטו. מחפ/2666</p>
        </div>

        {/* תוספת שטח עיקרי לדירה מוחזרת */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            תוספת עיקרי לדירה מוחזרת
          </label>
          <input
            type="number"
            value={buildingInput.primaryReturnPerUnit || ''}
            onChange={(e) => updateField('primaryReturnPerUnit', Number(e.target.value))}
            placeholder="13"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
          <p className="text-[10px] text-gray-400 font-hebrew mt-0.5">13 מ״ר הרחבת תמ״א</p>
        </div>

        {/* ממ"ד לדירה מוחזרת */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            ממ״ד לדירה מוחזרת (מ״ר)
          </label>
          <input
            type="number"
            value={buildingInput.mamadReturnPerUnit || ''}
            onChange={(e) => updateField('mamadReturnPerUnit', Number(e.target.value))}
            placeholder="12"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
          <p className="text-[10px] text-gray-400 font-hebrew mt-0.5">12 מ״ר תקני</p>
        </div>

        {/* שטח ממ"ד בפועל */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            שטח ממ״ד בפועל (מ״ר)
          </label>
          <input
            type="number"
            value={buildingInput.mamadSize || ''}
            onChange={(e) => updateField('mamadSize', Number(e.target.value) || undefined)}
            placeholder="12"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-hebrew focus:border-haifa-blue focus:ring-1 focus:ring-haifa-blue outline-none"
          />
          <p className="text-[10px] text-gray-400 font-hebrew mt-0.5">אם &gt; 12, עודף ינוכה</p>
        </div>

        {/* שווי מוערך למ"ר - for Shaked betterment levy */}
        <div>
          <label className="block text-xs text-gray-500 font-hebrew mb-1">
            שווי מוערך למ״ר (₪)
          </label>
          <input
            type="number"
            value={buildingInput.estimatedValuePerSqm || ''}
            onChange={(e) => updateField('estimatedValuePerSqm', Number(e.target.value))}
            placeholder="לא חובה"
            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm font-hebrew focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
          />
          <p className="text-[10px] text-purple-500 font-hebrew mt-0.5">לחישוב היטל השבחה בחלופת שקד</p>
        </div>
      </div>

      {/* Building type and flags */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-hebrew">סוג מבנה:</label>
          <select
            value={buildingInput.buildingType}
            onChange={(e) => updateField('buildingType', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs font-hebrew focus:border-haifa-blue outline-none"
          >
            <option value="multi_family">רב-משפחתי</option>
            <option value="single_family">חד-משפחתי</option>
            <option value="duplex">דו-משפחתי</option>
          </select>
        </div>

        <label className="flex items-center gap-1.5 text-xs font-hebrew cursor-pointer">
          <input
            type="checkbox"
            checked={buildingInput.hasExistingTama38}
            onChange={(e) => updateField('hasExistingTama38', e.target.checked)}
            className="rounded border-gray-300 text-haifa-blue focus:ring-haifa-blue"
          />
          <span className="text-gray-600">מומש תמ״א 38</span>
        </label>

        <label className="flex items-center gap-1.5 text-xs font-hebrew cursor-pointer" title="בניין מגורים בצורת האות H — חישוב פי 3 מהנפח הקיים">
          <input
            type="checkbox"
            checked={buildingInput.isBuildingH || false}
            onChange={(e) => updateField('isBuildingH', e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-600"
          />
          <span className="text-gray-600">מבנה H</span>
        </label>
      </div>
    </div>
  )
}
