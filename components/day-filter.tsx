"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]

interface DayFilterProps {
  selectedDays: string[]
  onSelectedDaysChange: (days: string[]) => void
  className?: string
}

export function DayFilter({
  selectedDays,
  onSelectedDaysChange,
  className,
}: DayFilterProps) {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onSelectedDaysChange(selectedDays.filter((d) => d !== day))
    } else {
      onSelectedDaysChange([...selectedDays, day])
    }
  }

  const selectAll = () => {
    onSelectedDaysChange([...DAYS_OF_WEEK])
  }

  const clearAll = () => {
    onSelectedDaysChange([])
  }

  const allSelected = selectedDays.length === DAYS_OF_WEEK.length || selectedDays.length === 0
  const someSelected = selectedDays.length > 0 && selectedDays.length < DAYS_OF_WEEK.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 h-9", className)}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dias</span>
          {someSelected && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {selectedDays.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Filtrar por dia
            </Label>
          </div>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.length === 0 || selectedDays.includes(day)
              return (
                <div key={day} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (selectedDays.length === 0) {
                        // First selection: select all except this one
                        onSelectedDaysChange(DAYS_OF_WEEK.filter((d) => d !== day))
                      } else {
                        toggleDay(day)
                      }
                    }}
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {day}
                  </label>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="flex-1 h-7 text-xs"
            >
              Todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="flex-1 h-7 text-xs"
              disabled={selectedDays.length === 0}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
