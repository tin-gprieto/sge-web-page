"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getAllParticipants, type AllParticipant } from "@/lib/api"

interface CensusData {
  range: string
  count: number
}

export function ParticipantsCensusChart() {
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

  const censusData = useMemo(() => {
    const validCensus = participants
      .filter((participant) => participant.census !== null && participant.census > 0)
      .map((participant) => participant.census as number)

    if (validCensus.length === 0) {
      return []
    }

    const minCensus = Math.min(...validCensus)
    const maxCensus = Math.max(...validCensus)
    const minThousand = Math.floor(minCensus / 1000) * 1000
    const maxThousand = Math.floor(maxCensus / 1000) * 1000

    const buckets: Record<number, number> = {}
    for (let thousand = minThousand; thousand <= maxThousand; thousand += 1000) {
      buckets[thousand] = 0
    }

    validCensus.forEach((census) => {
      const bucket = Math.floor(census / 1000) * 1000
      buckets[bucket] = (buckets[bucket] || 0) + 1
    })

    const data: CensusData[] = Object.entries(buckets)
      .map(([range, count]) => ({
        range: `${parseInt(range, 10) / 1000}k`,
        count,
      }))
      .sort((a, b) => parseInt(a.range, 10) - parseInt(b.range, 10))

    return data
  }, [participants])

  const censusChartConfig = {
    count: {
      label: "Participantes",
      color: "#2563eb",
    },
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Distribucion por Padron</CardTitle>
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
          <CardTitle className="text-sm sm:text-base">Distribucion por Padron</CardTitle>
          <CardDescription className="text-xs sm:text-sm">No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-sm sm:text-base">Distribucion por Padron</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Agrupado por miles (ej: 105k = 105000-105999)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={censusChartConfig} className="h-48 w-full sm:h-64">
          <BarChart data={censusData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Participantes:</span>
                      <span>{value}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}