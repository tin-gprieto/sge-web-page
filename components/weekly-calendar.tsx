"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 07:00 to 23:00

export interface CalendarEvent {
  id: string
  title: string
  subtitle?: string
  day: string
  startsAt: number
  finishesAt?: number
  labels?: string[]
  color?: "default" | "primary" | "secondary" | "accent" | "muted"
  metadata?: Record<string, string>
}

export interface EventGroup {
  groupTitle: string
  events: CalendarEvent[]
}

interface WeeklyCalendarProps {
  events?: CalendarEvent[]
  eventGroups?: EventGroup[]
  showGroupLabels?: boolean
  cellHeight?: number
  className?: string
  /** Available course types for filtering (shows toggle if provided) */
  courseTypes?: string[]
  /** Currently selected course type filter */
  selectedCourseType?: string
  /** Callback when course type filter changes */
  onCourseTypeChange?: (type: string) => void
}

// Color mappings for events
const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  default: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
  },
  primary: {
    bg: "bg-chart-1/10",
    border: "border-chart-1/30",
    text: "text-chart-1",
  },
  secondary: {
    bg: "bg-chart-2/10",
    border: "border-chart-2/30",
    text: "text-chart-2",
  },
  accent: {
    bg: "bg-chart-3/10",
    border: "border-chart-3/30",
    text: "text-chart-3",
  },
  muted: {
    bg: "bg-muted",
    border: "border-muted-foreground/20",
    text: "text-muted-foreground",
  },
}

