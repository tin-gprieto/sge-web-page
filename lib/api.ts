const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

// Types

// Cuatrimestre of an expedition (1C or 2C). Backend defaults to "1C" when omitted.
export type Cuatrimestre = "1C" | "2C"

// Base participant info from FIUBA DB (returned in responses)
export interface Participant {
  first_name: string
  last_name: string
  census: number
  career: string
  phone_number: string
}

// Participant with document field (returned in rate/lottery/insert responses)
export interface ParticipantWithDocument extends Participant {
  document?: number
}

// Participant for rate request (sent to API - no first_name/last_name)
export interface ParticipantForRate {
  census: number
  document?: number
  first_name?: string
  last_name?: string
  career: string
  phone_number: string
  has_ig_req: boolean
}

// Response from rate endpoint
export interface ParticipantWithScore extends ParticipantWithDocument {
  score: number
}

// Participant for lottery request (sent to API - includes score)
export interface ParticipantForLottery {
  census: number
  document?: number
  career: string
  phone_number: string
  score: number
}

// Response from lottery endpoint
export interface ParticipantWithWon extends ParticipantWithDocument {
  has_won: boolean
}

// Participant for insert request (sent to API - includes has_won)
// Backend requires at least one of census or document to identify the participant
// first_name and last_name are optional fallback if not found in FIUBA
// career and phone_number are optional for update flows
export interface ParticipantForInsert {
  census?: number
  document?: number
  first_name?: string
  last_name?: string
  career?: string
  phone_number?: string
  has_won: boolean
}

// Participant returned in insert response
export interface InsertedParticipant {
  first_name: string
  last_name: string
  census: number
  career: string
  has_won: boolean
}

// Expedition participant (GET /expedition response - no phone_number)
export interface ExpeditionParticipant {
  first_name: string
  last_name: string
  census: number
  career: string
  has_won: boolean
}

// Expedition participant across all years (GET /expedition/participants response - includes year)
export interface ExpeditionParticipantWithYear extends ExpeditionParticipant {
  year: number
}

export interface ExpeditionAllYearsResponse {
  list: ExpeditionParticipantWithYear[]
}

export interface ExpeditionHistory {
  expedition: string
  year: number
  has_won: boolean
}

export interface ParticipantResponse {
  participant: Participant
  historial: ExpeditionHistory[]
}

export interface RateRequest {
  expedition: string
  year: number
  cuatrimestre?: Cuatrimestre
  list: ParticipantForRate[]
}

export interface RateResponse {
  list: ParticipantWithScore[]
}

export interface LotteryRequest {
  count: number
  expedition: string
  year: number
  cuatrimestre?: Cuatrimestre
  list: ParticipantForLottery[]
}

export interface LotteryResponse {
  list: ParticipantWithWon[]
}

export interface InsertRequest {
  expedition: string
  year: number
  cuatrimestre?: Cuatrimestre
  list: ParticipantForInsert[]
}

export interface InsertResponse {
  inserted: number
  repeated: number
  skipped: number
  total: number
  list: InsertedParticipant[]
}

export interface ExpeditionRequest {
  expedition: string
  year: number
}

export interface ExpeditionResponse {
  list: ExpeditionParticipant[]
}

export interface Expedition {
  id: number
  name: string
}

export interface ExpeditionListResponse {
  list: Expedition[]
}

export interface ExpeditionHistorialItem {
  name: string
  year: number
  cuatrimestre: Cuatrimestre
}

export interface ExpeditionHistorialResponse {
  list: ExpeditionHistorialItem[]
}

// A single field-level validation error, as returned by FastAPI's 422 responses
export interface ApiValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

// The backend's centralized error handler wraps most non-422 errors (400/403/409/500)
// in an object like { error: "Conflicto", mensaje: "..." } rather than a plain string.
export interface ApiStructuredErrorDetail {
  error?: string
  mensaje?: string
  [key: string]: unknown
}

export interface ApiErrorResponse {
  detail: string | ApiValidationErrorItem[] | ApiStructuredErrorDetail
}

// Human-friendly labels for fields that show up in validation error paths
const FIELD_LABELS: Record<string, string> = {
  phone_number: "Teléfono",
  career: "Carrera",
  census: "Padrón",
  document: "Documento",
  first_name: "Nombre",
  last_name: "Apellido",
  expedition: "Expedición",
  year: "Año",
  cuatrimestre: "Cuatrimestre",
  count: "Cantidad de ganadores",
}

// Translates common Pydantic validation messages into short Spanish phrases
function humanizeValidationMessage(msg: string): string {
  if (/^field required$/i.test(msg)) return "es obligatorio"
  if (/at least 1 character/i.test(msg)) return "no puede estar vacío"
  if (/valid integer/i.test(msg)) return "debe ser un número entero válido"
  if (/valid number/i.test(msg)) return "debe ser un número válido"
  if (/greater than 0/i.test(msg)) return "debe ser mayor a 0"
  return msg
}

