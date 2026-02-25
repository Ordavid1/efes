// ============================================================
// Excel Export - Generates Efes Report as .xlsx download
// Uses exceljs for client-side workbook generation
// ============================================================

import ExcelJS from 'exceljs'
import type {
  Tama38Result,
  ShakedResult,
  Hfp2666Result,
  ParcelId,
  BuildingInput,
} from '../engine/types'

// Color constants matching the app UI
const COLORS = {
  HAIFA_BLUE: '1E3A5F',
  PURPLE: '7C3AED',
  TEAL: '0D9488',
  RED: 'B91C1C',
  GRAY_HEADER: 'E5E7EB',
  GRAY_LIGHT: 'F9FAFB',
  AMBER_LIGHT: 'FFFBEB',
  GREEN_LIGHT: 'F0FDF4',
  WHITE: 'FFFFFF',
}

const FONT_HEBREW = 'Heebo, Arial, sans-serif'

/**
 * Generate an Efes Report Excel workbook
 */
export async function generateEfesExcel(
  tama38: Tama38Result,
  shaked: ShakedResult | null,
  hfp2666: Hfp2666Result | null,
  parcelId: ParcelId,
  buildingInput: BuildingInput
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'מחשבון זכויות בנייה - חיפה'
  workbook.created = new Date()

  // Sheet 1: TAMA 38
  addTama38Sheet(workbook, tama38, parcelId, buildingInput)

  // Sheet 2: Shaked (if available)
  if (shaked) {
    addShakedSheet(workbook, shaked, tama38)
  }

  // Sheet 3: HFP/2666 (if available)
  if (hfp2666 && hfp2666.districtDataAvailable) {
    addHfp2666Sheet(workbook, hfp2666)
  }

  // Sheet 4: Comparison summary
  addComparisonSheet(workbook, tama38, shaked, hfp2666, parcelId)

  return workbook
}

/**
 * Download workbook as .xlsx file in the browser
 */
