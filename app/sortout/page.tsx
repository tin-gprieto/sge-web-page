"use client"

import { useState, useCallback, useEffect } from "react"
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
import { Shuffle, Loader2, Download, XCircle, Plus, Database, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import {
  rateParticipants,
  executeLottery,
  insertParticipants,
  getExpeditionList,
  getExpeditionHistorial,
  createExpedition,
  type ParticipantWithScore,
  type ParticipantWithWon,
  type Expedition,
  type ExpeditionHistorialItem,
} from "@/lib/api"
import {
  excelToParticipants,
  downloadLotteryResults,
  participantsToExcel,
  scoredParticipantsToExcel,
  validateParticipantData,
  downloadAsExcel,
} from "@/lib/excel_integration"

export default function SortoutPage() {
  // Expedition state
  const [expeditions, setExpeditions] = useState<Expedition[]>([])
  const [historial, setHistorial] = useState<ExpeditionHistorialItem[]>([])
  const [expeditionId, setExpeditionId] = useState<string>("")
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString())
  const [winnersCount, setWinnersCount] = useState("")

  // Excel and data state
  const [excelData, setExcelData] = useState<Record<string, unknown>[] | null>(null)
  const [fileName, setFileName] = useState("")

  // Rate state
  const [isRating, setIsRating] = useState(false)
  const [ratedParticipants, setRatedParticipants] = useState<ParticipantWithScore[] | null>(null)

  // Lottery state
  const [isLotterying, setIsLotterying] = useState(false)
  const [lotteryResult, setLotteryResult] = useState<ParticipantWithWon[] | null>(null)

  // Insert state
  const [isInserting, setIsInserting] = useState(false)
  const [insertComplete, setInsertComplete] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // New expedition dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newExpeditionName, setNewExpeditionName] = useState("")
  const [isCreatingExpedition, setIsCreatingExpedition] = useState(false)

  // Visible rows state for tables
  const [ratedVisibleRows, setRatedVisibleRows] = useState(20)
  const [lotteryVisibleRows, setLotteryVisibleRows] = useState(20)

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

  const selectedExpedition = expeditions.find(e => e.id.toString() === expeditionId)

  // Check if expedition/year combo already exists in historial
  const expeditionYearExists = selectedExpedition && currentYear.trim()
    ? historial.some(h => h.name === selectedExpedition.name && h.year === parseInt(currentYear, 10))
    : false

  // Reset downstream data when expedition/year changes
  const resetData = useCallback(() => {
    setRatedParticipants(null)
    setLotteryResult(null)
    setInsertComplete(false)
    setError(null)
    setRatedVisibleRows(20)
    setLotteryVisibleRows(20)
  }, [])

  // Auto-rate when we have all required data (expedition, year, excelData)
  useEffect(() => {
    async function autoRate() {
      // Don't auto-rate if expedition/year combo already exists
      if (expeditionYearExists) return
      if (!excelData || !selectedExpedition || !currentYear.trim() || ratedParticipants) return

      const validation = validateParticipantData(excelData)
      if (!validation.valid) {
        setError(`Faltan campos requeridos: ${validation.missingFields.join(", ")}`)
        return
      }

      const participants = excelToParticipants(excelData)
      if (participants.length === 0) {
        setError("No se encontraron participantes válidos en el Excel.")
        return
      }

      setIsRating(true)
      setError(null)
      try {
        const response = await rateParticipants({
          expedition: selectedExpedition.name,
          year: parseInt(currentYear, 10),
          list: participants,
        })
        const sorted = response.list.toSorted((a, b) => b.score - a.score)
        setRatedParticipants(sorted)
        toast.success(`${sorted.length} participantes calificados`)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al calificar participantes"
        setError(message)
        toast.error(message)
      } finally {
        setIsRating(false)
      }
    }

    autoRate()
  }, [excelData, selectedExpedition, currentYear, ratedParticipants, expeditionYearExists])

  const handleExcelChange = useCallback(
    (data: Record<string, unknown>[] | null, name: string) => {
      setExcelData(data)
      setFileName(name)
      setRatedParticipants(null)
      setLotteryResult(null)
      setInsertComplete(false)
      setError(null)
    },
    []
  )

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

  const handleLottery = async () => {
    if (!ratedParticipants || !selectedExpedition || !winnersCount.trim()) return

    setIsLotterying(true)
    setLotteryResult(null)
    setInsertComplete(false)

    try {
      const response = await executeLottery({
        count: parseInt(winnersCount, 10),
        expedition: selectedExpedition.name,
        year: parseInt(currentYear, 10),
        list: ratedParticipants,
      })

      // Sort by winners first
      const sorted = response.list.toSorted((a, b) => {
        if (a.has_won === b.has_won) return 0
        return a.has_won ? -1 : 1
      })

      setLotteryResult(sorted)
      const winnersTotal = response.list.filter(p => p.has_won).length
      toast.success(`Sorteo completado: ${winnersTotal} ganadores de ${response.list.length} participantes`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al realizar sorteo"
      setError(message)
      toast.error(message)
    } finally {
      setIsLotterying(false)
    }
  }

  const handleInsert = async () => {
    if (!lotteryResult || !selectedExpedition) return

    setIsInserting(true)

    try {
      const response = await insertParticipants({
        expedition: selectedExpedition.name,
        year: parseInt(currentYear, 10),
        list: lotteryResult,
      })

      setInsertComplete(true)
      toast.success(`Guardado: ${response.inserted} insertados, ${response.repeated} repetidos, ${response.skipped} ignorados de ${response.total} total`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar datos"
      setError(message)
      toast.error(message)
    } finally {
      setIsInserting(false)
    }
  }

  const handleDownloadRated = async () => {
    if (!ratedParticipants) return
    const data = scoredParticipantsToExcel(ratedParticipants)
    const fileName = `participantes-calificados-${selectedExpedition?.name ?? "expedicion"}-${currentYear}.xlsx`
    await downloadAsExcel(data, fileName)
    toast.success("Archivo descargado")
  }

  const handleDownloadLottery = async () => {
    if (!lotteryResult) return
    const fileName = `resultado-sorteo-${selectedExpedition?.name ?? "expedicion"}-${currentYear}.xlsx`
    await downloadLotteryResults(lotteryResult, fileName)
    toast.success("Archivo descargado")
  }

  // Display data for rated participants
  const ratedDisplayData = ratedParticipants ? scoredParticipantsToExcel(ratedParticipants) : null
  const ratedHeaders = ratedDisplayData && ratedDisplayData.length > 0 ? Object.keys(ratedDisplayData[0]) : []
  const ratedPreviewRows = ratedDisplayData?.slice(0, ratedVisibleRows) ?? []
  const hasMoreRatedRows = ratedDisplayData && ratedDisplayData.length > ratedVisibleRows
  const canCollapseRated = ratedVisibleRows > 20

  // Display data for lottery results  
  const lotteryDisplayData = lotteryResult ? participantsToExcel(lotteryResult) : null
  const lotteryHeaders = lotteryDisplayData && lotteryDisplayData.length > 0 ? Object.keys(lotteryDisplayData[0]) : []
  const lotteryPreviewRows = lotteryDisplayData?.slice(0, lotteryVisibleRows) ?? []
  const hasMoreLotteryRows = lotteryDisplayData && lotteryDisplayData.length > lotteryVisibleRows
  const canCollapseLottery = lotteryVisibleRows > 20

  const canLottery = ratedParticipants && winnersCount.trim() && parseInt(winnersCount, 10) > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shuffle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Sortear Participantes</CardTitle>
              <CardDescription>
                Sube el Excel con los participantes para calificarlos y realizar el sorteo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Scoring Rules */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Reglas del sorteo - Scores más altos tienen más chances de ganar
            </h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><span className="font-medium text-foreground">x2</span>: Si se anotó a la expedición del sorteo pero no fue sorteado</li>
              <li><span className="font-medium text-foreground">x1,5</span>: Si se está en la base de datos pero no fue a ninguna expedición</li>
              <li><span className="font-medium text-foreground">x1</span>: Nunca vino a ninguna expedición (no se encuentra en la base de datos)</li>
              <li><span className="font-medium text-foreground">x0,5</span>: Vino alguna expedición (diferente a la que se está sorteando)</li>
              <li><span className="font-medium text-foreground">x0</span>: Ya fue alguna vez a la expedición que se está sorteando (Será excluido)</li>
            </ul>
            <br />
            <span className="space-y-1.5 text-sm font-semibold text-foreground">
              Si se arrobó a dos fiubenses en Instagram su puntaje actual se <b>duplicará</b>
            </span>
          </div>

          {/* Step 1: Configuration */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Expedición</Label>
              <div className="flex gap-2">
                <Select
                  value={expeditionId}
                  onValueChange={(value) => {
                    setExpeditionId(value)
                    resetData()
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
                        <Label htmlFor="new-expedition-name">Nombre</Label>
                        <Input
                          id="new-expedition-name"
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
              <Label htmlFor="year-sortout" className="text-foreground">Año</Label>
              <Input
                id="year-sortout"
                type="number"
                placeholder="Ej: 2026"
                value={currentYear}
                onChange={(e) => {
                  setCurrentYear(e.target.value)
                  resetData()
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="winners-count" className="text-foreground">Nro. de ganadores</Label>
              <Input
                id="winners-count"
                type="number"
                min={1}
                placeholder="Ej: 10"
                value={winnersCount}
                onChange={(e) => setWinnersCount(e.target.value)}
              />
            </div>
          </div>

          {/* Warning: Expedition/Year already exists */}
          {expeditionYearExists && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                La expedición <strong>{selectedExpedition?.name}</strong> ya fue realizada en el año <strong>{currentYear}</strong>.
                No es posible realizar otro sorteo para esta combinación.
              </span>
            </div>
          )}

          {/* Step 2: Upload Excel */}
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Archivo Excel</Label>
            <ExcelUpload
              onDataChange={handleExcelChange}
              data={excelData}
              fileName={fileName}
              showPreview={false}
            />
            {/* Warning when file uploaded but missing fields */}
            {excelData && (!expeditionId || !currentYear.trim() || !winnersCount.trim()) && !ratedParticipants && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Completa los campos faltantes:
                  {!expeditionId && " Expedición"}
                  {!currentYear.trim() && " Año"}
                  {!winnersCount.trim() && " Nro. de ganadores"}
                </span>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading indicator for rating */}
          {isRating && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Calificando participantes...</span>
            </div>
          )}

          {/* Step 3: Show rated participants */}
          {ratedParticipants && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Participantes Calificados ({ratedParticipants.length})
                </h3>
                <Button onClick={handleDownloadRated} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Excel
                </Button>
              </div>
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground w-12">
                        #
                      </TableHead>
                      {ratedHeaders.map((header) => (
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
                    {ratedPreviewRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground w-12">
                          {i + 1}
                        </TableCell>
                        {ratedHeaders.map((header) => (
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
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Mostrando {Math.min(ratedVisibleRows, ratedParticipants.length)} de {ratedParticipants.length} participantes
                </span>
                {(hasMoreRatedRows || canCollapseRated) && (
                  <div className="flex gap-1">
                    {hasMoreRatedRows && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRatedVisibleRows(prev => Math.min(prev + 20, ratedParticipants.length))}
                        className="h-6 px-2 text-xs"
                      >
                        <ChevronDown className="mr-1 h-3 w-3" />
                        Ver más
                      </Button>
                    )}
                    {canCollapseRated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRatedVisibleRows(20)}
                        className="h-6 px-2 text-xs"
                      >
                        <ChevronUp className="mr-1 h-3 w-3" />
                        Colapsar
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Lottery button - only show if lottery not yet executed */}
              {!lotteryResult && (
                <Button
                  onClick={handleLottery}
                  disabled={!canLottery || isLotterying}
                  className="w-full"
                  size="lg"
                >
                  {isLotterying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Realizando sorteo...
                    </>
                  ) : !winnersCount.trim() ? (
                    "Ingresa el número de ganadores"
                  ) : (
                    <>
                      <Shuffle className="mr-2 h-4 w-4" />
                      Realizar Sorteo ({winnersCount} ganadores)
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Show lottery results */}
          {lotteryResult && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Resultado del Sorteo ({lotteryResult.filter(p => p.has_won).length} ganadores de {lotteryResult.length})
                </h3>
                <Button onClick={handleDownloadLottery} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Excel
                </Button>
              </div>
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground w-12">
                        #
                      </TableHead>
                      {lotteryHeaders.map((header) => (
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
                    {lotteryPreviewRows.map((row, i) => (
                      <TableRow key={i} className={row["Ganador"] === "Sí" ? "bg-green-50 dark:bg-green-950/20" : ""}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground w-12">
                          {i + 1}
                        </TableCell>
                        {lotteryHeaders.map((header) => (
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
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Mostrando {Math.min(lotteryVisibleRows, lotteryResult.length)} de {lotteryResult.length} participantes
                </span>
                {(hasMoreLotteryRows || canCollapseLottery) && (
                  <div className="flex gap-1">
                    {hasMoreLotteryRows && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLotteryVisibleRows(prev => Math.min(prev + 20, lotteryResult.length))}
                        className="h-6 px-2 text-xs"
                      >
                        <ChevronDown className="mr-1 h-3 w-3" />
                        Ver más
                      </Button>
                    )}
                    {canCollapseLottery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLotteryVisibleRows(20)}
                        className="h-6 px-2 text-xs"
                      >
                        <ChevronUp className="mr-1 h-3 w-3" />
                        Colapsar
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Insert button */}
              {!insertComplete ? (
                <Button
                  onClick={handleInsert}
                  disabled={isInserting}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  {isInserting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando en base de datos...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Guardar en Base de Datos
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                  <Database className="h-4 w-4" />
                  <span>Datos guardados correctamente en la base de datos</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