/**
 * Turns a FastAPI 422 `detail` array into a short, actionable Spanish message.
 * Groups repeated field errors (e.g. a column missing from every row of an
 * uploaded Excel) into one line instead of dumping one entry per participant.
 */
function formatValidationErrors(items: ApiValidationErrorItem[]): string {
  const groups = new Map<string, { label: string; message: string; count: number }>()

  for (const item of items) {
    const fieldSegment = [...item.loc].reverse().find(seg => typeof seg === "string" && seg !== "body")
    const field = typeof fieldSegment === "string" ? fieldSegment : "datos"
    const label = FIELD_LABELS[field] ?? field
    const message = humanizeValidationMessage(item.msg)
    const key = `${field}:${message}`

    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
    } else {
      groups.set(key, { label, message, count: 1 })
    }
  }

  return Array.from(groups.values())
    .map(({ label, message, count }) =>
      count > 1 ? `${label} ${message} (${count} filas)` : `${label} ${message}`
    )
    .join(" · ")
}

/**
 * Resolves a backend error `detail` field into a single readable string,
 * regardless of which of the three shapes the backend used for it:
 * a plain string, a FastAPI 422 validation-error array, or the backend's
 * own { error, mensaje } structured error object.
 */
function resolveErrorDetail(rawDetail: unknown): string | undefined {
  if (typeof rawDetail === "string") return rawDetail

  if (Array.isArray(rawDetail)) {
    return formatValidationErrors(rawDetail as ApiValidationErrorItem[])
  }

  if (rawDetail && typeof rawDetail === "object") {
    const { mensaje, error } = rawDetail as ApiStructuredErrorDetail
    if (typeof mensaje === "string" && mensaje) return mensaje
    if (typeof error === "string" && error) return error
  }

  return undefined
}

/**
 * Custom error class for API errors with HTTP status code
 */
export class ApiError extends Error {
  status: number
  statusText: string

  constructor(message: string, status: number, statusText: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.statusText = statusText
  }

  /**
   * Check if error is a specific HTTP status
   */
  is(status: number): boolean {
    return this.status === status
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500
  }

  /**
   * Check if error is unauthorized (401)
   */
  isUnauthorized(): boolean {
    return this.status === 401
  }

  /**
   * Check if error is forbidden (403)
   */
  isForbidden(): boolean {
    return this.status === 403
  }

  /**
   * Check if error is not found (404)
   */
  isNotFound(): boolean {
    return this.status === 404
  }

  /**
   * Check if error is validation error (400/422)
   */
  isValidationError(): boolean {
    return this.status === 400 || this.status === 422
  }

  /**
   * Check if error is rate limited (429)
   */
  isRateLimited(): boolean {
    return this.status === 429
  }
}

/**
 * Get user-friendly error message based on status code
 */
function getErrorMessage(status: number, detail?: string): string {
  if (detail) return detail

  switch (status) {
    case 400:
      return "Datos inválidos en la solicitud"
    case 401:
      return "No autorizado. Por favor inicia sesión"
    case 403:
      return "Acceso denegado"
    case 404:
      return "Recurso no encontrado"
    case 409:
      return "Conflicto: la operación no se puede completar en el estado actual"
    case 422:
      return "Error de validación en los datos"
    case 429:
      return "Demasiadas solicitudes. Intenta más tarde"
    case 500:
      return "Error interno del servidor"
    case 502:
      return "Servidor no disponible"
    case 503:
      return "Servicio temporalmente no disponible"
    default:
      return `Error en la solicitud (${status})`
  }
}

// Helper function for API calls
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { credentials, headers, ...restOptions } = options

  let response: Response
  try {
    response = await fetch(url, {
      ...restOptions,
      credentials: credentials ?? "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })
  } catch (networkError) {
    // Network error (no connection, DNS failure, etc.)
    throw new ApiError(
      "Error de conexión. Verifica tu conexión a internet",
      0,
      "Network Error"
    )
  }

  // Try to parse response as JSON
  let data: unknown
  try {
    data = await response.json()
  } catch {
    // Response is not JSON
    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(response.status),
        response.status,
        response.statusText
      )
    }
    // If response is OK but not JSON, return empty object (shouldn't happen normally)
    data = {}
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("API Response:", response.status, data)
  }

  if (!response.ok) {
    const rawDetail = (data as ApiErrorResponse)?.detail
    const errorDetail = resolveErrorDetail(rawDetail)
    const errorMessage = getErrorMessage(response.status, errorDetail)
    throw new ApiError(errorMessage, response.status, response.statusText)
  }

  return data as T
}

/**
 * Health check - verifies service availability
 * GET /health
 */
export async function healthCheck(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>("/health")
}

/**
 * Get expedition participants
 * GET /expedition
 */
export async function getExpeditionParticipants(
  expedition: string,
  year: number
): Promise<ExpeditionResponse> {
  const params = new URLSearchParams({ expedition, year: year.toString() })
  return apiRequest<ExpeditionResponse>(`/expedition?${params}`)
}