export async function downloadExcel(
  workbook: ExcelJS.Workbook,
  parcelId: ParcelId
): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `דוח_אפס_גוש_${parcelId.gush}_חלקה_${parcelId.helka}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ========================================
// Sheet Builders
// ========================================

function addTama38Sheet(
  workbook: ExcelJS.Workbook,
  result: Tama38Result,
  parcelId: ParcelId,
  buildingInput: BuildingInput
) {
  const ws = workbook.addWorksheet('תמא 38', {
    views: [{ rightToLeft: true }],
  })

  ws.columns = [
    { width: 45 }, // Labels
    { width: 18 }, // Values
  ]

  // Title
  const titleRow = ws.addRow(['דוח אפס - חישוב זכויות בנייה'])
  styleTitle(titleRow, COLORS.HAIFA_BLUE)
  ws.mergeCells(titleRow.number, 1, titleRow.number, 2)

  // Parcel info
  const infoRow = ws.addRow([`גוש ${parcelId.gush} | חלקה ${parcelId.helka} | שטח מגרש: ${result.plotArea} מ"ר`])
  styleSubtitle(infoRow)
  ws.mergeCells(infoRow.number, 1, infoRow.number, 2)

  ws.addRow([]) // spacer

  // ---- Section 1: TAMA Policy Areas ----
  addSectionHeader(ws, 'חישוב שטחים בגין מדיניות הריסה ובנייה 2020', COLORS.HAIFA_BLUE)
  addDataRow(ws, 'קונטור קומה קיימת', result.existingContour)
  addDataRow(ws, 'מספר קומות קיימות', result.existingFloors)
  addDataRow(ws, 'מספר קומות מוצעות', result.additionalFloors)
  addDataRow(ws, 'מס. דירות קיימות בקומה טיפוסית', result.existingUnitsPerFloor)
  addDataRow(ws, 'מס. דירות קיימות', result.totalExistingUnits)
  addDataRow(ws, '13.00 מ"ר בגין תמ"א לקומה טיפוסית', result.expandedFloorPerUnit)
  addSubtotalRow(ws, 'סה"כ קומה טיפוסית מורחבת', result.expandedTypicalFloor)
  addDataRow(ws, 'סה"כ קומה טיפוסית מורחבת כמנין קומות מוצעות', result.expandedTotal)
  addDataRow(ws, '13.00 מ"ר בגין תמ"א למספר דירות קיימות', result.existingUnitBonus)
  addDataRow(ws, 'תוספת שטחים בגין קומת עמודים מפולשת', result.pilotisArea)
  addTotalRow(ws, 'סה"כ שטחים בגין מדיניות', result.tamaPolicyTotal)

  ws.addRow([]) // spacer

  // ---- Section 2: TBE Base Rights ----
  addSectionHeader(ws, 'חישוב שטחים בגין ת.ב.ע', COLORS.HAIFA_BLUE)
  addDataRow(ws, 'שטח מגרש', result.plotArea)
  addDataRow(ws, 'שטח מגרש לצורכי חישוב שטחים לאחר הפקעה', result.plotAreaForCalc)
  addDataRow(ws, `אחוזי בנייה ${Math.round(result.buildingPercentage * 100)}%`, result.tbeBaseArea)
  addDataRow(ws, `הקלה ${Math.round(result.reliefPercentage * 100)}%`, result.tbeRelief)
  addDataRow(ws, 'בניין תוספת קומה', result.tbeBonusFloors || '---')
  addTotalRow(ws, 'סה"כ לשטח עיקרי', result.tbeTotal)

  ws.addRow([]) // spacer

  // ---- Section 3: Combined ----
  addTotalRow(ws, 'סה"כ שטח עיקרי ת.מ.א + ת.ב.ע', result.totalPrimaryArea, true)

  ws.addRow([]) // spacer

  // ---- Section 4: Unit Derivation ----
  addSectionHeader(ws, 'גזירת יחידות דיור', COLORS.HAIFA_BLUE)
  addDataRow(ws, 'שטח דירה ממוצעת', result.minApartmentSize)
  addDataRow(ws, 'סה"כ מס. דירות עפ"י מדיניות 2020', `${result.potentialUnitsLow}-${result.potentialUnitsHigh}`)
  addDataRow(ws, 'דירות קיימות', result.existingUnitsToReturn)
  addSubtotalRow(ws, 'דירות מוצעות (יזם)', `${result.developerUnitsLow}-${result.developerUnitsHigh}`)

  ws.addRow([]) // spacer

  // ---- Section 5: Service Areas ----
  addSectionHeader(ws, 'סיכום חישוב שטחים', COLORS.HAIFA_BLUE)
  addDataRow(ws, 'סה"כ שטח עיקרי בגין ת.ב.ע ות.מ.א', result.totalPrimaryArea)
  addDataRow(ws, `תוספת ${result.mamadPerUnit}.00 מ"ר לממ"ד`, result.totalMamad)
  addDataRow(ws, `תוספת ${result.balconyPerUnit}.00 מ"ר למרפסת זיזית`, result.totalBalcony)

  ws.addRow([]) // spacer

  // ---- Section 6: Economic Split ----
  addSectionHeader(ws, 'סיכום: חלוקה כלכלית', COLORS.HAIFA_BLUE)
  addDataRow(ws, 'סה"כ החזרת שטח עיקרי לדיירים', result.returnedPrimaryToTenants)
  addDataRow(ws, 'סה"כ החזרת שטח פלדלת לדיירים', result.returnedServiceToTenants)
  addSubtotalRow(ws, 'סה"כ שטח עיקרי נותר ליזם', result.developerPrimary)
  addSubtotalRow(ws, 'סה"כ שטח פלדלת נותר ליזם', result.developerService)
  addTotalRow(ws, 'סה"כ שטח עיקרי לפרויקט', result.totalPrimaryProject)
  addTotalRow(ws, 'סה"כ שטח פלדלת לפרויקט', result.totalServiceProject)

  ws.addRow([]) // spacer

  // Disclaimer
  const disclaimerRow = ws.addRow(['הנתונים להערכה בלבד | אינם מהווים תחליף לייעוץ מקצועי | תמ"א 38 בתוקף עד 18.05.2026'])
  disclaimerRow.getCell(1).font = { size: 9, color: { argb: 'FF999999' }, name: FONT_HEBREW }
  ws.mergeCells(disclaimerRow.number, 1, disclaimerRow.number, 2)

  // Timestamp
  const timeRow = ws.addRow([`נוצר: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL')} | מחשבון זכויות בנייה חיפה`])
  timeRow.getCell(1).font = { size: 8, color: { argb: 'FFAAAAAA' }, name: FONT_HEBREW }
  ws.mergeCells(timeRow.number, 1, timeRow.number, 2)
}

