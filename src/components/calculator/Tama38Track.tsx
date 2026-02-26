'use client'

import type { Tama38Result } from '@/lib/engine/types'

interface Tama38TrackProps {
  result: Tama38Result
}

export function Tama38Track({ result }: Tama38TrackProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-haifa-blue font-hebrew flex items-center gap-2">
        חישוב זכויות - תמ״א 38 מסלול הריסה ובנייה (מדיניות 2020)
      </h3>

      {/* Section 1: TAMA Policy Areas */}
      <table className="efes-table">
        <thead>
          <tr>
            <th colSpan={2} className="section-header">
              חישוב שטחים בגין מדיניות הריסה ובנייה 2020
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label="קונטור קומה קיימת" value={result.existingContour} />
          <Row label="מספר קומות קיימות" value={result.existingFloors} />
          <Row label="מספר קומות מוצעות" value={result.additionalFloors} />
          <Row label="מס. דירות קיימות בקומה טיפוסית" value={result.existingUnitsPerFloor} />
          <Row label="מס. דירות קיימות" value={result.totalExistingUnits} />
          <Row label={`13.00 מ״ר בגין תמ״א לקומה טיפוסית`} value={result.expandedFloorPerUnit} />
          <tr className="subtotal-row">
            <td>סה״כ קומה טיפוסית מורחבת</td>
            <td className="font-mono text-center">{result.expandedTypicalFloor}</td>
          </tr>
          <Row label="סה״כ קומה טיפוסית מורחבת כמנין קומות מוצעות" value={result.expandedTotal} />
          <Row label={`13.00 מ״ר בגין תמ״א למספר דירות קיימות`} value={result.existingUnitBonus} />
          <Row label="תוספת שטחים בגין קומת עמודים מפולשת" value={result.pilotisArea} />
          <tr className="subtotal-row">
            <td>סה״כ</td>
            <td className="font-mono text-center font-bold">{result.tamaPolicyTotal}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 2: TBE Base Rights */}
      <table className="efes-table">
        <thead>
          <tr>
            <th colSpan={2} className="section-header">
              חישוב שטחים בגין ת.ב.ע
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label="שטח מגרש" value={result.plotArea} />
          <Row label="שטח מגרש לצורכי חישוב שטחים לאחר הפקעה" value={result.plotAreaForCalc} />
          <Row label={`אחוזי בניה ${Math.round(result.buildingPercentage * 100)}%`} value={result.tbeBaseArea} />
          <Row label={`הקלה ${Math.round(result.reliefPercentage * 100)}%`} value={result.tbeRelief} />
          <Row label="בניין תוספת קומה" value={result.tbeBonusFloors || '---'} />
          <tr className="subtotal-row">
            <td>סה״כ לשטח עיקרי</td>
            <td className="font-mono text-center font-bold">{result.tbeTotal}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 3: Combined */}
      <table className="efes-table">
        <tbody>
          <tr className="total-row">
            <td>סה״כ שטח עיקרי ת.מ.א + ת.ב.ע</td>
            <td className="font-mono text-center text-lg">{result.totalPrimaryArea}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 4: Unit Derivation */}
      <table className="efes-table">
        <thead>
          <tr>
            <th colSpan={2} className="section-header">
              גזירת יחידות דיור
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label="שטח דירה ממוצעת" value={result.minApartmentSize} />
          <Row label="גזירת דירות לפי שטח" value={`${result.areaBasedUnitsLow}-${result.areaBasedUnitsHigh}`} />
          {result.densityBasedUnits !== undefined && (
            <Row label={`גזירת דירות לפי צפיפות (${result.buildingInfo.unitsPerDunam} יח״ד/דונם)`} value={result.densityBasedUnits} />
          )}
          <tr className="subtotal-row">
            <td>סה״כ מס.דירות עפ״י מדיניות 2020</td>
            <td className="font-mono text-center font-bold">{result.potentialUnitsLow}-{result.potentialUnitsHigh}</td>
          </tr>
          <Row label="דירות מוחזרות (בעלי זכויות)" value={result.existingUnitsToReturn} />
          <tr className="summary-row">
            <td className="font-hebrew text-xs">דירות מוצעות (יזם)</td>
            <td className="font-mono text-center font-bold">{result.developerUnitsLow}-{result.developerUnitsHigh}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 5: Service Areas */}
      <table className="efes-table">
        <thead>
          <tr>
            <th colSpan={2} className="section-header">
              סיכום חישוב שטחים
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="total-row">
            <td>סה״כ שטח עיקרי בגין ת.ב.ע ות.מ.א</td>
            <td className="font-mono text-center">{result.totalPrimaryArea}</td>
          </tr>
          <Row label="מספר קומות" value={result.numberOfFloors} />
          <Row label={`מס. יחידות דיור עד 15 יח״ד`} value={result.maxUnitsPerFloor} />
          <Row label={`תוספת ${result.mamadPerUnit}.00 מ״ר למר״ד`} value={result.totalMamad} />
          <Row label={`תוספת ${result.balconyPerUnit}.00 מ״ר למרפסת זיזית`} value={result.totalBalcony} />
        </tbody>
      </table>

      {/* Section 6: Summary — Economic Split */}
      <SummaryTable result={result} />

      {/* MAMAD Cap Warning */}
      {result.mamadCapWarning && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm font-hebrew">
          <p className="font-semibold text-amber-800 mb-1">תקרת ממ״ד 12 מ״ר (תקנה 2025)</p>
          <ul className="text-amber-700 text-xs space-y-0.5">
            <li>עודף ממ״ד ליחידה: {result.mamadExcessPerUnit} מ״ר</li>
            <li>סה״כ ניכוי משטח עיקרי ליזם: {result.mamadExcessDeduction} מ״ר</li>
          </ul>
        </div>
      )}

      {/* Section 8: Inclusive Housing */}
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
            <Row label="שיעור דיור מכליל" value={`${Math.round(result.inclusiveHousingRate * 100)}%`} />
            <Row label="יח״ד מכליל" value={result.inclusiveHousingUnits} />
            <Row label="שטח דיור מכליל" value={`${result.inclusiveHousingArea} מ״ר`} />
            <tr className="summary-row">
              <td className="font-hebrew text-xs">דירות שוק ליזם</td>
              <td className="font-mono text-center font-bold">{result.developerMarketableUnits}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

