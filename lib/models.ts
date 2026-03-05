import ExcelJS from "exceljs"
import type { Participant, ParticipantForRate, ParticipantWithWon, ParticipantWithScore } from "./api"

// Base participant fields (without has_ig_req which is computed)
type ParticipantBaseField = keyof Participant

// Excel column mappings - maps Excel headers to API field names
const EXCEL_TO_API_MAP: Record<string, ParticipantBaseField> = {
  // Spanish headers (sortout specific)
  nombre: "first_name",
  "nombre(s)": "first_name",
  "primer nombre": "first_name",
  apellido: "last_name",
  "apellido(s)": "last_name",
  apellidos: "last_name",
  padron: "census",
  padrón: "census",
  censo: "census",
  carrera: "career",
  // Phone number headers
  "numero de telefono": "phone_number",
  "número de teléfono": "phone_number",
  telefono: "phone_number",
  teléfono: "phone_number",
  celular: "phone_number",
  phone: "phone_number",
  phone_number: "phone_number",
  phonenumber: "phone_number",
  // English headers
  first_name: "first_name",
  firstname: "first_name",
  last_name: "last_name",
  lastname: "last_name",
  census: "census",
  career: "career",
}

// Columns to ignore when processing Excel (not needed for API)
const IGNORED_EXCEL_COLUMNS = new Set([
  "marca temporal",
  "marcatemporal",
  "como te enteraste del sorteo",
  "como te enteraste del sorteo?",
  "comoteenterastedelsorteo",
])

const API_TO_EXCEL_MAP: Record<keyof ParticipantWithWon, string> = {
  first_name: "Nombre",
  last_name: "Apellido",
  census: "Padrón",
  career: "Carrera",
  phone_number: "Teléfono",
  has_won: "Ganador",
}

const API_TO_EXCEL_MAP_SCORE: Record<keyof ParticipantWithScore, string> = {
  first_name: "Nombre",
  last_name: "Apellido",
  census: "Padrón",
  career: "Carrera",
  phone_number: "Teléfono",
  score: "Score",
}

/**
 * Normalizes a header string for comparison
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
}

/**
 * Maps an Excel header to its API field name
 */
function mapExcelHeader(header: string): ParticipantBaseField | null {
  const normalized = normalizeHeader(header)
  
  for (const [excelKey, apiKey] of Object.entries(EXCEL_TO_API_MAP)) {
    if (normalizeHeader(excelKey) === normalized) {
      return apiKey
    }
  }
  
  return null
}

/**
 * Checks if a header is the Instagram column
 */
function isInstagramHeader(header: string): boolean {
  const normalized = normalizeHeader(header)
  return normalized === "instagram" || normalized === "ig"
}

/**
 * Transforms Excel data (generic records) to ParticipantForRate array
 * Handles different column naming conventions
 * Includes has_ig_req based on Instagram column presence and content
 */
export function excelToParticipants(
  excelData: Record<string, unknown>[]
): ParticipantForRate[] {
  if (!excelData || excelData.length === 0) {
    return []
  }

  // Get headers from first row and create mapping
  const headers = Object.keys(excelData[0])
  const headerMapping: Record<string, ParticipantBaseField> = {}
  let instagramHeader: string | null = null

  for (const header of headers) {
    const apiField = mapExcelHeader(header)
    if (apiField) {
      headerMapping[header] = apiField
    }
    // Check for instagram column
    if (isInstagramHeader(header)) {
      instagramHeader = header
    }
  }

  return excelData.map((row) => {
    const participant: Partial<Participant> = {}

    for (const [excelHeader, apiField] of Object.entries(headerMapping)) {
      const value = row[excelHeader]

      if (apiField === "census") {
        // Handle census - can be number or string from Excel
        const numValue = typeof value === "number" ? value : parseInt(String(value), 10)
        participant[apiField] = isNaN(numValue) ? 0 : numValue
      } else {
        participant[apiField] = String(value ?? "").trim()
      }
    }

    // Determine has_ig_req based on instagram column
    let hasIgReq = false
    if (instagramHeader) {
      const igValue = row[instagramHeader]
      hasIgReq = igValue !== null && igValue !== undefined && String(igValue).trim().length > 0
    }

    return {
      first_name: participant.first_name || "",
      last_name: participant.last_name || "",
      census: participant.census || 0,
      career: participant.career || "",
      phone_number: participant.phone_number || "",
      has_ig_req: hasIgReq,
    }
  }).filter((p) => 
    // Filter out invalid participants (must have name, last name, and valid census)
    p.first_name.length > 0 && 
    p.last_name.length > 0 && 
    p.census > 0
  )
}

