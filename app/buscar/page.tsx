"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Search, Loader2, XCircle, User, MapPin, Hash, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  getParticipantByName,
  getParticipantByCensus,
  getExpeditionParticipants,
  getExpeditionHistorial,
  getAllParticipants,
  type ParticipantResponse,
  type ExpeditionParticipant,
  type ExpeditionHistorialItem,
  type AllParticipant,
} from "@/lib/api"
import { ParticipantsCharts } from "@/components/participants-charts"

function ParticipantResult({ data }: { data: ParticipantResponse }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Participant Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {data.participant.first_name} {data.participant.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">{data.participant.career}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            <span className="text-xs font-medium text-muted-foreground">Padron</span>
            <span className="text-sm font-semibold text-foreground">{data.participant.census}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            <span className="text-xs font-medium text-muted-foreground">Carrera</span>
            <span className="text-sm font-semibold text-foreground">{data.participant.career}</span>
          </div>
        </div>
      </div>

      {/* Expedition History */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Historial de expediciónes</h3>
            <p className="text-sm text-muted-foreground">
              {data.historial.length === 0
                ? "Sin expediciones registradas"
                : `${data.historial.length} expedición${data.historial.length !== 1 ? "es" : ""}`}
            </p>
          </div>
        </div>
        {data.historial.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.historial.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground">{entry.expedition}</span>
                <Badge variant="secondary" className="text-xs">
                  {entry.year}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este participante no tiene expediciones registradas.
          </p>
        )}
      </div>
    </div>
  )
}