function SummaryTable({ result }: { result: Tama38Result }) {
  return (
    <table className="efes-table">
      <thead>
        <tr>
          <th colSpan={3} className="section-header">
            סיכום: חלוקה כלכלית
          </th>
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
          <td className="font-mono text-center">{result.returnedPrimaryToTenants}</td>
          <td className="font-mono text-center">{result.returnedPaledelToTenants}</td>
        </tr>
        <tr className="text-gray-500">
          <td className="font-hebrew text-[10px] pr-4">מתוכו: ממ״ד מוחזר</td>
          <td className="font-mono text-center text-[10px]">---</td>
          <td className="font-mono text-center text-[10px]">{result.returnedMamadToTenants}</td>
        </tr>
        <tr className="summary-row">
          <td className="font-hebrew text-xs">סה״כ נותר ליזם</td>
          <td className="font-mono text-center font-bold">{result.developerPrimary}</td>
          <td className="font-mono text-center font-bold">{result.developerPaledelet}</td>
        </tr>
        <tr className="total-row">
          <td className="font-hebrew text-xs">סה״כ לפרויקט</td>
          <td className="font-mono text-center">{result.totalPrimaryProject}</td>
          <td className="font-mono text-center">{result.totalPaledelet}</td>
        </tr>
        <tr>
          <td className="font-hebrew text-xs">סה״כ שטחי שירות (ממ״ד + מרפסות)</td>
          <td className="font-mono text-center" colSpan={2}>{result.totalServiceProject}</td>
        </tr>
      </tbody>
    </table>
  )
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <tr>
      <td className="font-hebrew text-xs">{label}</td>
      <td className="font-mono text-center">{value}</td>
    </tr>
  )
}
