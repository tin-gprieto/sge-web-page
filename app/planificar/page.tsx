"use client"

import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { DisponibilidadTab } from "../../components/disponibilidad-tab"
import { PlanificacionTab } from "../../components/planificacion-tab"
import { CursosTab } from "../../components/cursos-tab"

export default function PlanificarPage() {
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
              <CardDescription>Consulta disponibilidad y planifica visitas de pasadas.</CardDescription>
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

            <TabsContent value="disponibilidad" className="flex flex-col gap-6">
              <DisponibilidadTab />
            </TabsContent>

            <TabsContent value="planificacion" className="flex flex-col gap-6">
              <PlanificacionTab />
            </TabsContent>

            <TabsContent value="cursos" className="flex flex-col gap-6">
              <CursosTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}