/**
 * Get expedition participants across all years
 * GET /expedition/participants
 */
export async function getExpeditionParticipantsAllYears(
  expedition: string
): Promise<ExpeditionAllYearsResponse> {
  const params = new URLSearchParams({ expedition })
  return apiRequest<ExpeditionAllYearsResponse>(`/expedition/participants?${params}`)
}

/**
 * Get participant by name
 * GET /participant
 */
export async function getParticipantByName(
  firstName: string,
  lastName: string
): Promise<ParticipantResponse> {
  const params = new URLSearchParams({ first_name: firstName, last_name: lastName })
  return apiRequest<ParticipantResponse>(`/participant?${params}`)
}

/**
 * Get participant by census number
 * GET /participant/census
 */
export async function getParticipantByCensus(
  census: number
): Promise<ParticipantResponse> {
  const params = new URLSearchParams({ census: census.toString() })
  return apiRequest<ParticipantResponse>(`/participant/census?${params}`)
}

/**
 * Rate participants - calculates probability scores
 * POST /rate
 */
export async function rateParticipants(
  request: RateRequest
): Promise<RateResponse> {
  return apiRequest<RateResponse>("/rate", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

/**
 * Execute lottery - returns participants with has_won flag
 * POST /lottery
 */
export async function executeLottery(
  request: LotteryRequest
): Promise<LotteryResponse> {
  return apiRequest<LotteryResponse>("/lottery", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

/**
 * Insert participants - inserts or updates participants and expedition history
 * POST /insert
 */
export async function insertParticipants(
  request: InsertRequest
): Promise<InsertResponse> {
  return apiRequest<InsertResponse>("/insert", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

/**
 * Get list of expeditions
 * GET /expedition/list
 */
export async function getExpeditionList(): Promise<ExpeditionListResponse> {
  return apiRequest<ExpeditionListResponse>("/expedition/list", {
    method: "GET",
  })
}

/**
 * Get expedition historial - returns all unique (expedition, year) pairs that have been executed
 * GET /expedition/historial
 */
export async function getExpeditionHistorial(): Promise<ExpeditionHistorialResponse> {
  return apiRequest<ExpeditionHistorialResponse>("/expedition/historial", {
    method: "GET",
  })
}

// All participants response
export interface AllParticipant {
  first_name: string
  last_name: string
  census: number | null
  career: string
}

export interface AllParticipantsResponse {
  list: AllParticipant[]
}

/**
 * Get all participants
 * GET /participants
 */
export async function getAllParticipants(): Promise<AllParticipantsResponse> {
  return apiRequest<AllParticipantsResponse>("/participants", {
    method: "GET",
  })
}

/**
 * Create a new expedition
 * POST /expedition
 */
export async function createExpedition(
  name: string
): Promise<Expedition> {
  return apiRequest<Expedition>("/expedition", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

// Schedule Microservice Types
export interface Career {
  career_id: number
  career: string
}

export interface CareersResponse {
  list: Career[]
}

export interface AvailabilityEntry {
  person: string
  day: string
  starts_at: number
  finishes_at: number
  build: string
}

export interface AvailabilityResponse {
  list: AvailabilityEntry[]
}

export interface Subject {
  subject: string
  course: string
  curse_type: string
  day: string
  starts_at: number
  room: string
  build: string
}

export interface SubjectsResponse {
  list: Subject[]
}

export interface ScheduleRequest {
  career_id: number
  course_type: string[]
  build: string | null
  min_responsibles: number
}

export interface ScheduledClass extends Subject {
  responsibles: string[]
}

export interface ScheduleResponse {
  list: ScheduledClass[]
}

/**
 * Get list of careers
 * GET /careers
 */
export async function getCareers(): Promise<CareersResponse> {
  return apiRequest<CareersResponse>("/careers", {
    method: "GET",
  })
}

/**
 * Get availability
 * GET /availability
 */
export async function getAvailability(build?: string): Promise<AvailabilityResponse> {
  const params = new URLSearchParams()
  if (build) params.append("build", build)
  const queryString = params.toString()
  const endpoint = queryString ? `/availability?${queryString}` : "/availability"
  return apiRequest<AvailabilityResponse>(endpoint, {
    method: "GET",
  })
}

/**
 * Get subjects for a career
 * GET /subjects
 */
export async function getSubjects(careerId: number): Promise<SubjectsResponse> {
  const params = new URLSearchParams({ career_id: careerId.toString() })
  return apiRequest<SubjectsResponse>(`/subjects?${params}`, {
    method: "GET",
  })
}

/**
 * Calculate schedule
 * POST /schedule
 */
export async function calculateSchedule(
  request: ScheduleRequest
): Promise<ScheduleResponse> {
  return apiRequest<ScheduleResponse>("/schedule", {
    method: "POST",
    body: JSON.stringify(request),
  })
}
