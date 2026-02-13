"use client"

import { useState, useCallback } from "react"
import { useGoogleAuth } from "@/components/google-auth-provider"
import { ExcelUpload } from "@/components/excel-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Shuffle, Loader2, Download, XCircle } from "lucide-react"
import { utils, writeFile } from "xlsx"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function downloadJsonAsExcel(data: Record<string, unknown>[], filename: string) {
  const worksheet = utils.json_to_sheet(data)
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, "Resultado")
  writeFile(workbook, filename)
}

export default function SortoutPage() {
  const { user, login } = useGoogleAuth()

  const [participants, setParticipants] = useState("")
  const [excelData, setExcelData] = useState<Record<string, unknown>[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultData, setResultData] = useState<Record<string, unknown>[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExcelChange = useCallback(
    (data: Record<string, unknown>[] | null, name: string) => {
      setExcelData(data)
      setFileName(name)
      setResultData(null)
      setError(null)
    },
    []
  )

  const isFormComplete = participants.trim() !== "" && excelData !== null

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesion con Google para enviar los datos.")
      login()
      return
    }

    if (!isFormComplete) return

    setIsSubmitting(true)
    setResultData(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/sortout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          num_participants: parseInt(participants, 10),
          excel_data: excelData,
          google_token: user.accessToken,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const rows = Array.isArray(data) ? data : data.results || data.data || []
        setResultData(rows)
        toast.success(`Sorteo completado: ${rows.length} resultados`)
      } else {
        const reason = data.reason || data.detail || "Error en el sorteo"
        setError(reason)
        toast.error(reason)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexion"
      setError(message)
      toast.error("Error de conexion con el servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    if (!resultData || resultData.length === 0) return
    downloadJsonAsExcel(resultData, "resultado-sorteo.xlsx")
    toast.success("Archivo descargado correctamente")
  }

  const resultHeaders =
    resultData && resultData.length > 0 ? Object.keys(resultData[0]) : []
  const previewResultRows = resultData?.slice(0, 20) ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shuffle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Sortear Participantes</CardTitle>
              <CardDescription>
                Indica la cantidad de participantes y sube el Excel para realizar el sorteo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="participants-sortout" className="text-foreground">Nro. de participantes</Label>
            <Input
              id="participants-sortout"
              type="number"
              min={1}
              placeholder="Ej: 10"
              value={participants}
              onChange={(e) => {
                setParticipants(e.target.value)
                setResultData(null)
                setError(null)
              }}
              className="max-w-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Archivo Excel</Label>
            <ExcelUpload
              onDataChange={handleExcelChange}
              data={excelData}
              fileName={fileName}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
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
                Realizando sorteo...
              </>
            ) : !user ? (
              "Iniciar sesion para enviar"
            ) : (
              "Realizar Sorteo"
            )}
          </Button>

          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              Necesitas iniciar sesion con Google para enviar los datos al servidor.
            </p>
          )}

          {resultData && resultData.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Resultado del Sorteo ({resultData.length} filas)
                </h3>
                <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Excel
                </Button>
              </div>
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      {resultHeaders.map((header) => (
                        <TableHead
                          key={header}
                          className="whitespace-nowrap text-xs font-semibold text-foreground"
                        >
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewResultRows.map((row, i) => (
                      <TableRow key={i}>
                        {resultHeaders.map((header) => (
                          <TableCell
                            key={header}
                            className="whitespace-nowrap text-xs text-foreground"
                          >
                            {String(row[header] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {resultData.length > 20 && (
                <p className="text-center text-xs text-muted-foreground">
                  Mostrando 20 de {resultData.length} filas. Descarga el Excel para ver todos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
