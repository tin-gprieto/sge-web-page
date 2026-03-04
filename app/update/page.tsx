"use client"

import { useState, useCallback, useEffect } from "react"
import { useGoogleAuth } from "@/components/google-auth-provider"
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
import { RefreshCw, Loader2, CheckCircle2, XCircle, Plus } from "lucide-react"
import { insertParticipants, getExpeditionList, createExpedition, type Expedition } from "@/lib/api"
import { excelToParticipantsWithWon, validateParticipantData } from "@/lib/models"

export default function UpdatePage() {
  const { user, login } = useGoogleAuth()

  const [expeditions, setExpeditions] = useState<Expedition[]>([])
  const [expeditionId, setExpeditionId] = useState<string>("")
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString())
  const [excelData, setExcelData] = useState<Record<string, unknown>[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; reason: string } | null>(null)
  
  // New expedition dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newExpeditionName, setNewExpeditionName] = useState("")
  const [isCreatingExpedition, setIsCreatingExpedition] = useState(false)

  // Fetch expeditions on mount
  useEffect(() => {
    async function fetchExpeditions() {
      try {
        const response = await getExpeditionList()
        setExpeditions(response.list)
      } catch (err) {
        console.error("Error fetching expeditions:", err)
        toast.error("Error al cargar las expediciones")
      }
    }
    fetchExpeditions()
  }, [])

  const handleExcelChange = useCallback(
    (data: Record<string, unknown>[] | null, name: string) => {
      setExcelData(data)
      setFileName(name)
      setResult(null)
    },
    []
  )

  const selectedExpedition = expeditions.find(e => e.id.toString() === expeditionId)

  const isFormComplete =
    expeditionId !== "" &&
    currentYear.trim() !== "" &&
    excelData !== null

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
    if (!user) {
      toast.error("Debes iniciar sesion con Google para enviar los datos.")
      login()
      return
    }

    if (!isFormComplete || !excelData || !selectedExpedition) return

    // Validate Excel data
    const validation = validateParticipantData(excelData)
    if (!validation.valid) {
      setResult({ 
        success: false, 
        reason: `Faltan campos requeridos: ${validation.missingFields.join(", ")}` 
      })
      toast.error("El archivo Excel no tiene los campos requeridos")
      return
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const participantList = excelToParticipantsWithWon(excelData)
      
      await insertParticipants({
        expedition: selectedExpedition.name,
        year: parseInt(currentYear, 10),
        list: participantList,
      })

      setResult({ success: true, reason: `${participantList.length} participantes insertados correctamente` })
      toast.success("Datos actualizados correctamente")
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
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                result.success
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
            ) : !user ? (
              "Iniciar sesion para enviar"
            ) : (
              "Actualizar Expedicion"
            )}
          </Button>

          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              Necesitas iniciar sesion con Google para enviar los datos al servidor.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