// Generate consistent color from string
function getColorFromString(str: string): "default" | "primary" | "secondary" | "accent" | "muted" {
  const colors: Array<"default" | "primary" | "secondary" | "accent" | "muted"> = [
    "default",
    "primary",
    "secondary",
    "accent",
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function WeeklyCalendar({
  events = [],
  eventGroups,
  showGroupLabels = false,
  cellHeight = 48,
  className,
  courseTypes,
  selectedCourseType,
  onCourseTypeChange,
}: WeeklyCalendarProps) {
  // Combine all events if using groups
  const allEvents = useMemo(() => {
    let combinedEvents: CalendarEvent[]
    if (eventGroups) {
      combinedEvents = eventGroups.flatMap((group) => group.events)
    } else {
      combinedEvents = events
    }
    
    // Filter by course type if selected
    if (selectedCourseType && selectedCourseType !== "todos") {
      combinedEvents = combinedEvents.filter(
        (e) => e.metadata?.type?.toLowerCase() === selectedCourseType.toLowerCase()
      )
    }
    
    return combinedEvents
  }, [events, eventGroups, selectedCourseType])

  // Group events by day and hour slot (merge overlapping events)
  const eventsByDayAndHour = useMemo(() => {
    const grouped: Record<string, Record<number, CalendarEvent[]>> = {}
    DAYS_OF_WEEK.forEach((day) => {
      grouped[day] = {}
    })
    
    allEvents.forEach((event) => {
      const normalizedDay = DAYS_OF_WEEK.find(
        (d) => d.toLowerCase() === event.day.toLowerCase()
      )
      if (normalizedDay) {
        const hour = event.startsAt
        if (!grouped[normalizedDay][hour]) {
          grouped[normalizedDay][hour] = []
        }
        grouped[normalizedDay][hour].push(event)
      }
    })
    
    return grouped
  }, [allEvents])

  // Flatten for legacy compatibility
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    DAYS_OF_WEEK.forEach((day) => {
      grouped[day] = Object.values(eventsByDayAndHour[day] || {}).flat()
    })
    return grouped
  }, [eventsByDayAndHour])

  // Calculate event positioning
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = Math.max(event.startsAt, HOURS[0])
    const endHour = event.finishesAt ?? event.startsAt + 1
    const duration = Math.min(endHour, HOURS[HOURS.length - 1] + 1) - startHour
    
    const topOffset = (startHour - HOURS[0]) * cellHeight
    const height = duration * cellHeight - 4 // 4px gap
    
    return {
      top: `${topOffset}px`,
      height: `${Math.max(height, cellHeight - 4)}px`,
    }
  }

  // Find overlapping events in the same day/time slot
  const getOverlappingEvents = (day: string, event: CalendarEvent) => {
    const dayEvents = eventsByDay[day] || []
    return dayEvents.filter((e) => {
      if (e.id === event.id) return false
      const eStart = e.startsAt
      const eEnd = e.finishesAt ?? e.startsAt + 1
      const eventStart = event.startsAt
      const eventEnd = event.finishesAt ?? event.startsAt + 1
      return eStart < eventEnd && eEnd > eventStart
    })
  }

  const totalHeight = HOURS.length * cellHeight

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Course type filter toggle */}
      {courseTypes && courseTypes.length > 0 && onCourseTypeChange && (
        <div className="border-b border-border bg-muted/30 p-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Tipo:</span>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 gap-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => onCourseTypeChange("todos")}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                (!selectedCourseType || selectedCourseType === "todos")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Todos
            </button>
            {courseTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onCourseTypeChange(type)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors capitalize",
                  selectedCourseType === type
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
      <ScrollArea className="w-full">
        <div className="min-w-[700px]">
          {/* Header row with days */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-border bg-muted/50">
            <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border">
              Hora
            </div>
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold text-foreground border-r border-border last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar body */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)]">
            {/* Time column */}
            <div className="border-r border-border">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: `${cellHeight}px` }}
                  className="flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground border-b border-border/50"
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="relative border-r border-border last:border-r-0"
                style={{ height: `${totalHeight}px` }}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${cellHeight}px` }}
                    className="border-b border-border/30"
                  />
                ))}

                {/* Events - merged by hour slot */}
                <div className="absolute inset-0 p-0.5">
                  <TooltipProvider delayDuration={100}>
                    {Object.entries(eventsByDayAndHour[day] || {}).map(([hourStr, hourEvents]) => {
                      const hour = parseInt(hourStr, 10)
                      if (hourEvents.length === 0) return null

                      // Use first event for positioning and base styling
                      const firstEvent = hourEvents[0]
                      const eventColor = firstEvent.color || getColorFromString(firstEvent.title)
                      const colors = colorClasses[eventColor]

                      const topOffset = (hour - HOURS[0]) * cellHeight
                      const height = cellHeight - 4

                      // Check if multiple events in this slot
                      const hasMultiple = hourEvents.length > 1

                      return (
                        <Tooltip key={`${day}-${hour}`}>
                          <TooltipTrigger asChild>
                            <div
                              style={{
                                top: `${topOffset}px`,
                                height: `${Math.max(height, cellHeight - 4)}px`,
                                width: "100%",
                                left: "0",
                              }}
                              className={cn(
                                "absolute rounded-md border p-1 overflow-hidden transition-shadow hover:shadow-md cursor-pointer",
                                colors.bg,
                                colors.border,
                                hasMultiple && "ring-1 ring-foreground/20"
                              )}
                            >
                              <div className="flex flex-col h-full gap-0.5">
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold leading-tight line-clamp-1",
                                    colors.text
                                  )}
                                >
                                  {hasMultiple
                                    ? `${hourEvents.length} eventos`
                                    : firstEvent.title}
                                </span>
                                {!hasMultiple && firstEvent.subtitle && (
                                  <span className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
                                    {firstEvent.subtitle}
                                  </span>
                                )}
                                {hasMultiple && (
                                  <span className="text-[8px] text-muted-foreground">
                                    Mantener para más detalles
                                  </span>
                                )}
                                {!hasMultiple && firstEvent.labels && firstEvent.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 mt-auto">
                                    {firstEvent.labels.slice(0, 2).map((label, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-[8px] px-1 py-0 h-auto"
                                      >
                                        {label}
                                      </Badge>
                                    ))}
                                    {firstEvent.labels.length > 2 && (
                                      <span className="text-[8px] text-muted-foreground">
                                        +{firstEvent.labels.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            className="max-w-xs p-0 bg-popover border border-border shadow-lg"
                          >
                            <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                              {hourEvents.map((event, idx) => {
                                const evColor = event.color || getColorFromString(event.title)
                                const evColors = colorClasses[evColor]
                                return (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "rounded-md border p-2",
                                      evColors.bg,
                                      evColors.border
                                    )}
                                  >
                                    <div className={cn("text-xs font-semibold", evColors.text)}>
                                      {event.title}
                                    </div>
                                    {event.subtitle && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {event.subtitle}
                                      </div>
                                    )}
                                    {event.labels && event.labels.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {event.labels.map((label, i) => (
                                          <Badge
                                            key={i}
                                            variant="outline"
                                            className="text-[9px] px-1 py-0 h-auto"
                                          >
                                            {label}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Group legend */}
      {showGroupLabels && eventGroups && eventGroups.length > 0 && (
        <div className="border-t border-border p-3 bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {eventGroups.map((group, index) => {
              const color = getColorFromString(group.groupTitle)
              const colors = colorClasses[color]
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn("text-xs", colors.bg, colors.border, colors.text)}
                >
                  {group.groupTitle} ({group.events.length})
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

// Helper to convert AvailabilityEntry to CalendarEvent
export function availabilityToCalendarEvents(
  availabilityByPerson: Record<string, Array<{
    person: string
    day: string
    starts_at: number
    finishes_at: number
    build: string
  }>>
): CalendarEvent[] {
  const events: CalendarEvent[] = []
  
  Object.entries(availabilityByPerson).forEach(([person, entries]) => {
    entries.forEach((entry, index) => {
      events.push({
        id: `${person}-${entry.day}-${index}`,
        title: person,
        subtitle: entry.build,
        day: entry.day,
        startsAt: entry.starts_at,
        finishesAt: entry.finishes_at,
        labels: [entry.build],
        color: getColorFromString(person),
      })
    })
  })
  
  return events
}

// Helper to convert Subject list to EventGroups (grouped by curse_type)
export function subjectsToEventGroups(
  subjects: Array<{
    subject: string
    curse_type: string
    day: string
    starts_at: number
    room: string
    build: string
  }>
): EventGroup[] {
  const groupedByCourseType: Record<string, EventGroup> = {}

  subjects.forEach((s, index) => {
    const groupKey = s.curse_type

    if (!groupedByCourseType[groupKey]) {
      groupedByCourseType[groupKey] = {
        groupTitle: s.curse_type.charAt(0).toUpperCase() + s.curse_type.slice(1),
        events: [],
      }
    }

    groupedByCourseType[groupKey].events.push({
      id: `subject-${s.subject}-${s.day}-${index}`,
      title: s.subject,
      subtitle: `${s.room} · ${s.build}`,
      day: s.day,
      startsAt: s.starts_at,
      finishesAt: s.starts_at + 1,
      labels: [s.build, s.room],
      color: getColorFromString(s.curse_type),
      metadata: {
        room: s.room,
        build: s.build,
        type: s.curse_type,
      },
    })
  })

  return Object.values(groupedByCourseType)
}

// Helper to convert ScheduledClass to EventGroups (grouped by curse_type)
export function scheduleToEventGroups(
  scheduleData: Array<{
    subject: string
    curse_type: string
    day: string
    starts_at: number
    room: string
    build: string
    responsibles: string[]
  }>
): EventGroup[] {
  const groupedByCourseType: Record<string, EventGroup> = {}
  
  scheduleData.forEach((course, index) => {
    const groupKey = course.curse_type
    
    if (!groupedByCourseType[groupKey]) {
      groupedByCourseType[groupKey] = {
        groupTitle: course.curse_type.charAt(0).toUpperCase() + course.curse_type.slice(1),
        events: [],
      }
    }
    
    groupedByCourseType[groupKey].events.push({
      id: `${course.subject}-${course.day}-${index}`,
      title: course.subject,
      subtitle: `${course.room} - ${course.build}`,
      day: course.day,
      startsAt: course.starts_at,
      finishesAt: course.starts_at + 1, // Assume 1 hour duration
      labels: course.responsibles,
      color: getColorFromString(course.curse_type),
      metadata: {
        room: course.room,
        build: course.build,
        type: course.curse_type,
      },
    })
  })
  
  return Object.values(groupedByCourseType)
}