/**
 * Transforms Excel data to ParticipantWithWon array
 * Used when Excel includes has_won information
 */
export function excelToParticipantsWithWon(
  excelData: Record<string, unknown>[]
): ParticipantWithWon[] {
  const participants = excelToParticipants(excelData)
  
  // Check if has_won column exists
  if (excelData.length === 0) return []
  
  const headers = Object.keys(excelData[0])
  const hasWonHeader = headers.find(h => {
    const normalized = normalizeHeader(h)
    return normalized === "haswon" || normalized === "ganador" || normalized === "ganado"
  })

  return participants.map((participant, index) => {
    let hasWon = false
    
    if (hasWonHeader) {
      const value = excelData[index][hasWonHeader]
      hasWon = value === true || value === "true" || value === 1 || value === "1" || value === "si" || value === "sí"
    }

    return {
      ...participant,
      has_won: hasWon,
    }
  })
}

/**
 * Transforms ParticipantWithWon array to Excel-friendly records
 */
export function participantsToExcel(
  participants: ParticipantWithWon[]
): Record<string, unknown>[] {
  return participants.map((p) => ({
    [API_TO_EXCEL_MAP.first_name]: p.first_name,
    [API_TO_EXCEL_MAP.last_name]: p.last_name,
    [API_TO_EXCEL_MAP.census]: p.census,
    [API_TO_EXCEL_MAP.career]: p.career,
    [API_TO_EXCEL_MAP.phone_number]: p.phone_number,
    [API_TO_EXCEL_MAP.has_won]: p.has_won ? "Sí" : "No",
  }))
}

/**
 * Transforms ParticipantWithScore array to Excel-friendly records
 */
export function scoredParticipantsToExcel(
  participants: ParticipantWithScore[]
): Record<string, unknown>[] {
  return participants.map((p) => ({
    [API_TO_EXCEL_MAP_SCORE.first_name]: p.first_name,
    [API_TO_EXCEL_MAP_SCORE.last_name]: p.last_name,
    [API_TO_EXCEL_MAP_SCORE.census]: p.census,
    [API_TO_EXCEL_MAP_SCORE.career]: p.career,
    [API_TO_EXCEL_MAP_SCORE.phone_number]: p.phone_number,
    [API_TO_EXCEL_MAP_SCORE.score]: p.score,
  }))
}

/**
 * Downloads JSON data as an Excel file
 */
export async function downloadAsExcel(
  data: Record<string, unknown>[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Resultado")

  if (data.length > 0) {
    const headers = Object.keys(data[0])
    
    // Add header row with styling
    const headerRow = worksheet.addRow(headers)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow(headers.map((h) => row[h]))
    })

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 10
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = String(cell.value ?? "").length
        if (cellLength > maxLength) {
          maxLength = Math.min(cellLength, 50)
        }
      })
      column.width = maxLength + 2
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Downloads lottery results as Excel
 */
export async function downloadLotteryResults(
  participants: ParticipantWithWon[],
  filename = "resultado-sorteo.xlsx"
): Promise<void> {
  const excelData = participantsToExcel(participants)
  await downloadAsExcel(excelData, filename)
}

/**
 * Validates that Excel data contains required participant fields
 */
export function validateParticipantData(
  excelData: Record<string, unknown>[]
): { valid: boolean; missingFields: string[] } {
  if (!excelData || excelData.length === 0) {
    return { valid: false, missingFields: ["No hay datos"] }
  }

  const headers = Object.keys(excelData[0])
  const requiredFields: (keyof Participant)[] = ["first_name", "last_name", "census", "career"]
  const mappedFields: Set<keyof Participant> = new Set()

  for (const header of headers) {
    const apiField = mapExcelHeader(header)
    if (apiField) {
      mappedFields.add(apiField)
    }
  }

  const missingFields = requiredFields.filter((f) => !mappedFields.has(f))
  
  return {
    valid: missingFields.length === 0,
    missingFields: missingFields.map((f) => API_TO_EXCEL_MAP[f] || f),
  }
}
