"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileSpreadsheet, Upload, X, ChevronDown, ChevronUp } from "lucide-react"
import ExcelJS from "exceljs"

const INITIAL_ROWS = 20
const ROWS_INCREMENT = 20

interface ExcelUploadProps {
  onDataChange: (data: Record<string, unknown>[] | null, fileName: string) => void
  data: Record<string, unknown>[] | null
  fileName: string
  showPreview?: boolean
}

export function ExcelUpload({ onDataChange, data, fileName, showPreview = true }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      
      if (file.name.endsWith(".csv")) {
        await workbook.csv.load(arrayBuffer)
      } else {
        await workbook.xlsx.load(arrayBuffer)
      }
      
      const worksheet = workbook.worksheets[0]
      if (!worksheet) return
      
      const jsonData: Record<string, unknown>[] = []
      const headers: string[] = []
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value ?? `Column${colNumber}`)
          })
        } else {
          const rowData: Record<string, unknown> = {}
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1] ?? `Column${colNumber}`
            rowData[header] = cell.value
          })
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData)
          }
        }
      })
      
      onDataChange(jsonData, file.name)
    },
    [onDataChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleRemove = useCallback(() => {
    onDataChange(null, "")
    setVisibleRows(INITIAL_ROWS)
    if (inputRef.current) inputRef.current.value = ""
  }, [onDataChange])

  const headers = data && data.length > 0 ? Object.keys(data[0]) : []
  const previewRows = data?.slice(0, visibleRows) ?? []
  const hasMoreRows = data && data.length > visibleRows
  const canCollapse = visibleRows > INITIAL_ROWS

  return (
    <div className="flex flex-col gap-4">
      {!data ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          }`}
          role="button"
          tabIndex={0}
          aria-label="Upload Excel file"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Arrastra un archivo Excel o haz clic para seleccionar
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Formatos soportados: .xlsx, .xls, .csv
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <Card className="border-primary/20">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{fileName}</span>
                <span className="text-xs text-muted-foreground">
                  ({data.length} filas)
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemove} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Eliminar archivo</span>
              </Button>
            </div>
            {showPreview && (
              <>
                <div className="max-h-96 overflow-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="whitespace-nowrap text-xs font-semibold text-foreground w-12">
                          #
                        </TableHead>
                        {headers.map((header) => (
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
                      {previewRows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground w-12">
                            {i + 1}
                          </TableCell>
                          {headers.map((header) => (
                            <TableCell key={header} className="whitespace-nowrap text-xs text-foreground">
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
                    Mostrando {Math.min(visibleRows, data.length)} de {data.length} filas
                  </span>
                  {(hasMoreRows || canCollapse) && (
                    <div className="flex gap-1">
                      {hasMoreRows && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisibleRows(prev => Math.min(prev + ROWS_INCREMENT, data.length))}
                          className="h-6 px-2 text-xs"
                        >
                          <ChevronDown className="mr-1 h-3 w-3" />
                          Ver más
                        </Button>
                      )}
                      {canCollapse && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisibleRows(INITIAL_ROWS)}
                          className="h-6 px-2 text-xs"
                        >
                          <ChevronUp className="mr-1 h-3 w-3" />
                          Colapsar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
