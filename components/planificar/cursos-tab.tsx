"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const COURSE_TYPES = ["teorica", "practica", "teorica-practica"]

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
  const [cursosViewMode, setCursosViewMode] = useState<"lista" | "calendario">("lista")

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

  const filteredSubjectsData = useMemo(() => {
    let filtered = subjectsData

    if (cursosFilterBuild !== "todos") {
      filtered = filtered.filter((subject) => subject.build === cursosFilterBuild)
    }

    if (cursosFilterDays.length > 0) {
      filtered = filtered.filter((subject) => cursosFilterDays.includes(subject.day))
    }

    return filtered
  }, [subjectsData, cursosFilterBuild, cursosFilterDays])

  const subjectsBuilds = useMemo(() => {
    const builds = new Set<string>()
    subjectsData.forEach((subject) => builds.add(subject.build))
    return Array.from(builds).sort()
  }, [subjectsData])

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
              <span className="text-xs text-muted-foreground sm:text-sm">
                {filteredSubjectsData.length} de {subjectsData.length} cursos
              </span>
            </div>
            <ViewModeToggle value={cursosViewMode} onChange={setCursosViewMode} />
          </div>

          {cursosViewMode === "lista" ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{filteredSubjectsData.length} cursos encontrados</span>
              </div>
              <div className="w-full max-h-[65vh] overflow-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-muted">
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
                    {filteredSubjectsData.map((subject, idx) => (
                      <TableRow key={idx}>
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