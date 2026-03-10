"use client"

import { useState, useCallback, useEffect } from "react"
import { ExcelUpload } from "@/components/excel-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { RefreshCw, Loader2, CheckCircle2, XCircle, Plus, AlertTriangle } from "lucide-react"
import { insertParticipants, getExpeditionList, getExpeditionHistorial, createExpedition, type Expedition, type ParticipantForInsert, type ExpeditionHistorialItem } from "@/lib/api"
import { excelToParticipantsWithWon, validateParticipantDataForUpdate } from "@/lib/excel_integration"

export default function UpdatePage() {
  const [expeditions, setExpeditions] = useState<Expedition[]>([])
  const [historial, setHistorial] = useState<ExpeditionHistorialItem[]>([])
  const [expeditionId, setExpeditionId] = useState<string>("")
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString())
  const [excelData, setExcelData] = useState<Record<string, unknown>[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; reason: string } | null>(null)

  // Parsed participants list (same pattern as lotteryResult in sortout)
  const [participantList, setParticipantList] = useState<ParticipantForInsert[] | null>(null)

  // New expedition dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newExpeditionName, setNewExpeditionName] = useState("")
  const [isCreatingExpedition, setIsCreatingExpedition] = useState(false)

  // Fetch expeditions and historial on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [expeditionsRes, historialRes] = await Promise.all([
          getExpeditionList(),
          getExpeditionHistorial()
        ])
        setExpeditions(expeditionsRes.list)
        setHistorial(historialRes.list)
      } catch (err) {
        console.error("Error fetching data:", err)
        toast.error("Error al cargar las expediciones")
      }
    }
    fetchData()
  }, [])

  const handleExcelChange = useCallback(
    (data: Record<string, unknown>[] | null, name: string) => {
      setExcelData(data)
      setFileName(name)
      setResult(null)

      // Parse participants from Excel (same pattern as sortout stores lotteryResult)
      if (data) {
        const validation = validateParticipantDataForUpdate(data)
        if (validation.valid) {
          const parsed = excelToParticipantsWithWon(data)
          setParticipantList(parsed)
        } else {
          setParticipantList(null)
          setResult({
            success: false,
            reason: `Faltan campos requeridos: ${validation.missingFields.join(", ")}`
          })
        }
      } else {
        setParticipantList(null)
      }
    },
    []
  )

  const selectedExpedition = expeditions.find(e => e.id.toString() === expeditionId)

  // Check if expedition/year combo already exists in historial
  const expeditionYearExists = selectedExpedition && currentYear.trim()
    ? historial.some(h => h.name === selectedExpedition.name && h.year === parseInt(currentYear, 10))
    : false

  const isFormComplete =
    expeditionId !== "" &&
    currentYear.trim() !== "" &&
    participantList !== null && participantList.length > 0 &&
    !expeditionYearExists

  const handleCreateExpedition = async () => {
    if (!newExpeditionName.trim()) return

    setIsCreatingExpedition(true)
    try {
      const newExpedition = await createExpedition(newExpeditionName.trim())
      setExpeditions(prev => [...prev, newExpedition])
      setExpeditionId(newExpedition.id.toString())
      setNewExpeditionName("")
      setIsDialogOpen(false)
      toast.success(`Expedición "${newExpedition.name}" creada correctamente`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear expedición"
      toast.error(message)
    } finally {
      setIsCreatingExpedition(false)
    }
  }

  const handleSubmit = async () => {
    if (!isFormComplete || !participantList || !selectedExpedition) return

    setIsSubmitting(true)
    setResult(null)

    try {
      // Same pattern as sortout: pass participantList (like lotteryResult) to insertParticipants
      const response = await insertParticipants({
        expedition: selectedExpedition.name,
        year: parseInt(currentYear, 10),
        list: participantList,
      })

      console.log("Insert response:", response)

      setResult({ success: true, reason: `Guardado: ${response.inserted} insertados, ${response.repeated} repetidos, ${response.skipped} ignorados de ${response.total} total` })
      toast.success(`Guardado: ${response.inserted} insertados, ${response.repeated} repetidos, ${response.skipped} ignorados de ${response.total} total`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de conexion"
      setResult({ success: false, reason: message })
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Actualizar Expedicion</CardTitle>
              <CardDescription>
                Completa los datos y sube el Excel para actualizar la informacion.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Expedición</Label>
              <div className="flex gap-2">
                <Select
                  value={expeditionId}
                  onValueChange={(value) => {
                    setExpeditionId(value)
                    setResult(null)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar expedición" />
                  </SelectTrigger>
                  <SelectContent>
                    {expeditions.map((exp) => (
                      <SelectItem key={exp.id} value={exp.id.toString()}>
                        {exp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nueva Expedición</DialogTitle>
                      <DialogDescription>
                        Ingresa el nombre de la nueva expedición para agregarla al sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="new-expedition-name-update">Nombre</Label>
                        <Input
                          id="new-expedition-name-update"
                          placeholder="Ej: Atucha"
                          value={newExpeditionName}
                          onChange={(e) => setNewExpeditionName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateExpedition}
                        disabled={!newExpeditionName.trim() || isCreatingExpedition}
                      >
                        {isCreatingExpedition ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          "Crear Expedición"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year" className="text-foreground">Año</Label>
              <Input
                id="year"
                type="number"
                placeholder="Ej: 2026"
                value={currentYear}
                onChange={(e) => {
                  setCurrentYear(e.target.value)
                  setResult(null)
                }}
              />
            </div>
          </div>

          {expeditionYearExists && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                La expedición <strong>{selectedExpedition?.name}</strong> ya fue realizada en el año{" "}
                <strong>{currentYear}</strong>. No se puede actualizar para evitar duplicados.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Archivo Excel</Label>
            <ExcelUpload
              onDataChange={handleExcelChange}
              data={excelData}
              fileName={fileName}
            />
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${result.success
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
                }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{result.reason}</span>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isFormComplete || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Expedicion"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
