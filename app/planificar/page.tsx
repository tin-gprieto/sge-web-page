"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Calendar, Loader2, XCircle, Copy, List, CalendarDays, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  WeeklyCalendar,
  availabilityToCalendarEvents,
  scheduleToEventGroups,
  subjectsToEventGroups,
  type CalendarEvent,
  type EventGroup,
} from "@/components/weekly-calendar"
import { DayFilter } from "@/components/day-filter"
import {
  getCareers,
  getAvailability,
  calculateSchedule,
  getSubjects,
  type Career,
  type AvailabilityEntry,
  type ScheduledClass,
  type Subject,
} from "@/lib/api"

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
const BUILDS = ["PC", "LH", "CU"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

type ViewMode = "lista" | "calendario"

// View mode toggle component
function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
      <button
        type="button"
        onClick={() => onChange("lista")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${value === "lista"
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
          }`}
      >
        <List className="h-3.5 w-3.5" />
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange("calendario")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${value === "calendario"
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
          }`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Calendario
      </button>
    </div>
  )
}

interface AvailabilityByPerson {
  [person: string]: AvailabilityEntry[]
}

export default function PlanificarPage() {
  // Common state
  const [careers, setCareers] = useState<Career[]>([])
  const [loadingCareers, setLoadingCareers] = useState(true)

  // View mode state
  const [availabilityViewMode, setAvailabilityViewMode] = useState<ViewMode>("lista")
  const [scheduleViewMode, setScheduleViewMode] = useState<ViewMode>("lista")

  // Disponibilidad state
  const [availabilityData, setAvailabilityData] = useState<AvailabilityByPerson>({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilityFilterBuild, setAvailabilityFilterBuild] = useState<string>("todos")
  const [availabilityFilterDays, setAvailabilityFilterDays] = useState<string[]>([])

  // Planificacion de pasadas state
  const [selectedCareers, setSelectedCareers] = useState<string[]>([])
  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>(["teorica", "practica"])
  const [selectedBuilds, setSelectedBuilds] = useState<string[]>([])
  const [minResponsibles, setMinResponsibles] = useState<string>("2")
  const [scheduleData, setScheduleData] = useState<ScheduledClass[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<string>("todos")
  const [scheduleFilterCourseType, setScheduleFilterCourseType] = useState<string>("todos")
  const [scheduleFilterDays, setScheduleFilterDays] = useState<string[]>([])

  // Cursos por carrera state
  const [cursosFilterCourseType, setCursosFilterCourseType] = useState<string>("todos")
  const [cursosFilterBuild, setCursosFilterBuild] = useState<string>("todos")
  const [cursosFilterDays, setCursosFilterDays] = useState<string[]>([])
  const [cursosViewMode, setCursosViewMode] = useState<ViewMode>("lista")
  const [cursosCareers, setCursosCareers] = useState<string[]>([])
  const [subjectsData, setSubjectsData] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectsError, setSubjectsError] = useState<string | null>(null)

  // Fetch careers on mount
  useEffect(() => {
    async function fetchCareers() {
      try {
        const response = await getCareers()
        setCareers(response.list)
      } catch (err) {
        console.error("Error fetching careers:", err)
        toast.error("Error al cargar carreras")
      } finally {
        setLoadingCareers(false)
      }
    }
    fetchCareers()
  }, [])

  // Fetch all availability (no build filter)
  const handleFetchAvailability = async () => {
    setLoadingAvailability(true)
    setAvailabilityError(null)
    setAvailabilityData({})
    setAvailabilityFilterBuild("todos")

    try {
      const response = await getAvailability()

      // Group availability by person
      const grouped: AvailabilityByPerson = {}
      response.list.forEach((entry) => {
        if (!grouped[entry.person]) {
          grouped[entry.person] = []
        }
        grouped[entry.person].push(entry)
      })

      setAvailabilityData(grouped)

      if (Object.keys(grouped).length === 0) {
        toast.info("No se encontró disponibilidad para los filtros seleccionados")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al obtener disponibilidad"
      setAvailabilityError(message)
      toast.error(message)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleFetchSchedule = async () => {
    if (selectedCareers.length === 0) {
      toast.error("Selecciona al menos una carrera")
      return
    }

    setLoadingSchedule(true)
    setScheduleError(null)
    setScheduleData([])

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

      // Avoid duplicated rows when careers share classes.
      const uniqueByKey = new Map<string, ScheduledClass>()
      merged.forEach((course) => {
        const key = [
          course.subject,
          course.curse_type,
          course.day,
          course.starts_at,
          course.room,
          course.build,
          [...course.responsibles].sort().join("|"),
        ].join("::")
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al calcular horario"
      setScheduleError(message)
      toast.error(message)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const toggleCourseType = (type: string) => {
    setSelectedCourseTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleBuild = (build: string) => {
    setSelectedBuilds((prev) =>
      prev.includes(build) ? prev.filter((b) => b !== build) : [...prev, build]
    )
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

  const toggleCursosCareer = (careerId: string) => {
    setCursosCareers((prev) =>
      prev.includes(careerId) ? prev.filter((id) => id !== careerId) : [...prev, careerId]
    )
  }

  // Get all unique persons from schedule data
  const getAllPersons = (): string[] => {
    const persons = new Set<string>()
    scheduleData.forEach((course) => {
      course.responsibles.forEach((person) => {
        persons.add(person)
      })
    })
    return Array.from(persons).sort()
  }

  // Get schedule for selected person organized by day
  const getPersonSchedule = () => {
    if (!selectedPerson) return {}

    const personSchedule: { [day: string]: ScheduledClass[] } = {}

    scheduleData.forEach((course) => {
      if (course.responsibles.includes(selectedPerson)) {
        if (!personSchedule[course.day]) {
          personSchedule[course.day] = []
        }
        personSchedule[course.day].push(course)
      }
    })

    // Sort by day order
    const sortedSchedule: { [day: string]: ScheduledClass[] } = {}
    DAYS_OF_WEEK.forEach((day) => {
      if (personSchedule[day]) {
        // Sort courses by start time
        sortedSchedule[day] = personSchedule[day].sort((a, b) => a.starts_at - b.starts_at)
      }
    })

    return sortedSchedule
  }

  // Fetch subjects for selected career (Cursos tab)
  const handleFetchSubjects = async () => {
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

      // Avoid duplicated rows when multiple careers share courses.
      const uniqueByKey = new Map<string, Subject>()
      merged.forEach((subject) => {
        const key = [
          subject.subject,
          subject.curse_type,
          subject.day,
          subject.starts_at,
          subject.room,
          subject.build,
        ].join("::")
        if (!uniqueByKey.has(key)) {
          uniqueByKey.set(key, subject)
        }
      })

      const mergedSubjects = Array.from(uniqueByKey.values())
      setSubjectsData(mergedSubjects)
      if (mergedSubjects.length === 0) {
        toast.info("No se encontraron cursos para las carreras seleccionadas")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al obtener cursos"
      setSubjectsError(message)
      toast.error(message)
    } finally {
      setLoadingSubjects(false)
    }
  }

  // Filter subjects by build and days
  const filteredSubjectsData = useMemo(() => {
    let filtered = subjectsData

    // Filter by build
    if (cursosFilterBuild !== "todos" && cursosFilterBuild) {
      filtered = filtered.filter((subject) => subject.build === cursosFilterBuild)
    }

    // Filter by days
    if (cursosFilterDays.length > 0) {
      filtered = filtered.filter((subject) => cursosFilterDays.includes(subject.day))
    }

    return filtered
  }, [subjectsData, cursosFilterBuild, cursosFilterDays])

  // Convert subjects to event groups grouped by curse_type
  const subjectsEventGroups = useMemo(() => {
    return subjectsToEventGroups(filteredSubjectsData)
  }, [filteredSubjectsData])

  // Get unique builds from availability data
  const availabilityBuilds = useMemo(() => {
    const builds = new Set<string>()
    Object.values(availabilityData).forEach((entries) => {
      entries.forEach((entry) => builds.add(entry.build))
    })
    return Array.from(builds).sort()
  }, [availabilityData])

  // Filter availability data by selected build and days
  const filteredAvailabilityData = useMemo(() => {
    const filtered: AvailabilityByPerson = {}
    Object.entries(availabilityData).forEach(([person, entries]) => {
      let filteredEntries = entries

      // Filter by build
      if (availabilityFilterBuild !== "todos" && availabilityFilterBuild) {
        filteredEntries = filteredEntries.filter((e) => e.build === availabilityFilterBuild)
      }

      // Filter by days
      if (availabilityFilterDays.length > 0) {
        filteredEntries = filteredEntries.filter((e) => availabilityFilterDays.includes(e.day))
      }

      if (filteredEntries.length > 0) {
        filtered[person] = filteredEntries
      }
    })
    return filtered
  }, [availabilityData, availabilityFilterBuild, availabilityFilterDays])

  // Count total availability entries
  const totalAvailabilityCount = useMemo(() => {
    return Object.values(availabilityData).reduce((acc, entries) => acc + entries.length, 0)
  }, [availabilityData])

  const filteredAvailabilityCount = useMemo(() => {
    return Object.values(filteredAvailabilityData).reduce((acc, entries) => acc + entries.length, 0)
  }, [filteredAvailabilityData])

  // Convert availability data to calendar events
  const availabilityCalendarEvents = useMemo(() => {
    return availabilityToCalendarEvents(filteredAvailabilityData)
  }, [filteredAvailabilityData])

  // Filter schedule data by selected person and days
  const filteredScheduleData = useMemo(() => {
    let filtered = scheduleData

    // Filter by person
    if (selectedPerson !== "todos" && selectedPerson) {
      filtered = filtered.filter((course) =>
        course.responsibles.includes(selectedPerson)
      )
    }

    // Filter by days
    if (scheduleFilterDays.length > 0) {
      filtered = filtered.filter((course) => scheduleFilterDays.includes(course.day))
    }

    return filtered
  }, [scheduleData, selectedPerson, scheduleFilterDays])

  // Convert filtered schedule data to event groups (grouped by curse_type)
  const scheduleEventGroups = useMemo(() => {
    return scheduleToEventGroups(filteredScheduleData)
  }, [filteredScheduleData])

  // Get unique course types from schedule data
  const scheduleCourseTypes = useMemo(() => {
    const types = new Set<string>()
    scheduleData.forEach((course) => types.add(course.curse_type))
    return Array.from(types)
  }, [scheduleData])

  // Get unique course types from subjects data
  const subjectsCourseTypes = useMemo(() => {
    const types = new Set<string>()
    filteredSubjectsData.forEach((subject) => types.add(subject.curse_type))
    return Array.from(types)
  }, [filteredSubjectsData])

  // Get unique builds from subjects data
  const subjectsBuilds = useMemo(() => {
    const builds = new Set<string>()
    subjectsData.forEach((subject) => builds.add(subject.build))
    return Array.from(builds).sort()
  }, [subjectsData])

  // Copy personal schedule to clipboard
  const copyPersonalScheduleToClipboard = () => {
    if (!selectedPerson || selectedPerson === "todos") return

    const personSchedule = getPersonSchedule()
    let text = `Horario de ${selectedPerson}\n`
    text += `${'='.repeat(50)}\n\n`

    Object.entries(personSchedule).forEach(([day, courses]) => {
      text += `${day}:\n`
      courses.forEach((course) => {
        text += `  - ${course.subject} (${course.curse_type})\n`
        text += `    Hora: ${course.starts_at}:00 | Aula: ${course.room} | Edificio: ${course.build}\n`
        const companions = course.responsibles.filter(p => p !== selectedPerson)
        text += `    Companeros: ${companions.length > 0 ? companions.join(", ") : "N/A"}\n`
      })
      text += `\n`
    })

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Horario copiado al portapapeles")
    }).catch(() => {
      toast.error("Error al copiar al portapapeles")
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Planificar</CardTitle>
              <CardDescription>
                Consulta disponibilidad y planifica visitas de pasadas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="disponibilidad" className="w-full">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="cursos" className="flex-1">
                Cursos por carrera
              </TabsTrigger>
              <TabsTrigger value="disponibilidad" className="flex-1">
                Disponibilidad
              </TabsTrigger>
              <TabsTrigger value="planificacion" className="flex-1">
                Pasadas
              </TabsTrigger>
            </TabsList>

            {/* Disponibilidad Tab */}
            <TabsContent value="disponibilidad" className="flex flex-col gap-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <Button onClick={handleFetchAvailability} disabled={loadingAvailability} className="w-full">
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
                  {/* Filters and view mode toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground hidden sm:inline">Edificio:</Label>
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
                      <DayFilter
                        selectedDays={availabilityFilterDays}
                        onSelectedDaysChange={setAvailabilityFilterDays}
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground">
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
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  {entry.build}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <WeeklyCalendar
                      events={availabilityCalendarEvents}
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
            </TabsContent>

            {/* Planificacion de Pasadas Tab */}
            <TabsContent value="planificacion" className="flex flex-col gap-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="grid gap-4">
                  {/* Career Selection */}
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllCareers}
                        disabled={loadingCareers || careers.length === 0}
                      >
                        Seleccionar todas
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllCareers}
                        disabled={loadingCareers || selectedCareers.length === 0}
                      >
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
                                <Checkbox
                                  id={`schedule-career-${id}`}
                                  checked={selectedCareers.includes(id)}
                                  onCheckedChange={() => toggleCareer(id)}
                                />
                                <label
                                  htmlFor={`schedule-career-${id}`}
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {career.career}
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Types */}
                  <div>
                    <Label className="text-foreground mb-3 block">Tipo de Cursos</Label>
                    <div className="flex flex-wrap gap-4">
                      {["teorica", "practica", "teorica-practica"].map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedCourseTypes.includes(type)}
                            onCheckedChange={() => toggleCourseType(type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm font-medium cursor-pointer capitalize"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Builds */}
                  <div>
                    <Label className="text-foreground mb-3 block">Edificios</Label>
                    <div className="flex flex-wrap gap-4">
                      {BUILDS.map((build) => (
                        <div key={build} className="flex items-center gap-2">
                          <Checkbox
                            id={`build-${build}`}
                            checked={selectedBuilds.includes(build)}
                            onCheckedChange={() => toggleBuild(build)}
                          />
                          <label
                            htmlFor={`build-${build}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {build}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Min Responsibles */}
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

                  <Button
                    onClick={handleFetchSchedule}
                    disabled={loadingSchedule || selectedCareers.length === 0}
                    className="w-full sm:w-auto"
                  >
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
                  {/* Filters and View Mode Toggle */}
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
                            {getAllPersons().map((person) => (
                              <SelectItem key={person} value={person}>
                                {person}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DayFilter
                        selectedDays={scheduleFilterDays}
                        onSelectedDaysChange={setScheduleFilterDays}
                      />
                      {selectedPerson && selectedPerson !== "todos" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyPersonalScheduleToClipboard}
                          className="gap-2 h-9"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copiar Horario
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {filteredScheduleData.length} cursos
                      </span>
                      <ViewModeToggle
                        value={scheduleViewMode}
                        onChange={setScheduleViewMode}
                      />
                    </div>
                  </div>

                  {scheduleViewMode === "lista" ? (
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead className="text-xs font-semibold text-foreground">Asignatura</TableHead>
                              <TableHead className="text-xs font-semibold text-foreground">Tipo</TableHead>
                              <TableHead className="text-xs font-semibold text-foreground">Dia</TableHead>
                              <TableHead className="text-xs font-semibold text-foreground">Horario</TableHead>
                              <TableHead className="text-xs font-semibold text-foreground">Aula</TableHead>
                              <TableHead className="text-xs font-semibold text-foreground">Edificio</TableHead>
                              <TableHead className="text-xs font-semibold text-foreground">Responsables</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredScheduleData.map((course, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {course.subject}
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {course.curse_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {course.day}
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {course.starts_at}:00
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {course.room}
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                    {course.build}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-foreground">
                                  <div className="flex flex-wrap gap-1">
                                    {course.responsibles.map((person, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {person}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  ) : (
                    /* Calendar View - Single calendar with course type filter */
                    <WeeklyCalendar
                      eventGroups={scheduleEventGroups}
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
            </TabsContent>
            {/* Cursos por Carrera Tab */}
            <TabsContent value="cursos" className="flex flex-col gap-6">
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
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                            disabled={loadingCareers}
                          >
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
                    <Button onClick={handleFetchSubjects} disabled={loadingSubjects || cursosCareers.length === 0} className="w-full sm:w-auto sm:flex-1">
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
                  {/* Build filter and view mode toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground hidden sm:inline">Edificio:</Label>
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
                      <DayFilter
                        selectedDays={cursosFilterDays}
                        onSelectedDaysChange={setCursosFilterDays}
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {filteredSubjectsData.length} de {subjectsData.length} cursos
                      </span>
                    </div>
                    <ViewModeToggle value={cursosViewMode} onChange={setCursosViewMode} />
                  </div>

                  {cursosViewMode === "lista" ? (
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                        <span className="text-sm font-medium text-foreground">
                          {filteredSubjectsData.length} cursos encontrados
                        </span>
                      </div>
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead className="text-xs font-semibold text-foreground">Asignatura</TableHead>
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
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {subject.subject}
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {subject.curse_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {subject.day}
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {subject.starts_at}:00
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  {subject.room}
                                </TableCell>
                                <TableCell className="text-xs text-foreground whitespace-nowrap">
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                    {subject.build}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
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
                  <p>Selecciona una carrera y carga los cursos</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
