"use client"

import { useState, useCallback } from "react"
import { useGoogleAuth } from "@/components/google-auth-provider"
import { ExcelUpload } from "@/components/excel-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function UpdatePage() {
  const { user, login } = useGoogleAuth()

  const [expeditionName, setExpeditionName] = useState("")
  const [participants, setParticipants] = useState("")
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString())
  const [excelData, setExcelData] = useState<Record<string, unknown>[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; reason: string } | null>(null)

  const handleExcelChange = useCallback(
    (data: Record<string, unknown>[] | null, name: string) => {
      setExcelData(data)
      setFileName(name)
      setResult(null)
    },
    []
  )

  const isFormComplete =
    expeditionName.trim() !== "" &&
    participants.trim() !== "" &&
    currentYear.trim() !== "" &&
    excelData !== null

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesion con Google para enviar los datos.")
      login()
      return
    }

    if (!isFormComplete) return

    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          expedition_name: expeditionName.trim(),
          num_participants: parseInt(participants, 10),
          current_year: parseInt(currentYear, 10),
          excel_data: excelData,
          google_token: user.accessToken,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, reason: data.reason || "Actualizacion exitosa" })
        toast.success("Datos actualizados correctamente")
      } else {
        setResult({
          success: false,
          reason: data.reason || data.detail || "Error en la actualizacion",
        })
        toast.error(data.reason || "Error al actualizar")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de conexion"
      setResult({ success: false, reason: message })
      toast.error("Error de conexion con el servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expedition-name" className="text-foreground">Nombre de expedicion</Label>
              <Input
                id="expedition-name"
                placeholder="Ej: Expedicion Norte"
                value={expeditionName}
                onChange={(e) => {
                  setExpeditionName(e.target.value)
                  setResult(null)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="participants" className="text-foreground">Nro. de participantes</Label>
              <Input
                id="participants"
                type="number"
                min={1}
                placeholder="Ej: 25"
                value={participants}
                onChange={(e) => {
                  setParticipants(e.target.value)
                  setResult(null)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year" className="text-foreground">Anio actual</Label>
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