function addShakedSheet(
  workbook: ExcelJS.Workbook,
  result: ShakedResult,
  tama38: Tama38Result
) {
  const ws = workbook.addWorksheet('חלופת שקד', {
    views: [{ rightToLeft: true }],
  })

  ws.columns = [
    { width: 45 },
    { width: 18 },
  ]

  // Title
  const titleRow = ws.addRow(['חלופת שקד - תיקון 139'])
  styleTitle(titleRow, COLORS.PURPLE)
  ws.mergeCells(titleRow.number, 1, titleRow.number, 2)

  ws.addRow([]) // spacer

  // Shaked calculation
  addSectionHeader(ws, 'חישוב שטחים - חלופת שקד', COLORS.PURPLE)
  addDataRow(ws, 'שטח מבנה קיים', result.existingContour * result.existingFloors)
  addDataRow(ws, `מכפיל שקד (${result.shakedMultiplier * 100}%)`, Math.round(result.existingContour * result.existingFloors * result.shakedMultiplier))
  addDataRow(ws, 'זכויות בסיס ת.ב.ע', result.tbeTotal)
  addTotalRow(ws, 'סה"כ שטח עיקרי', result.totalPrimaryArea, true)

  ws.addRow([])

  // Units
  addSectionHeader(ws, 'יחידות דיור', COLORS.PURPLE)
  addDataRow(ws, 'שטח דירה מינימלי', result.minApartmentSize)
  addDataRow(ws, 'סה"כ דירות פוטנציאליות', `${result.potentialUnitsLow}-${result.potentialUnitsHigh}`)
  addDataRow(ws, 'דירות מוחזרות לדיירים', result.existingUnitsToReturn)
  addSubtotalRow(ws, 'דירות יזם', `${result.developerUnitsLow}-${result.developerUnitsHigh}`)

  ws.addRow([])

  // Betterment levy
  addSectionHeader(ws, 'היטל השבחה (חלופת שקד)', COLORS.RED)
  addDataRow(ws, 'שיעור היטל', `${result.bettermentLevyRate * 100}%`)
  addDataRow(ws, 'אומדן היטל השבחה',
    result.bettermentLevyAmount != null
      ? `${result.bettermentLevyAmount.toLocaleString('he-IL')} ₪`
      : 'הזן שווי מ"ר לחישוב'
  )

  ws.addRow([])

  // Comparison
  addSectionHeader(ws, 'השוואה מול תמ"א 38', COLORS.PURPLE)
  addDataRow(ws, 'הפרש שטח', `${result.comparisonVsTama.areaDifference > 0 ? '+' : ''}${result.comparisonVsTama.areaDifference} מ"ר`)
  addDataRow(ws, 'הפרש דירות', `${result.comparisonVsTama.unitsDifference > 0 ? '+' : ''}${result.comparisonVsTama.unitsDifference}`)
}

