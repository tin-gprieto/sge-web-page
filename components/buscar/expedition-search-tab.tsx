"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Search, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getExpeditionHistorial, getExpeditionParticipants, type ExpeditionHistorialItem, type ExpeditionParticipant } from "@/lib/api"

function ExpeditionResult({ data, expedition }: { data: ExpeditionParticipant[]; expedition: string }) {
  const winners = data.filter((participant) => participant.has_won)

  return (
    <div className="flex flex-col gap-4">
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

      <div className="rounded-xl border border-border bg-card">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-12 whitespace-nowrap text-xs font-semibold text-foreground">
                  #
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Nombre
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Apellido
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Padron
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Carrera
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Estado
                </TableHead>
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
                data.map((participant, index) => (
                  <TableRow key={`${participant.census}-${index}`}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">
                      {participant.first_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">
                      {participant.last_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">
                      {participant.census}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-foreground">
                      {participant.career}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {participant.has_won ? (
                        <Badge className="border-primary/20 bg-primary/10 text-xs text-primary">
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

export function ExpeditionSearchTab() {
  const [historial, setHistorial] = useState<ExpeditionHistorialItem[]>([])
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(true)
  const [expeditionYear, setExpeditionYear] = useState("")
  const [expeditionName, setExpeditionName] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<ExpeditionParticipant[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function fetchHistorial() {
      try {
        const response = await getExpeditionHistorial()

        if (isActive) {
          setHistorial(response.list)
        }
      } catch (err) {
        console.error("Error fetching historial:", err)
        toast.error("Error al cargar el historial de expediciones")
      } finally {
        if (isActive) {
          setIsLoadingHistorial(false)
        }
      }
    }

    fetchHistorial()

    return () => {
      isActive = false
    }
  }, [])

  const availableYears = useMemo(
    () => [...new Set(historial.map((item) => item.year))].sort((a, b) => b - a),
    [historial]
  )

  const expeditionsForYear = useMemo(
    () =>
      expeditionYear
        ? [...new Set(historial.filter((item) => item.year === parseInt(expeditionYear, 10)).map((item) => item.name))].sort()
        : [],
    [expeditionYear, historial]
  )

  const canSearch = expeditionYear !== "" && expeditionName !== "" && !isLoadingHistorial

  const handleSearch = async () => {
    if (!expeditionYear || !expeditionName) {
      setError("Selecciona un año y una expedición.")
      return
    }

    setResult(null)
    setError(null)
    setIsSearching(true)

    try {
      const response = await getExpeditionParticipants(expeditionName, parseInt(expeditionYear, 10))
      setResult(response.list)

      if (response.list.length === 0) {
        toast.info("No se encontraron participantes para esta expedición y año.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al buscar expedición"
      setError(message)
      toast.error(message)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Año</label>
            <Select
              value={expeditionYear}
              onValueChange={(value) => {
                setExpeditionYear(value)
                setExpeditionName("")
                setResult(null)
                setError(null)
              }}
              disabled={isLoadingHistorial}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingHistorial ? "Cargando años..." : "Seleccionar año"} />
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
            <label className="text-sm font-medium text-foreground">Expedición</label>
            <Select
              value={expeditionName}
              onValueChange={(value) => {
                setExpeditionName(value)
                setResult(null)
                setError(null)
              }}
              disabled={!expeditionYear || isLoadingHistorial}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    expeditionYear ? "Seleccionar expedición" : "Primero selecciona un año"
                  }
                />
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
              Buscar Expedición
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

      {result && expeditionName && <ExpeditionResult data={result} expedition={expeditionName} />}
    </div>
  )
}
