"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BookOpen, Hash, Loader2, MapPin, Search, User, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getParticipantByCensus,
  getParticipantByName,
  type ParticipantResponse,
} from "@/lib/api"

function ParticipantResult({ data }: { data: ParticipantResponse }) {
  return (
    <div className="flex flex-col gap-6">
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
            {data.historial.map((entry) => (
              <div
                key={`${entry.expedition}-${entry.year}`}
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

type SearchMode = "name" | "census"

export function ParticipantSearchTab() {
  const [searchMode, setSearchMode] = useState<SearchMode>("name")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [census, setCensus] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<ParticipantResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSearch = searchMode === "name"
    ? firstName.trim() !== "" && lastName.trim() !== ""
    : census.trim() !== ""

  const handleSearch = async () => {
    setResult(null)
    setError(null)
    setIsSearching(true)

    try {
      let response: ParticipantResponse

      if (searchMode === "name") {
        const trimmedFirstName = firstName.trim()
        const trimmedLastName = lastName.trim()

        if (!trimmedFirstName || !trimmedLastName) {
          setError("Completa nombre y apellido para buscar.")
          return
        }

        response = await getParticipantByName(trimmedFirstName, trimmedLastName)
      } else {
        const trimmedCensus = census.trim()

        if (!trimmedCensus) {
          setError("Ingresa un numero de padron para buscar.")
          return
        }

        response = await getParticipantByCensus(parseInt(trimmedCensus, 10))
      }

      setResult(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar participante"
      setError(message)
      toast.error(message)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={searchMode === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSearchMode("name")
              setResult(null)
              setError(null)
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
              setResult(null)
              setError(null)
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
              <Label htmlFor="first-name" className="text-foreground">
                Nombre
              </Label>
              <Input
                id="first-name"
                placeholder="Ej: Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSearch) handleSearch()
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last-name" className="text-foreground">
                Apellido
              </Label>
              <Input
                id="last-name"
                placeholder="Ej: Perez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSearch) handleSearch()
                }}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-sm">
            <div className="flex flex-col gap-2">
              <Label htmlFor="census" className="text-foreground">
                Numero de Padron
              </Label>
              <Input
                id="census"
                type="number"
                placeholder="Ej: 108765"
                value={census}
                onChange={(e) => setCensus(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSearch) handleSearch()
                }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleSearch}
          disabled={!canSearch || isSearching}
          className="w-full sm:w-auto"
        >
          {isSearching ? (
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

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && <ParticipantResult data={result} />}
    </div>
  )
}