function ExpeditionResult({ data, expedition, year }: { data: ExpeditionParticipant[]; expedition: string; year: number }) {
  const winners = data.filter((p) => p.has_won)
  const losers = data.filter((p) => !p.has_won)

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Expedicion</span>
          <span className="text-lg font-semibold text-foreground">{expedition}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Participantes</span>
          <span className="text-lg font-semibold text-foreground">{data.length}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground">Ganadores</span>
          <span className="text-lg font-semibold text-primary">{winners.length}</span>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground w-12">#</TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">Nombre</TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">Apellido</TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">Padron</TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">Carrera</TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron participantes.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">{p.first_name}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">{p.last_name}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">{p.census}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">{p.career}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.has_won ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Ganador
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No ganador
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default function BuscarPage() {
  // All participants for charts
  const [allParticipants, setAllParticipants] = useState<AllParticipant[]>([])
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true)

  // Expedition historial
  const [historial, setHistorial] = useState<ExpeditionHistorialItem[]>([])

  // Participant search state
  const [searchMode, setSearchMode] = useState<"name" | "census">("name")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [census, setCensus] = useState("")
  const [isSearchingParticipant, setIsSearchingParticipant] = useState(false)
  const [participantResult, setParticipantResult] = useState<ParticipantResponse | null>(null)
  const [participantError, setParticipantError] = useState<string | null>(null)

  // Expedition search state - year first, then expedition
  const [expeditionYear, setExpeditionYear] = useState<string>("")
  const [expeditionName, setExpeditionName] = useState<string>("")
  const [isSearchingExpedition, setIsSearchingExpedition] = useState(false)
  const [expeditionResult, setExpeditionResult] = useState<ExpeditionParticipant[] | null>(null)
  const [expeditionError, setExpeditionError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistorial() {
      try {
        const response = await getExpeditionHistorial()
        setHistorial(response.list)
      } catch (err) {
        console.error("Error fetching historial:", err)
        toast.error("Error al cargar el historial de expediciones")
      }
    }
    fetchHistorial()
  }, [])

  // Fetch all participants for charts
  useEffect(() => {
    async function fetchAllParticipants() {
      try {
        setIsLoadingParticipants(true)
        const response = await getAllParticipants()
        setAllParticipants(response.list)
      } catch (err) {
        console.error("Error fetching participants:", err)
        toast.error("Error al cargar los participantes para los graficos")
      } finally {
        setIsLoadingParticipants(false)
      }
    }
    fetchAllParticipants()
  }, [])

  // Get unique years from historial (sorted descending)
  const availableYears = [...new Set(historial.map(h => h.year))].sort((a, b) => b - a)
  
  // Get expeditions available for selected year
  const expeditionsForYear = expeditionYear 
    ? [...new Set(historial.filter(h => h.year === parseInt(expeditionYear, 10)).map(h => h.name))].sort()
    : []

  const handleSearchParticipant = async () => {
    setParticipantResult(null)
    setParticipantError(null)
    setIsSearchingParticipant(true)

    try {
      let response: ParticipantResponse
      if (searchMode === "name") {
        if (!firstName.trim() || !lastName.trim()) {
          setParticipantError("Completa nombre y apellido para buscar.")
          setIsSearchingParticipant(false)
          return
        }
        response = await getParticipantByName(firstName.trim(), lastName.trim())
      } else {
        if (!census.trim()) {
          setParticipantError("Ingresa un numero de padron para buscar.")
          setIsSearchingParticipant(false)
          return
        }
        response = await getParticipantByCensus(parseInt(census, 10))
      }
      setParticipantResult(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar participante"
      setParticipantError(message)
      toast.error(message)
    } finally {
      setIsSearchingParticipant(false)
    }
  }

  const handleSearchExpedition = async () => {
    if (!expeditionName || !expeditionYear) {
      setExpeditionError("Selecciona un año y una expedición.")
      return
    }

    setExpeditionResult(null)
    setExpeditionError(null)
    setIsSearchingExpedition(true)

    try {
      const response = await getExpeditionParticipants(
        expeditionName,
        parseInt(expeditionYear, 10)
      )
      setExpeditionResult(response.list)
      if (response.list.length === 0) {
        toast.info("No se encontraron participantes para esta expedición y año.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar expedición"
      setExpeditionError(message)
      toast.error(message)
    } finally {
      setIsSearchingExpedition(false)
    }
  }

  const canSearchParticipant =
    searchMode === "name"
      ? firstName.trim() !== "" && lastName.trim() !== ""
      : census.trim() !== ""

  const canSearchExpedition = expeditionYear !== "" && expeditionName !== ""

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Charts Section */}
      <div className="mb-6">
        <ParticipantsCharts
          participants={allParticipants}
          isLoading={isLoadingParticipants}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Buscar</CardTitle>
              <CardDescription>
                Busca participantes por nombre o padron, o consulta los datos de una expedición.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="participant" className="w-full">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="participant" className="flex-1 gap-2">
                <User className="h-4 w-4" />
                Participante
              </TabsTrigger>
              <TabsTrigger value="expedition" className="flex-1 gap-2">
                <MapPin className="h-4 w-4" />
                Expedición
              </TabsTrigger>
            </TabsList>

            {/* Participant Search */}
            <TabsContent value="participant" className="flex flex-col gap-6">
              {/* Search Mode Toggle */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={searchMode === "name" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSearchMode("name")
                      setParticipantResult(null)
                      setParticipantError(null)
                    }}
                    className="gap-2"
                  >
                    <User className="h-3.5 w-3.5" />
                    Por Nombre
                  </Button>
                  <Button
                    variant={searchMode === "census" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSearchMode("census")
                      setParticipantResult(null)
                      setParticipantError(null)
                    }}
                    className="gap-2"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    Por Padron
                  </Button>
                </div>

                {searchMode === "name" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="first-name" className="text-foreground">Nombre</Label>
                      <Input
                        id="first-name"
                        placeholder="Ej: Juan"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canSearchParticipant) handleSearchParticipant()
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="last-name" className="text-foreground">Apellido</Label>
                      <Input
                        id="last-name"
                        placeholder="Ej: Perez"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canSearchParticipant) handleSearchParticipant()
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="census" className="text-foreground">Numero de Padron</Label>
                      <Input
                        id="census"
                        type="number"
                        placeholder="Ej: 108765"
                        value={census}
                        onChange={(e) => setCensus(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canSearchParticipant) handleSearchParticipant()
                        }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSearchParticipant}
                  disabled={!canSearchParticipant || isSearchingParticipant}
                  className="w-full sm:w-auto"
                >
                  {isSearchingParticipant ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar Participante
                    </>
                  )}
                </Button>
              </div>

              {/* Participant Error */}
              {participantError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{participantError}</span>
                </div>
              )}

              {/* Participant Result */}
              {participantResult && <ParticipantResult data={participantResult} />}
            </TabsContent>

            {/* Expedition Search */}
            <TabsContent value="expedition" className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Año</Label>
                    <Select
                      value={expeditionYear}
                      onValueChange={(value) => {
                        setExpeditionYear(value)
                        setExpeditionName("") // Reset expedition when year changes
                        setExpeditionResult(null)
                        setExpeditionError(null)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Expedición</Label>
                    <Select
                      value={expeditionName}
                      onValueChange={(value) => {
                        setExpeditionName(value)
                        setExpeditionResult(null)
                        setExpeditionError(null)
                      }}
                      disabled={!expeditionYear}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={expeditionYear ? "Seleccionar expedición" : "Primero selecciona un año"} />
                      </SelectTrigger>
                      <SelectContent>
                        {expeditionsForYear.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSearchExpedition}
                  disabled={!canSearchExpedition || isSearchingExpedition}
                  className="w-full sm:w-auto"
                >
                  {isSearchingExpedition ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar Expedición
                    </>
                  )}
                </Button>
              </div>

              {/* Expedition Error */}
              {expeditionError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{expeditionError}</span>
                </div>
              )}

              {/* Expedition Result */}
              {expeditionResult && expeditionName && (
                <ExpeditionResult
                  data={expeditionResult}
                  expedition={expeditionName}
                  year={parseInt(expeditionYear, 10)}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
