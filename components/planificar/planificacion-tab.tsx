"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DayFilter } from "@/components/day-filter"
import { WeeklyCalendar, scheduleToEventGroups, type EventGroup } from "@/components/weekly-calendar"
import { ViewModeToggle } from "./view-mode-toggle"
import { calculateSchedule, getCareers, type Career, type ScheduledClass } from "@/lib/api"
import { formatScheduleForClipboard } from "@/lib/schedule-format"

const COURSE_TYPES = ["teorica", "practica", "teorica-practica"]
const BUILDS = ["PC", "LH", "CU"]
const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]

export function PlanificacionTab() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loadingCareers, setLoadingCareers] = useState(true)
  const [selectedCareers, setSelectedCareers] = useState<string[]>([])

  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>(["teorica", "practica"])
  const [selectedBuilds, setSelectedBuilds] = useState<string[]>([])
  const [minResponsibles, setMinResponsibles] = useState<string>("2")

  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleData, setScheduleData] = useState<ScheduledClass[]>([])
  const [selectedPerson, setSelectedPerson] = useState<string>("todos")
  const [selectedScheduleRows, setSelectedScheduleRows] = useState<string[]>([])
  const [scheduleFilterCourseType, setScheduleFilterCourseType] = useState<string>("todos")
  const [scheduleFilterDays, setScheduleFilterDays] = useState<string[]>([])
  const [scheduleViewMode, setScheduleViewMode] = useState<"lista" | "calendario">("lista")

  useEffect(() => {
    void fetchCareers()
  }, [])

  const fetchCareers = async () => {
    try {
      const response = await getCareers()
      setCareers(response.list)
    } catch (error) {
      console.error("Error fetching careers:", error)
      toast.error("Error al cargar carreras")
    } finally {
      setLoadingCareers(false)
    }
  }

  const fetchSchedule = async () => {
    if (selectedCareers.length === 0) {
      toast.error("Selecciona al menos una carrera")
      return
    }

    setLoadingSchedule(true)
    setScheduleError(null)
    setScheduleData([])
    setSelectedScheduleRows([])

    try {
      const responses = await Promise.all(
        selectedCareers.map((careerId) =>
          calculateSchedule({
            career_id: parseInt(careerId, 10),
            course_type: selectedCourseTypes,
            build: selectedBuilds.length > 0 ? selectedBuilds[0] : null,
            min_responsibles: parseInt(minResponsibles, 10) || 2,
          })
        )
      )

      const merged = responses.flatMap((response) => response.list)
      const uniqueByKey = new Map<string, ScheduledClass>()

      merged.forEach((course) => {
        const key = getScheduleRowKey(course)
        if (!uniqueByKey.has(key)) {
          uniqueByKey.set(key, course)
        }
      })

      const mergedSchedule = Array.from(uniqueByKey.values())
      setScheduleData(mergedSchedule)

      if (mergedSchedule.length === 0) {
        toast.info("No se encontraron cursos que cumplan los criterios")
      } else {
        toast.success(`${mergedSchedule.length} cursos planificados`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al calcular horario"
      setScheduleError(message)
      toast.error(message)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const toggleCareer = (careerId: string) => {
    setSelectedCareers((prev) =>
      prev.includes(careerId) ? prev.filter((id) => id !== careerId) : [...prev, careerId]
    )
  }

  const selectAllCareers = () => {
    setSelectedCareers(careers.map((career) => career.career_id.toString()))
  }

  const clearAllCareers = () => {
    setSelectedCareers([])
  }

  const getScheduleRowKey = (course: ScheduledClass) => {
    return [
      course.subject,
      course.course,
      course.curse_type,
      course.day,
      course.starts_at,
      course.room,
      course.build,
      [...course.responsibles].sort().join("|"),
    ].join("::")
  }

  const toggleScheduleRow = (course: ScheduledClass) => {
    const key = getScheduleRowKey(course)
    setSelectedScheduleRows((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    )
  }

  const selectAllVisibleScheduleRows = () => {
    setSelectedScheduleRows(filteredScheduleData.map((course) => getScheduleRowKey(course)))
  }

  const clearSelectedScheduleRows = () => {
    setSelectedScheduleRows([])
  }

  const filteredScheduleData = useMemo(() => {
    let filtered = scheduleData

    if (selectedPerson !== "todos") {
      filtered = filtered.filter((course) => course.responsibles.includes(selectedPerson))
    }

    if (scheduleFilterDays.length > 0) {
      filtered = filtered.filter((course) => scheduleFilterDays.includes(course.day))
    }

    return filtered
  }, [scheduleData, selectedPerson, scheduleFilterDays])

  const scheduleEventGroups = useMemo(() => {
    return scheduleToEventGroups(filteredScheduleData)
  }, [filteredScheduleData])

  const scheduleCourseTypes = useMemo(() => {
    const types = new Set<string>()
    scheduleData.forEach((course) => types.add(course.curse_type))
    return Array.from(types)
  }, [scheduleData])

  const getAllPersons = useMemo(() => {
    const persons = new Set<string>()
    scheduleData.forEach((course) => {
      course.responsibles.forEach((person) => persons.add(person))
    })
    return Array.from(persons).sort()
  }, [scheduleData])

  const copyScheduleToClipboard = () => {
    const selectedKeys = new Set(selectedScheduleRows)
    const rowsToCopy =
      selectedKeys.size > 0
        ? filteredScheduleData.filter((course) => selectedKeys.has(getScheduleRowKey(course)))
        : filteredScheduleData

    if (rowsToCopy.length === 0) {
      toast.info("No hay cursos para copiar")
      return
    }

    const text = formatScheduleForClipboard(rowsToCopy, DAYS_OF_WEEK)

    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Horario copiado al portapapeles"))
      .catch(() => toast.error("Error al copiar al portapapeles"))
  }

  const allVisibleSelected =
    filteredScheduleData.length > 0 &&
    filteredScheduleData.every((course) => selectedScheduleRows.includes(getScheduleRowKey(course)))
  const selectedVisibleCount = filteredScheduleData.filter((course) =>
    selectedScheduleRows.includes(getScheduleRowKey(course))
  ).length
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < filteredScheduleData.length

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label className="text-foreground">Carreras</Label>
              {selectedCareers.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedCareers.length} seleccionada{selectedCareers.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllCareers} disabled={loadingCareers || careers.length === 0}>
                Seleccionar todas
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearAllCareers} disabled={loadingCareers || selectedCareers.length === 0}>
                Limpiar
              </Button>
            </div>
            <div className="rounded-md border border-border p-3">
              {loadingCareers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando carreras...
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {careers.map((career) => {
                    const id = career.career_id.toString()
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <Checkbox id={`schedule-career-${id}`} checked={selectedCareers.includes(id)} onCheckedChange={() => toggleCareer(id)} />
                        <label htmlFor={`schedule-career-${id}`} className="cursor-pointer text-sm font-medium">
                          {career.career}
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-foreground mb-3 block">Tipo de Cursos</Label>
            <div className="flex flex-wrap gap-4">
              {COURSE_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox id={`type-${type}`} checked={selectedCourseTypes.includes(type)} onCheckedChange={() => setSelectedCourseTypes((prev) => prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type])} />
                  <label htmlFor={`type-${type}`} className="cursor-pointer text-sm font-medium capitalize">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground mb-3 block">Edificios</Label>
            <div className="flex flex-wrap gap-4">
              {BUILDS.map((build) => (
                <div key={build} className="flex items-center gap-2">
                  <Checkbox id={`build-${build}`} checked={selectedBuilds.includes(build)} onCheckedChange={() => setSelectedBuilds((prev) => prev.includes(build) ? prev.filter((item) => item !== build) : [...prev, build])} />
                  <label htmlFor={`build-${build}`} className="cursor-pointer text-sm font-medium">
                    {build}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-xs">
            <Label htmlFor="min-resp" className="text-foreground mb-2 block">
              Minimo de Responsables
            </Label>
            <Select value={minResponsibles} onValueChange={setMinResponsibles}>
              <SelectTrigger id="min-resp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchSchedule} disabled={loadingSchedule || selectedCareers.length === 0} className="w-full sm:w-auto">
            {loadingSchedule ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planificando...
              </>
            ) : (
              "Planificar Pasadas"
            )}
          </Button>
        </div>
      </div>

      {scheduleError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{scheduleError}</span>
        </div>
      )}

      {scheduleData.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-2 flex-1">
              <div className="flex-1 max-w-xs">
                <Label className="text-foreground mb-2 block text-xs">Filtrar por Persona</Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {getAllPersons.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DayFilter selectedDays={scheduleFilterDays} onSelectedDaysChange={setScheduleFilterDays} />
              <Button size="sm" variant="outline" onClick={copyScheduleToClipboard} className="gap-2 h-9">
                <Copy className="h-3.5 w-3.5" />
                Copiar Horario
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{filteredScheduleData.length} cursos</span>
              <ViewModeToggle value={scheduleViewMode} onChange={setScheduleViewMode} />
            </div>
          </div>

          {scheduleViewMode === "lista" ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3">
                <Button type="button" variant="outline" size="sm" onClick={selectAllVisibleScheduleRows} disabled={filteredScheduleData.length === 0}>
                  Seleccionar visibles
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelectedScheduleRows} disabled={selectedScheduleRows.length === 0}>
                  Limpiar selección
                </Button>
                <span className="text-xs text-muted-foreground">{selectedScheduleRows.length} filas seleccionadas</span>
              </div>
              <div className="w-full max-h-[65vh] overflow-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="w-12 text-xs font-semibold text-foreground">
                        <Checkbox
                          checked={someVisibleSelected ? "indeterminate" : allVisibleSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllVisibleScheduleRows()
                            } else {
                              clearSelectedScheduleRows()
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Asignatura</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Comision</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Dia</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Horario</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Aula</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Edificio</TableHead>
                      <TableHead className="text-xs font-semibold text-foreground">Responsables</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScheduleData.map((course) => (
                      <TableRow key={getScheduleRowKey(course)}>
                        <TableCell className="w-12 align-middle">
                          <Checkbox
                            checked={selectedScheduleRows.includes(getScheduleRowKey(course))}
                            onCheckedChange={() => toggleScheduleRow(course)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{course.subject}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{course.course}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {course.curse_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{course.day}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{course.starts_at}:00</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{course.room}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">
                          <Badge className="border-primary/20 bg-primary/10 text-xs text-primary">{course.build}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          <div className="flex flex-wrap gap-1">
                            {course.responsibles.map((person, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {person}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <WeeklyCalendar
              eventGroups={scheduleEventGroups as EventGroup[]}
              cellHeight={60}
              className="max-h-[1400px]"
              courseTypes={scheduleCourseTypes}
              selectedCourseType={scheduleFilterCourseType}
              onCourseTypeChange={setScheduleFilterCourseType}
              selectedDays={scheduleFilterDays}
            />
          )}
        </div>
      )}

      {loadingSchedule && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loadingSchedule && scheduleData.length === 0 && !scheduleError && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-8 text-center text-muted-foreground">
          <p>Selecciona los parámetros y planifica las pasadas</p>
        </div>
      )}
    </div>
  )
}