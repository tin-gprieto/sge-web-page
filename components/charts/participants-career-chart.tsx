"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getAllParticipants, type AllParticipant } from "@/lib/api"

const CAREER_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#ca8a04",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#db2777",
  "#4f46e5",
  "#059669",
  "#7c3aed",
  "#0284c7",
]

interface CareerData {
  name: string
  value: number
  fill: string
}

export function ParticipantsCareerChart() {
  const [participants, setParticipants] = useState<AllParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function fetchParticipants() {
      try {
        setIsLoading(true)
        const response = await getAllParticipants()

        if (isActive) {
          setParticipants(response.list)
        }
      } catch (err) {
        console.error("Error fetching participants:", err)
        toast.error("Error al cargar los participantes para los graficos")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    fetchParticipants()

    return () => {
      isActive = false
    }
  }, [])

  const { careerData, participantsWithoutCareer, totalWithCareer } = useMemo(() => {
    const careerCounts: Record<string, number> = {}
    let withoutCareer = 0

    participants.forEach((participant) => {
      if (!participant.career || participant.career.trim() === "" || participant.career === "Sin carrera") {
        withoutCareer++
      } else {
        careerCounts[participant.career] = (careerCounts[participant.career] || 0) + 1
      }
    })

    const data: CareerData[] = Object.entries(careerCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        fill: CAREER_COLORS[index % CAREER_COLORS.length],
      }))

    return {
      careerData: data,
      participantsWithoutCareer: withoutCareer,
      totalWithCareer: data.reduce((sum, item) => sum + item.value, 0),
    }
  }, [participants])

  const careerChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}

    careerData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      }
    })

    return config
  }, [careerData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Participantes por Carrera</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center sm:h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Participantes por Carrera</CardTitle>
          <CardDescription className="text-xs sm:text-sm">No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-sm sm:text-base">Participantes por Carrera</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Total: {totalWithCareer} participantes
          {participantsWithoutCareer > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({participantsWithoutCareer} sin carrera)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex max-h-48 shrink-0 flex-col gap-1 overflow-y-auto pr-1 sm:max-h-64">
            {careerData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-xs">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
          <ChartContainer config={careerChartConfig} className="h-48 flex-1 aspect-square sm:h-64">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const percent =
                        totalWithCareer > 0
                          ? ((Number(value) / totalWithCareer) * 100).toFixed(1)
                          : "0"

                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{name}:</span>
                          <span>
                            {value} ({percent}%)
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Pie
                data={careerData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={typeof window !== "undefined" && window.innerWidth < 640 ? 70 : 95}
                label={false}
                labelLine={false}
              >
                {careerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}