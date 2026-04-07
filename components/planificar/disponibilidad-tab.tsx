"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DayFilter } from "@/components/day-filter"
import { WeeklyCalendar, availabilityToCalendarEvents, type CalendarEvent } from "@/components/weekly-calendar"
import { ViewModeToggle } from "./view-mode-toggle"
import { getAvailability, type AvailabilityEntry } from "@/lib/api"

export interface AvailabilityByPerson {
  [person: string]: AvailabilityEntry[]
}

export function DisponibilidadTab() {
  const [availabilityViewMode, setAvailabilityViewMode] = useState<"lista" | "calendario">("lista")
  const [availabilityData, setAvailabilityData] = useState<AvailabilityByPerson>({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilityFilterBuild, setAvailabilityFilterBuild] = useState<string>("todos")
  const [availabilityFilterDays, setAvailabilityFilterDays] = useState<string[]>([])

  useEffect(() => {
    void fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    setLoadingAvailability(true)
    setAvailabilityError(null)

    try {
      const response = await getAvailability()
      const grouped: AvailabilityByPerson = {}

      response.list.forEach((entry) => {
        if (!grouped[entry.person]) {
          grouped[entry.person] = []
        }
        grouped[entry.person].push(entry)
      })

      setAvailabilityData(grouped)

      if (Object.keys(grouped).length === 0) {
        toast.info("No se encontró disponibilidad")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al obtener disponibilidad"
      setAvailabilityError(message)
      toast.error(message)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const availabilityBuilds = useMemo(() => {
    const builds = new Set<string>()
    Object.values(availabilityData).forEach((entries) => {
      entries.forEach((entry) => builds.add(entry.build))
    })
    return Array.from(builds).sort()
  }, [availabilityData])

  const filteredAvailabilityData = useMemo(() => {
    const filtered: AvailabilityByPerson = {}

    Object.entries(availabilityData).forEach(([person, entries]) => {
      let filteredEntries = entries

      if (availabilityFilterBuild !== "todos") {
        filteredEntries = filteredEntries.filter((entry) => entry.build === availabilityFilterBuild)
      }

      if (availabilityFilterDays.length > 0) {
        filteredEntries = filteredEntries.filter((entry) => availabilityFilterDays.includes(entry.day))
      }

      if (filteredEntries.length > 0) {
        filtered[person] = filteredEntries
      }
    })

    return filtered
  }, [availabilityData, availabilityFilterBuild, availabilityFilterDays])

  const totalAvailabilityCount = useMemo(
    () => Object.values(availabilityData).reduce((total, entries) => total + entries.length, 0),
    [availabilityData]
  )

  const filteredAvailabilityCount = useMemo(
    () => Object.values(filteredAvailabilityData).reduce((total, entries) => total + entries.length, 0),
    [filteredAvailabilityData]
  )

  const availabilityCalendarEvents = useMemo(() => {
    return availabilityToCalendarEvents(filteredAvailabilityData)
  }, [filteredAvailabilityData])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <Button onClick={fetchAvailability} disabled={loadingAvailability} className="w-full">
          {loadingAvailability ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            "Cargar Disponibilidad"
          )}
        </Button>
      </div>

      {availabilityError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{availabilityError}</span>
        </div>
      )}

      {Object.keys(availabilityData).length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Label className="hidden text-sm text-muted-foreground sm:inline">Edificio:</Label>
                <Select value={availabilityFilterBuild} onValueChange={setAvailabilityFilterBuild}>
                  <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {availabilityBuilds.map((build) => (
                      <SelectItem key={build} value={build}>
                        {build}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DayFilter selectedDays={availabilityFilterDays} onSelectedDaysChange={setAvailabilityFilterDays} />
              <span className="text-xs text-muted-foreground sm:text-sm">
                {filteredAvailabilityCount} de {totalAvailabilityCount} horarios
              </span>
            </div>
            <ViewModeToggle value={availabilityViewMode} onChange={setAvailabilityViewMode} />
          </div>

          {availabilityViewMode === "lista" ? (
            <div className="space-y-4">
              {Object.entries(filteredAvailabilityData).map(([person, entries]) => (
                <div key={person} className="rounded-lg border border-border p-4">
                  <h3 className="mb-3 font-semibold text-foreground">{person}</h3>
                  <div className="grid gap-2">
                    {entries.map((entry, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary">{entry.day}</Badge>
                        <span className="text-muted-foreground">
                          {entry.starts_at}:00 - {entry.finishes_at}:00
                        </span>
                        <Badge className="border-primary/20 bg-primary/10 text-primary">{entry.build}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <WeeklyCalendar
              events={availabilityCalendarEvents as CalendarEvent[]}
              cellHeight={60}
              className="max-h-[1400px]"
              selectedDays={availabilityFilterDays}
            />
          )}
        </>
      )}

      {loadingAvailability && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loadingAvailability && Object.keys(availabilityData).length === 0 && !availabilityError && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-8 text-center text-muted-foreground">
          <p>Carga la disponibilidad para ver los horarios</p>
        </div>
      )}
    </div>
  )
}