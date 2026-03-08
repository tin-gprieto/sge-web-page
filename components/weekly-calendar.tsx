"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
const HOURS = Array.from({ length: 12 }, (_, i) => i + 5) // 05:00 to 16:00

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
}: WeeklyCalendarProps) {
  // Combine all events if using groups
  const allEvents = useMemo(() => {
    if (eventGroups) {
      return eventGroups.flatMap((group) => group.events)
    }
    return events
  }, [events, eventGroups])

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    DAYS_OF_WEEK.forEach((day) => {
      grouped[day] = []
    })
    
    allEvents.forEach((event) => {
      const normalizedDay = DAYS_OF_WEEK.find(
        (d) => d.toLowerCase() === event.day.toLowerCase()
      )
      if (normalizedDay) {
        grouped[normalizedDay].push(event)
      }
    })
    
    return grouped
  }, [allEvents])

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

                {/* Events */}
                <div className="absolute inset-0 p-0.5">
                  {(eventsByDay[day] || []).map((event, eventIndex) => {
                    const overlapping = getOverlappingEvents(day, event)
                    const overlapIndex = overlapping.findIndex((e) =>
                      allEvents.indexOf(e) < allEvents.indexOf(event)
                    )
                    const totalOverlap = overlapping.length + 1
                    const width = totalOverlap > 1 ? `${100 / totalOverlap}%` : "100%"
                    const left = totalOverlap > 1 ? `${((overlapIndex + 1) * 100) / totalOverlap}%` : "0"

                    const eventColor = event.color || getColorFromString(event.title)
                    const colors = colorClasses[eventColor]

                    return (
                      <div
                        key={event.id}
                        style={{
                          ...getEventStyle(event),
                          width,
                          left,
                        }}
                        className={cn(
                          "absolute rounded-md border p-1 overflow-hidden transition-shadow hover:shadow-md cursor-default",
                          colors.bg,
                          colors.border
                        )}
                      >
                        <div className="flex flex-col h-full gap-0.5">
                          <span
                            className={cn(
                              "text-[10px] font-semibold leading-tight line-clamp-2",
                              colors.text
                            )}
                          >
                            {event.title}
                          </span>
                          {event.subtitle && (
                            <span className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
                              {event.subtitle}
                            </span>
                          )}
                          {event.labels && event.labels.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-auto">
                              {event.labels.slice(0, 2).map((label, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[8px] px-1 py-0 h-auto"
                                >
                                  {label}
                                </Badge>
                              ))}
                              {event.labels.length > 2 && (
                                <span className="text-[8px] text-muted-foreground">
                                  +{event.labels.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
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
