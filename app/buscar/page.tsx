"use client"

import { Search, MapPin, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParticipantsCareerChart } from "@/components/charts/participants-career-chart"
import { ParticipantsCensusChart } from "@/components/charts/participants-census-chart"
import { ExpeditionSearchTab } from "@/components/buscar/expedition-search-tab"
import { ParticipantSearchTab } from "@/components/buscar/participant-search-tab"

export default function BuscarPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ParticipantsCareerChart />
        <ParticipantsCensusChart />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Buscar</CardTitle>
              <CardDescription>
                Busca participantes por nombre o padron, o consulta los datos de una expedición.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="participant" className="w-full">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="participant" className="flex-1 gap-2">
                <User className="h-4 w-4" />
                Participante
              </TabsTrigger>
              <TabsTrigger value="expedition" className="flex-1 gap-2">
                <MapPin className="h-4 w-4" />
                Expedición
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participant" className="flex flex-col gap-6">
              <ParticipantSearchTab />
            </TabsContent>

            <TabsContent value="expedition" className="flex flex-col gap-6">
              <ExpeditionSearchTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