function addHfp2666Sheet(
  workbook: ExcelJS.Workbook,
  result: Hfp2666Result
) {
  const ws = workbook.addWorksheet('חפ 2666', {
    views: [{ rightToLeft: true }],
  })

  ws.columns = [
    { width: 45 },
    { width: 18 },
  ]

  // Title
  const titleRow = ws.addRow(['חפ/2666 - תוכנית התחדשות בניינית'])
  styleTitle(titleRow, COLORS.TEAL)
  ws.mergeCells(titleRow.number, 1, titleRow.number, 2)

  ws.addRow([])

  // District info
  addSectionHeader(ws, `מתחם ${result.district?.id}: ${result.district?.name}`, COLORS.TEAL)
  addDataRow(ws, 'מכפיל מתחם', result.multiplier != null ? `${(result.multiplier * 100)}%` : '---')
  addDataRow(ws, 'מקסימום קומות', result.district?.maxFloors ?? '---')
  addDataRow(ws, 'צפיפות', result.district?.unitsPerDunam ? `${result.district.unitsPerDunam.join('-')} יח"ד/דונם` : '---')

  ws.addRow([])

  // Calculation
  addSectionHeader(ws, 'חישוב שטחים - חפ/2666 מסלול הריסה ובנייה', COLORS.TEAL)
  addDataRow(ws, 'שטח מגרש', result.plotArea)
  addDataRow(ws, `מכפיל מתחם (${result.multiplier ? `${result.multiplier * 100}%` : '---'})`, result.rawPrimaryArea ?? '---')
  addDataRow(ws, `תקרה לפי קומות (מקס. ${result.district?.maxFloors})`, result.maxByFloors ?? '---')
  addDataRow(ws, 'תקרה לפי צפיפות (יח"ד/דונם)', result.maxByDensity ?? '---')
  addTotalRow(ws, 'סה"כ שטח עיקרי סופי', result.finalPrimaryArea ?? '---', true)

  ws.addRow([])

  // Units
  addDataRow(ws, 'דירות פוטנציאליות', result.potentialUnitsLow != null ? `${result.potentialUnitsLow}-${result.potentialUnitsHigh}` : '---')
  addDataRow(ws, 'דירות מוחזרות לדיירים', result.existingUnitsToReturn)
  addSubtotalRow(ws, 'דירות יזם', result.developerUnitsLow != null ? `${result.developerUnitsLow}-${result.developerUnitsHigh}` : '---')

  ws.addRow([])

  // Split
  addSectionHeader(ws, 'סיכום חלוקה', COLORS.TEAL)
  addDataRow(ws, 'שטח עיקרי מוחזר לדיירים', result.returnedPrimaryToTenants)
  addSubtotalRow(ws, 'שטח עיקרי נותר ליזם', result.developerPrimary ?? '---')
}

function addComparisonSheet(
  workbook: ExcelJS.Workbook,
  tama38: Tama38Result,
  shaked: ShakedResult | null,
  hfp2666: Hfp2666Result | null,
  parcelId: ParcelId
) {
  const ws = workbook.addWorksheet('השוואה', {
    views: [{ rightToLeft: true }],
  })

  ws.columns = [
    { width: 30 }, // Labels
    { width: 18 }, // TAMA 38
    { width: 18 }, // Shaked
    { width: 18 }, // HFP/2666
  ]

  // Title
  const titleRow = ws.addRow(['דוח אפס השוואתי'])
  styleTitle(titleRow, COLORS.HAIFA_BLUE)
  ws.mergeCells(titleRow.number, 1, titleRow.number, 4)

  const infoRow = ws.addRow([`גוש ${parcelId.gush} | חלקה ${parcelId.helka}`])
  styleSubtitle(infoRow)
  ws.mergeCells(infoRow.number, 1, infoRow.number, 4)

  ws.addRow([])

  // Header row
  const headerRow = ws.addRow(['נתון', 'תמ"א 38', 'חלופת שקד', 'חפ/2666'])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: FONT_HEBREW }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.HAIFA_BLUE}` } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder()
  })
  headerRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }

  const fmt = (n: number | null | undefined) => n != null ? n : '---'
  const fmtRange = (low: number | null | undefined, high: number | null | undefined) =>
    low != null && high != null ? `${low}-${high}` : '---'

  // Data rows
  addCompRow(ws, 'סה"כ שטח עיקרי (מ"ר)',
    fmt(tama38.totalPrimaryArea),
    fmt(shaked?.totalPrimaryArea),
    fmt(hfp2666?.finalPrimaryArea)
  )
  addCompRow(ws, 'דירות פוטנציאליות',
    fmtRange(tama38.potentialUnitsLow, tama38.potentialUnitsHigh),
    fmtRange(shaked?.potentialUnitsLow, shaked?.potentialUnitsHigh),
    fmtRange(hfp2666?.potentialUnitsLow, hfp2666?.potentialUnitsHigh)
  )
  addCompRow(ws, 'דירות יזם',
    fmtRange(tama38.developerUnitsLow, tama38.developerUnitsHigh),
    fmtRange(shaked?.developerUnitsLow, shaked?.developerUnitsHigh),
    fmtRange(hfp2666?.developerUnitsLow, hfp2666?.developerUnitsHigh)
  )
  addCompRow(ws, 'שטח עיקרי ליזם (מ"ר)',
    fmt(tama38.developerPrimary),
    fmt(shaked?.developerPrimary),
    fmt(hfp2666?.developerPrimary),
    true
  )
  addCompRow(ws, 'שטח ממ"ד כולל (מ"ר)',
    fmt(tama38.totalMamad),
    fmt(shaked?.totalMamad),
    fmt(hfp2666?.totalMamad)
  )
  addCompRow(ws, 'שטח מרפסות כולל (מ"ר)',
    fmt(tama38.totalBalcony),
    fmt(shaked?.totalBalcony),
    fmt(hfp2666?.totalBalcony)
  )
  addCompRow(ws, 'היטל השבחה',
    'פטור',
    shaked?.bettermentLevyAmount != null ? `${shaked.bettermentLevyAmount.toLocaleString('he-IL')} ₪` : '---',
    'לפי תוכנית'
  )

  ws.addRow([])

  // Disclaimer
  const disclaimerRow = ws.addRow(['הנתונים להערכה בלבד | אינם מהווים תחליף לייעוץ מקצועי'])
  disclaimerRow.getCell(1).font = { size: 9, color: { argb: 'FF999999' }, name: FONT_HEBREW }
  ws.mergeCells(disclaimerRow.number, 1, disclaimerRow.number, 4)

  const timeRow = ws.addRow([`נוצר: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL')} | מחשבון זכויות בנייה חיפה`])
  timeRow.getCell(1).font = { size: 8, color: { argb: 'FFAAAAAA' }, name: FONT_HEBREW }
  ws.mergeCells(timeRow.number, 1, timeRow.number, 4)
}

