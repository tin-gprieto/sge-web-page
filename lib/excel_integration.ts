import ExcelJS from "exceljs"
import type { ParticipantForRate, ParticipantWithWon, ParticipantWithScore, ParticipantForInsert } from "./api"

// Fields that can be read from Excel for rate requests
type RateRequestField = "census" | "document" | "career" | "phone_number"

// Fields that can be read from Excel for insert requests (includes names)
type InsertRequestField = "census" | "document" | "career" | "phone_number" | "first_name" | "last_name" | "has_won"

// Excel column mappings - maps Excel headers to API field names
const EXCEL_TO_RATE_REQUEST_MAP: Record<string, RateRequestField> = {
    // Census/padron headers
    padron: "census",
    padrón: "census",
    censo: "census",
    census: "census",
    // Document/DNI headers
    documento: "document",
    dni: "document",
    document: "document",
    "tipo_nro_documento": "document",
    // Career headers
    carrera: "career",
    career: "career",
    // Phone number headers
    "numero de telefono": "phone_number",
    "número de teléfono": "phone_number",
    telefono: "phone_number",
    teléfono: "phone_number",
    celular: "phone_number",
    phone: "phone_number",
    phone_number: "phone_number",
    phonenumber: "phone_number",
}

// Excel column mappings for insert requests (includes name fields)
const EXCEL_TO_INSERT_REQUEST_MAP: Record<string, InsertRequestField> = {
    ...EXCEL_TO_RATE_REQUEST_MAP,
    // First name headers
    nombre: "first_name",
    "nombre(s)": "first_name",
    "primer nombre": "first_name",
    first_name: "first_name",
    firstname: "first_name",
    nombres: "first_name",
    // Last name headers
    apellido: "last_name",
    "apellido(s)": "last_name",
    apellidos: "last_name",
    last_name: "last_name",
    lastname: "last_name",
    // CSV variant
    Apelido: "last_name",
    // Ganador column (for boolean mapping)
    Ganador: "has_won",
}

// Columns to ignore when processing Excel (not needed for API)
const IGNORED_EXCEL_COLUMNS = new Set([
    "marca temporal",
    "marcatemporal",
    "como te enteraste del sorteo",
    "como te enteraste del sorteo?",
    "comoteenterastedelsorteo",
])

// Excel export map for response types (these have first_name/last_name from server)
const API_TO_EXCEL_MAP: Record<keyof Omit<ParticipantWithWon, "document">, string> = {
    first_name: "Nombre",
    last_name: "Apellido",
    census: "Padrón",
    career: "Carrera",
    phone_number: "Teléfono",
    has_won: "Ganador",
}

const API_TO_EXCEL_MAP_SCORE: Record<keyof Omit<ParticipantWithScore, "document">, string> = {
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
        .replace(/\s+/g, "") // Remove all whitespace
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width/invisible chars
        .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
}

/**
 * Maps an Excel header to its API field name for rate requests
 */
function mapExcelHeader(header: string): RateRequestField | null {
    const normalized = normalizeHeader(header)

    for (const [excelKey, apiKey] of Object.entries(EXCEL_TO_RATE_REQUEST_MAP)) {
        if (normalizeHeader(excelKey) === normalized) {
            return apiKey
        }
    }

    return null
}

/**
 * Maps an Excel header to its API field name for insert requests (includes name fields)
 */
