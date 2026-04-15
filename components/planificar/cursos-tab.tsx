"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Copy, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { WeeklyCalendar, subjectsToEventGroups } from "@/components/weekly-calendar"
import { ViewModeToggle } from "./view-mode-toggle"
import { getCareers, getSubjects, type Career, type Subject } from "@/lib/api"

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

const getDayOrder = (day: string) => {
  const index = DAYS_OF_WEEK.indexOf(day)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

const sortSubjects = (a: Subject, b: Subject) => {
  const dayOrderDiff = getDayOrder(a.day) - getDayOrder(b.day)
  if (dayOrderDiff !== 0) {
    return dayOrderDiff
  }

  if (a.day !== b.day) {
    return a.day.localeCompare(b.day, "es")
  }

  const startAtDiff = Number(a.starts_at) - Number(b.starts_at)
  if (startAtDiff !== 0) {
    return startAtDiff
  }

  return a.subject.localeCompare(b.subject, "es")
}

export function CursosTab() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loadingCareers, setLoadingCareers] = useState(true)
  const [cursosCareers, setCursosCareers] = useState<string[]>([])

  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectsError, setSubjectsError] = useState<string | null>(null)
  const [subjectsData, setSubjectsData] = useState<Subject[]>([])
  const [cursosFilterBuild, setCursosFilterBuild] = useState<string>("todos")
  const [cursosFilterDays, setCursosFilterDays] = useState<string[]>([])
  const [cursosFilterCourseType, setCursosFilterCourseType] = useState<string>("todos")
  const [cursosFilterStartsAt, setCursosFilterStartsAt] = useState<string>("todos")
  const [cursosFilterEndsAt, setCursosFilterEndsAt] = useState<string>("todos")
  const [cursosViewMode, setCursosViewMode] = useState<"lista" | "calendario">("lista")
  const [selectedSubjectRows, setSelectedSubjectRows] = useState<string[]>([])

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

  const fetchSubjects = async () => {
    if (cursosCareers.length === 0) {
      toast.error("Selecciona al menos una carrera")
      return
    }

    setLoadingSubjects(true)
    setSubjectsError(null)
    setSubjectsData([])
    setSelectedSubjectRows([])

    try {
      const responses = await Promise.all(
        cursosCareers.map((careerId) => getSubjects(parseInt(careerId, 10)))
      )

      const merged = responses.flatMap((response) => response.list)
      const uniqueByKey = new Map<string, Subject>()

      merged.forEach((subject) => {
        const key = [subject.subject, subject.course, subject.curse_type, subject.day, subject.starts_at, subject.room, subject.build].join("::")
        if (!uniqueByKey.has(key)) {
          uniqueByKey.set(key, subject)
        }
      })

      const mergedSubjects = Array.from(uniqueByKey.values())
      setSubjectsData(mergedSubjects)

      if (mergedSubjects.length === 0) {
        toast.info("No se encontraron cursos para las carreras seleccionadas")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al obtener cursos"
      setSubjectsError(message)
      toast.error(message)
    } finally {
      setLoadingSubjects(false)
    }
  }

  const toggleCursosCareer = (careerId: string) => {
    setCursosCareers((prev) =>
      prev.includes(careerId) ? prev.filter((id) => id !== careerId) : [...prev, careerId]
    )
  }

  const getSubjectRowKey = (subject: Subject) => {
    return [subject.subject, subject.course, subject.curse_type, subject.day, subject.starts_at, subject.room, subject.build].join("::")
  }

  const toggleSubjectRow = (subject: Subject) => {
    const rowKey = getSubjectRowKey(subject)
    setSelectedSubjectRows((prev) =>
      prev.includes(rowKey) ? prev.filter((item) => item !== rowKey) : [...prev, rowKey]
    )
  }

  const clearSelectedSubjectRows = () => {
    setSelectedSubjectRows([])
  }

  const selectAllVisibleSubjectRows = () => {
    setSelectedSubjectRows(sortedFilteredSubjectsData.map(getSubjectRowKey))
  }

  const copySelectedSubjects = () => {
    const rowsToCopy = filteredSubjectsData.filter((subject) =>
      selectedSubjectRows.includes(getSubjectRowKey(subject))
    )

    if (rowsToCopy.length === 0) {
      toast.error("No hay materias seleccionadas para copiar.")
      return
    }

    const groupedByDay = rowsToCopy.reduce<Record<string, Subject[]>>((acc, subject) => {
      const day = subject.day
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(subject)
      return acc
    }, {})

    const daysOrder = DAYS_OF_WEEK.filter((day) => groupedByDay[day]?.length > 0)
    const extraDays = Object.keys(groupedByDay)
      .filter((day) => !DAYS_OF_WEEK.includes(day))
      .sort()
    const orderedDays = [...daysOrder, ...extraDays]

    const clipboardText = orderedDays
      .map((day) => {
        const dayRows = [...groupedByDay[day]].sort((a, b) => a.starts_at - b.starts_at)
        const subjectsText = dayRows
          .map((s) => `${s.subject} - ${s.course} (${s.curse_type}) ${s.starts_at}:00 ${s.build} ${s.room}`)
          .join("\n")
        return `${day.toUpperCase()}\n${subjectsText}`
      })
      .join("\n\n")

    navigator.clipboard
      .writeText(clipboardText)
      .then(() => {
        toast.success("Horario copiado al portapapeles")
      })
      .catch((err) => {
        console.error("Error al copiar: ", err)
        toast.error("Error al copiar al portapapeles")
      })
  }

  const filteredSubjectsData = useMemo(() => {
    let filtered = subjectsData

    if (cursosFilterBuild !== "todos") {
      filtered = filtered.filter((subject) => subject.build === cursosFilterBuild)
    }

    if (cursosFilterDays.length > 0) {
      filtered = filtered.filter((subject) => cursosFilterDays.includes(subject.day))
    }

    const fromHour = cursosFilterStartsAt === "todos" ? null : Number(cursosFilterStartsAt)
    const toHour = cursosFilterEndsAt === "todos" ? null : Number(cursosFilterEndsAt)
    if (fromHour !== null || toHour !== null) {
      filtered = filtered.filter((subject) => {
        const startHour = Number(subject.starts_at)
        if (fromHour !== null && toHour !== null) {
          return startHour >= fromHour && startHour <= toHour
        }
        if (fromHour !== null) {
          return startHour >= fromHour
        }
        return startHour <= (toHour as number)
      })
    }

    return filtered
  }, [subjectsData, cursosFilterBuild, cursosFilterDays, cursosFilterStartsAt, cursosFilterEndsAt])

  const subjectsBuilds = useMemo(() => {
    const builds = new Set<string>()
    subjectsData.forEach((subject) => builds.add(subject.build))
    return Array.from(builds).sort()
  }, [subjectsData])

  const subjectsHours = useMemo(() => {
    const hours = new Set<string>()
    subjectsData.forEach((subject) => {
      hours.add(subject.starts_at.toString())
    })
    return Array.from(hours).sort((a, b) => Number(a) - Number(b))
  }, [subjectsData])

  const sortedFilteredSubjectsData = useMemo(() => {
    return [...filteredSubjectsData].sort(sortSubjects)
  }, [filteredSubjectsData])

  const allVisibleSelected =
    sortedFilteredSubjectsData.length > 0 && sortedFilteredSubjectsData.every((subject) => selectedSubjectRows.includes(getSubjectRowKey(subject)))
  const someVisibleSelected =
    !allVisibleSelected && sortedFilteredSubjectsData.some((subject) => selectedSubjectRows.includes(getSubjectRowKey(subject)))

  const subjectsCourseTypes = useMemo(() => {
    const types = new Set<string>()
    filteredSubjectsData.forEach((subject) => types.add(subject.curse_type))
    return Array.from(types)
  }, [filteredSubjectsData])

  const subjectsEventGroups = useMemo(() => {
    return subjectsToEventGroups(filteredSubjectsData)
  }, [filteredSubjectsData])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-2 flex-1">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-foreground">Carreras</Label>
                {cursosCareers.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {cursosCareers.length} seleccionada{cursosCareers.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between" disabled={loadingCareers}>
                    {loadingCareers
                      ? "Cargando carreras..."
                      : cursosCareers.length > 0
                        ? `${cursosCareers.length} carrera${cursosCareers.length > 1 ? "s" : ""} seleccionada${cursosCareers.length > 1 ? "s" : ""}`
                        : "Seleccionar carreras"}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {careers.map((career) => {
                    const id = career.career_id.toString()
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={cursosCareers.includes(id)}
                        onCheckedChange={() => toggleCursosCareer(id)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {career.career}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={fetchSubjects} disabled={loadingSubjects || cursosCareers.length === 0} className="w-full sm:w-auto sm:flex-1">
              {loadingSubjects ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Cargar Cursos"
              )}
            </Button>
          </div>
        </div>
      </div>

      {subjectsError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{subjectsError}</span>
        </div>
      )}

      {subjectsData.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Label className="hidden text-sm text-muted-foreground sm:inline">Edificio:</Label>
                <Select value={cursosFilterBuild} onValueChange={setCursosFilterBuild}>
                  <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {subjectsBuilds.map((build) => (
                      <SelectItem key={build} value={build}>
                        {build}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DayFilter selectedDays={cursosFilterDays} onSelectedDaysChange={setCursosFilterDays} />
              <div className="flex items-center gap-2">
                <Label className="hidden text-sm text-muted-foreground sm:inline">Desde:</Label>
                <Select value={cursosFilterStartsAt} onValueChange={setCursosFilterStartsAt}>
                  <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {subjectsHours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="hidden text-sm text-muted-foreground sm:inline">Hasta:</Label>
                <Select value={cursosFilterEndsAt} onValueChange={setCursosFilterEndsAt}>
                  <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {subjectsHours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {sortedFilteredSubjectsData.length} de {subjectsData.length} cursos
              </span>
            </div>
            <ViewModeToggle value={cursosViewMode} onChange={setCursosViewMode} />
          </div>

          {cursosViewMode === "lista" ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3">
                <Button type="button" variant="outline" size="sm" onClick={selectAllVisibleSubjectRows} disabled={sortedFilteredSubjectsData.length === 0}>
                  Seleccionar visibles
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelectedSubjectRows} disabled={selectedSubjectRows.length === 0}>
                  Limpiar selección
                </Button>
                <Button size="sm" variant="outline" onClick={copySelectedSubjects} className="gap-2 h-9" disabled={selectedSubjectRows.length === 0}>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar Horario
                </Button>
                <span className="text-xs text-muted-foreground">{selectedSubjectRows.length} filas seleccionadas</span>
              </div>
              <div className="w-full max-h-[65vh] overflow-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="w-12 text-xs font-semibold text-foreground">
                        <Checkbox
                          checked={someVisibleSelected ? "indeterminate" : allVisibleSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllVisibleSubjectRows()
                            } else {
                              clearSelectedSubjectRows()
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFilteredSubjectsData.map((subject) => (
                      <TableRow key={getSubjectRowKey(subject)}>
                        <TableCell className="w-12 align-middle">
                          <Checkbox
                            checked={selectedSubjectRows.includes(getSubjectRowKey(subject))}
                            onCheckedChange={() => toggleSubjectRow(subject)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{subject.subject}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{subject.course}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {subject.curse_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{subject.day}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{subject.starts_at}:00</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">{subject.room}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-foreground">
                          <Badge className="border-primary/20 bg-primary/10 text-xs text-primary">{subject.build}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <WeeklyCalendar
              eventGroups={subjectsEventGroups}
              cellHeight={60}
              className="max-h-[1400px]"
              courseTypes={subjectsCourseTypes}
              selectedCourseType={cursosFilterCourseType}
              onCourseTypeChange={setCursosFilterCourseType}
              selectedDays={cursosFilterDays}
            />
          )}
        </>
      )}

      {loadingSubjects && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loadingSubjects && subjectsData.length === 0 && !subjectsError && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-8 text-center text-muted-foreground">
          <p>Selecciona carreras y carga los cursos</p>
        </div>
      )}
    </div>
  )
}