// ========================================
// Row Helpers
// ========================================

function addSectionHeader(ws: ExcelJS.Worksheet, text: string, color: string) {
  const row = ws.addRow([text])
  row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: FONT_HEBREW }
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } }
  row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } }
  row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
  row.getCell(1).border = thinBorder()
  row.getCell(2).border = thinBorder()
  ws.mergeCells(row.number, 1, row.number, 2)
}

function addDataRow(ws: ExcelJS.Worksheet, label: string, value: number | string) {
  const row = ws.addRow([label, value])
  row.getCell(1).font = { size: 10, name: FONT_HEBREW }
  row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
  row.getCell(2).font = { size: 10, name: FONT_HEBREW }
  row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  row.getCell(1).border = thinBorder()
  row.getCell(2).border = thinBorder()
}

function addSubtotalRow(ws: ExcelJS.Worksheet, label: string, value: number | string) {
  const row = ws.addRow([label, value])
  row.getCell(1).font = { bold: true, size: 10, name: FONT_HEBREW }
  row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.GRAY_HEADER}` } }
  row.getCell(2).font = { bold: true, size: 10, name: FONT_HEBREW }
  row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.GRAY_HEADER}` } }
  row.getCell(1).border = thinBorder()
  row.getCell(2).border = thinBorder()
}

function addTotalRow(ws: ExcelJS.Worksheet, label: string, value: number | string, highlight = false) {
  const row = ws.addRow([label, value])
  const bgColor = highlight ? COLORS.GREEN_LIGHT : COLORS.GRAY_LIGHT
  row.getCell(1).font = { bold: true, size: 11, name: FONT_HEBREW }
  row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } }
  row.getCell(2).font = { bold: true, size: 12, name: FONT_HEBREW }
  row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } }
  row.getCell(1).border = thinBorder()
  row.getCell(2).border = thinBorder()
}

function addCompRow(
  ws: ExcelJS.Worksheet,
  label: string,
  tama: number | string,
  shaked: number | string,
  hfp: number | string,
  highlight = false
) {
  const row = ws.addRow([label, tama, shaked, hfp])
  const bgColor = highlight ? COLORS.GREEN_LIGHT : COLORS.WHITE
  row.eachCell((cell, colNumber) => {
    cell.font = {
      size: 10,
      bold: highlight,
      name: FONT_HEBREW,
    }
    cell.alignment = {
      horizontal: colNumber === 1 ? 'right' : 'center',
      vertical: 'middle',
    }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } }
    cell.border = thinBorder()
  })
}

// ========================================
// Style Helpers
// ========================================

function styleTitle(row: ExcelJS.Row, color: string) {
  row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }, name: FONT_HEBREW }
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } }
  row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  row.height = 30
}

function styleSubtitle(row: ExcelJS.Row) {
  row.getCell(1).font = { size: 11, color: { argb: 'FF555555' }, name: FONT_HEBREW }
  row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.GRAY_LIGHT}` } }
}

function thinBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  }
}
