"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { AllParticipant } from "@/lib/api"

// Colors for pie chart - computed values, not CSS variables
const CAREER_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#ca8a04", // yellow-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
  "#059669", // emerald-600
  "#7c3aed", // violet-600
  "#0284c7", // sky-600
]

interface ParticipantsChartsProps {
  participants: AllParticipant[]
  isLoading: boolean
}

interface CareerData {
  name: string
  value: number
  fill: string
}

interface CensusData {
  range: string
  count: number
}

export function ParticipantsCharts({ participants, isLoading }: ParticipantsChartsProps) {
  // Process data for career pie chart
  const { careerData, participantsWithoutCareer, totalWithCareer } = useMemo(() => {
    const careerCounts: Record<string, number> = {}
    let withoutCareer = 0

    participants.forEach((p) => {
      if (!p.career || p.career.trim() === "") {
        withoutCareer++
      } else {
        careerCounts[p.career] = (careerCounts[p.career] || 0) + 1
      }
    })

    // Convert to array, filter out careers with 0 participants, and sort by count
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
      totalWithCareer: data.reduce((sum, d) => sum + d.value, 0),
    }
  }, [participants])

  // Process data for census bar chart
  const censusData = useMemo(() => {
    // Filter participants with valid census
    const validCensus = participants
      .filter((p) => p.census !== null && p.census > 0)
      .map((p) => p.census as number)

    if (validCensus.length === 0) return []

    // Find min and max thousands
    const minCensus = Math.min(...validCensus)
    const maxCensus = Math.max(...validCensus)
    const minThousand = Math.floor(minCensus / 1000) * 1000
    const maxThousand = Math.floor(maxCensus / 1000) * 1000

    // Create buckets for each thousand range
    const buckets: Record<number, number> = {}
    for (let t = minThousand; t <= maxThousand; t += 1000) {
      buckets[t] = 0
    }

    // Count participants in each bucket
    validCensus.forEach((census) => {
      const bucket = Math.floor(census / 1000) * 1000
      buckets[bucket] = (buckets[bucket] || 0) + 1
    })

    // Convert to array format
    const data: CensusData[] = Object.entries(buckets)
      .map(([range, count]) => ({
        range: `${parseInt(range) / 1000}k`,
        count,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.range)
        const bNum = parseInt(b.range)
        return aNum - bNum
      })

    return data
  }, [participants])

  // Chart configs
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

  const censusChartConfig = {
    count: {
      label: "Participantes",
      color: "#2563eb",
    },
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Participantes por Carrera</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent className="flex h-48 sm:h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Distribucion por Padron</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent className="flex h-48 sm:h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Participantes por Carrera</CardTitle>
            <CardDescription className="text-xs sm:text-sm">No hay datos disponibles</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Distribucion por Padron</CardTitle>
            <CardDescription className="text-xs sm:text-sm">No hay datos disponibles</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Career Pie Chart */}
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
          <ChartContainer config={careerChartConfig} className="mx-auto aspect-square h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{name}:</span>
                          <span>{value}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={careerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={typeof window !== "undefined" && window.innerWidth < 640 ? 60 : 80}
                  label={({ name, percent }) =>
                    `${name.length > 8 ? name.substring(0, 8) + "..." : name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={true}
                >
                  {careerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: "9px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Census Bar Chart */}
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Distribucion por Padron</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Agrupado por miles (ej: 105k = 105000-105999)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ChartContainer config={censusChartConfig} className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