function mapExcelHeaderForInsert(header: string): InsertRequestField | null {
    const normalized = normalizeHeader(header)

    for (const [excelKey, apiKey] of Object.entries(EXCEL_TO_INSERT_REQUEST_MAP)) {
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
 * Note: first_name/last_name are NOT included - they come from FIUBA DB
 */
export function excelToParticipants(
    excelData: Record<string, unknown>[]
): ParticipantForRate[] {
    if (!excelData || excelData.length === 0) {
        return []
    }

    // Get headers from first row and create mapping
    // Use insert mapping (which includes name fields) to also capture first_name/last_name
    const headers = Object.keys(excelData[0])
    const headerMapping: Record<string, InsertRequestField> = {}
    let instagramHeader: string | null = null

    for (const header of headers) {
        const apiField = mapExcelHeaderForInsert(header)
        if (apiField) {
            headerMapping[header] = apiField
        }
        // Check for instagram column
        if (isInstagramHeader(header)) {
            instagramHeader = header
        }
    }

    return excelData.map((row) => {
        const participant: Partial<ParticipantForRate & { first_name?: string; last_name?: string }> = {}

        for (const [excelHeader, apiField] of Object.entries(headerMapping)) {
            const value = row[excelHeader]

            if (apiField === "census" || apiField === "document") {
                // Handle numeric fields - can be number or string from Excel
                // Also handle "DNI12345678" format from tipo_nro_documento column
                let numValue: number
                if (typeof value === "number") {
                    numValue = value
                } else {
                    const strValue = String(value ?? "").trim()
                    // Remove "DNI" prefix if present (case-insensitive)
                    const cleanedValue = strValue.replace(/^dni/i, "").trim()
                    numValue = parseInt(cleanedValue, 10)
                }
                if (!isNaN(numValue) && numValue > 0) {
                    participant[apiField] = numValue
                }
            } else if (apiField === "first_name" || apiField === "last_name") {
                // Extract name fields as fallback for FIUBA
                const strValue = String(value ?? "").trim()
                if (strValue) {
                    participant[apiField] = strValue
                }
            } else if (apiField === "career" || apiField === "phone_number") {
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
            census: participant.census || 0,
            document: participant.document, // Optional - may be undefined
            first_name: participant.first_name, // Optional fallback for FIUBA
            last_name: participant.last_name, // Optional fallback for FIUBA
            career: participant.career || "",
            phone_number: participant.phone_number || "",
            has_ig_req: hasIgReq,
        }
    }).filter((p) =>
        // Filter out invalid participants (must have valid census OR document)
        p.census > 0 || (p.document !== undefined && p.document > 0)
    )
}

/**
 * Finds the "Ganador" header in Excel data
 */
function findGanadorHeader(headers: string[]): string | undefined {
    return headers.find(h => {
        const normalized = normalizeHeader(h)
        return normalized === "haswon" || normalized === "ganador" || normalized === "ganado"
    })
}

/**
 * Parses has_won value from Excel
 * "Si", "Sí", TRUE → true
 * "No", FALSE → false
 */
function parseHasWon(value: unknown): boolean {
    if (value === true || value === "TRUE" || value === "true") return true
    if (value === false || value === "FALSE" || value === "false") return false

    if (typeof value === "string") {
        const normalized = value.toLowerCase().trim()
        if (normalized === "si" || normalized === "sí") return true
        if (normalized === "no") return false
    }

    return false
}

/**
 * Transforms Excel data to ParticipantForInsert array
 * Used when Excel includes has_won information for the /insert endpoint
 * Only requires "padron" (or "documento") and "Ganador" columns
 * Includes first_name/last_name as fallback if not found in FIUBA
 */
export function excelToParticipantsWithWon(
    excelData: Record<string, unknown>[]
): ParticipantForInsert[] {
    if (!excelData || excelData.length === 0) return []

    // Get headers from first row and create mapping (use insert mapping with names)
    const headers = Object.keys(excelData[0])
    const headerMapping: Record<string, InsertRequestField> = {}
    const unmappedHeaders: string[] = []
    const ganadorHeader = findGanadorHeader(headers)

    for (const header of headers) {
        const apiField = mapExcelHeaderForInsert(header)
        if (apiField) {
            headerMapping[header] = apiField
        } else {
            unmappedHeaders.push(header)
        }
    }
    if (unmappedHeaders.length > 0) {
        // eslint-disable-next-line no-console
        console.warn("Unmapped Excel headers:", unmappedHeaders)
    }

    return excelData.map((row) => {
        const participant: Partial<ParticipantForInsert> = {}

        for (const [excelHeader, apiField] of Object.entries(headerMapping)) {
            const value = row[excelHeader]

            if (apiField === "census" || apiField === "document") {
                // Handle numeric fields - can be number or string from Excel
                // Also handle "DNI12345678" format from tipo_nro_documento column
                let numValue: number
                if (typeof value === "number") {
                    numValue = value
                } else {
                    const strValue = String(value ?? "").trim()
                    // Remove "DNI" prefix if present (case-insensitive)
                    const cleanedValue = strValue.replace(/^dni/i, "").trim()
                    numValue = parseInt(cleanedValue, 10)
                }
                if (!isNaN(numValue) && numValue > 0) {
                    participant[apiField] = numValue
                }
            } else if (apiField === "first_name" || apiField === "last_name") {
                // Handle name fields - include if non-empty
                const strValue = String(value ?? "").trim()
                if (strValue) {
                    participant[apiField] = strValue
                }
            } else if (apiField !== "has_won") {
                // career, phone_number — has_won is handled separately via ganadorHeader
                participant[apiField] = String(value ?? "").trim()
            }
        }

        // Parse has_won from Ganador column
        const hasWon = ganadorHeader ? parseHasWon(row[ganadorHeader]) : false

        return {
            // Only include census/document if they have valid values (> 0)
            // Backend requires at least one to identify the participant
            ...(participant.census && participant.census > 0 ? { census: participant.census } : {}),
            ...(participant.document && participant.document > 0 ? { document: participant.document } : {}),
            // Include first_name/last_name as fallback for FIUBA
            ...(participant.first_name ? { first_name: participant.first_name } : {}),
            ...(participant.last_name ? { last_name: participant.last_name } : {}),
            // Include career/phone_number only if provided (optional for update flows)
            ...(participant.career ? { career: participant.career } : {}),
            ...(participant.phone_number ? { phone_number: participant.phone_number } : {}),
            has_won: hasWon,
        }
    }).filter((p) =>
        // Filter out participants without valid census or document
        (p.census !== undefined && p.census > 0) || (p.document !== undefined && p.document > 0)
    )
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
 * Validates that Excel data contains required participant fields for rate request
 * Required: census (or document), career
 * Note: first_name/last_name are NOT required - they come from FIUBA DB
 */
export function validateParticipantData(
    excelData: Record<string, unknown>[]
): { valid: boolean; missingFields: string[] } {
    if (!excelData || excelData.length === 0) {
        return { valid: false, missingFields: ["No hay datos"] }
    }

    const headers = Object.keys(excelData[0])
    const missingFields: string[] = []
    const mappedFields: Set<RateRequestField> = new Set()

    for (const header of headers) {
        const apiField = mapExcelHeader(header)
        if (apiField) {
            mappedFields.add(apiField)
        }
    }

    // Check for census or document (at least one is required)
    const hasCensusOrDoc = mappedFields.has("census") || mappedFields.has("document")
    if (!hasCensusOrDoc) {
        missingFields.push("Padrón o Documento")
    }

    // Career is required
    if (!mappedFields.has("career")) {
        missingFields.push("Carrera")
    }

    return {
        valid: missingFields.length === 0,
        missingFields,
    }
}

/**
 * Validates that Excel data contains required fields for update page
 * Only requires "padron" (or "documento") and "Ganador" columns
 */
export function validateParticipantDataForUpdate(
    excelData: Record<string, unknown>[]
): { valid: boolean; missingFields: string[] } {
    if (!excelData || excelData.length === 0) {
        return { valid: false, missingFields: ["No hay datos"] }
    }

    const headers = Object.keys(excelData[0])
    const missingFields: string[] = []

    // Check for census/padron or document column (at least one is required)
    const hasCensus = headers.some(h => mapExcelHeader(h) === "census")
    const hasDocument = headers.some(h => mapExcelHeader(h) === "document")
    if (!hasCensus && !hasDocument) {
        missingFields.push("Padrón o Documento")
    }

    // Check for ganador column
    const hasGanador = headers.some(h => {
        const normalized = normalizeHeader(h)
        return normalized === "haswon" || normalized === "ganador" || normalized === "ganado"
    })
    if (!hasGanador) {
        missingFields.push("Ganador")
    }

    return {
        valid: missingFields.length === 0,
        missingFields,
    }
}
