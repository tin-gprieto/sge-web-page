import Image from "next/image"
import Link from "next/link"
import { ArrowRight, RefreshCw, Shuffle, Search } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <Image
          src="/logo.png"
          alt="SGE Logo"
          width={120}
          height={120}
          className="rounded-xl"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
            Sistema de Gestion de Expediciones
          </h1>
          <p className="mx-auto max-w-lg text-pretty text-lg text-muted-foreground">
            Gestiona las expediciones de manera sencilla. Actualiza datos de participantes o realiza sorteos.
          </p>
        </div>
      </div>

      <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <Link
          href="/update"
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Actualizar</h2>
            <p className="text-sm text-muted-foreground">
              Sube un Excel con los datos de la expedicion y actualiza la informacion.
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            Ir a Actualizar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/sortout"
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shuffle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Sortear</h2>
            <p className="text-sm text-muted-foreground">
              Sube un Excel con los participantes y realiza el sorteo automaticamente.
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            Ir a Sortear
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/buscar"
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Buscar</h2>
            <p className="text-sm text-muted-foreground">
              Busca participantes o consulta los datos de una expedicion.
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            Ir a Buscar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  )
}
