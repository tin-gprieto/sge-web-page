const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

// Types
export interface Participant {
  first_name: string
  last_name: string
  census: number
  career: string
  phone_number: string
}

// Participant with Instagram requirement (only for rate request)
export interface ParticipantForRate extends Participant {
  has_ig_req: boolean
}

export interface ParticipantWithScore extends Participant {
  score: number
}

export interface ParticipantWithWon extends Participant {
  has_won: boolean
}

export interface ExpeditionHistory {
  expedition: string
  year: number
}

export interface ParticipantResponse {
  participant: Participant
  historial: ExpeditionHistory[]
}

export interface RateRequest {
  expedition: string
  year: number
  list: ParticipantForRate[]
}

export interface RateResponse {
  list: ParticipantWithScore[]
}

export interface LotteryRequest {
  count: number
  expedition: string
  year: number
  list: ParticipantWithScore[]
}

export interface LotteryResponse {
  list: ParticipantWithWon[]
}

export interface InsertRequest {
  expedition: string
  year: number
  list: ParticipantWithWon[]
}

export interface InsertResponse {
  inserted: number
  repeated: number
  total: number
}

export interface ExpeditionRequest {
  expedition: string
  year: number
}

export interface ExpeditionResponse {
  list: ParticipantWithWon[]
}

export interface Expedition {
  id: number
  name: string
}

export interface ExpeditionListResponse {
  list: Expedition[]
}

export interface ApiError {
  detail: string
}

// Helper function for API calls
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { credentials, headers, ...restOptions } = options
  const response = await fetch(url, {
    ...restOptions,
    credentials: credentials ?? "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  })

  const data = await response.json()
  
  if (process.env.NODE_ENV !== "production") {
    console.log("API Response:", response.status, data)
  }

  if (!response.ok) {
    const errorMessage = (data as ApiError).detail || JSON.stringify(data) || "Error en la solicitud"
    throw new Error(errorMessage)
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
