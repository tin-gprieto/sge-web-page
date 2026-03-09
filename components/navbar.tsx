"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { RefreshCw, Shuffle, Search, Calendar, LogOut } from "lucide-react"

const navLinks = [
  { href: "/buscar", label: "Buscar" },
  { href: "/update", label: "Actualizar" },
  { href: "/sortout", label: "Sortear" },
  { href: "/planificar", label: "Planificar" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SGE Logo"
              width={40}
              height={40}
              className="rounded"
              style={{ width: '40px', height: '40px' }}
            />
            <span className="text-lg font-semibold text-foreground">S.G.E.</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                {link.label === "Buscar" && <Search className="h-4 w-4" />}
                {link.label === "Actualizar" && <RefreshCw className="h-4 w-4" />}
                {link.label === "Sortear" && <Shuffle className="h-4 w-4" />}
                {link.label === "Planificar" && <Calendar className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  )
}
