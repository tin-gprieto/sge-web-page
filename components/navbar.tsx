"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { RefreshCw, Shuffle, Search, Calendar, LogOut, Menu } from "lucide-react"

const navLinks = [
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/update", label: "Actualizar", icon: RefreshCw },
  { href: "/sortout", label: "Sortear", icon: Shuffle },
  { href: "/planificar", label: "Planificar", icon: Calendar },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="SGE Logo"
            width={40}
            height={40}
            className="rounded"
            style={{ width: '40px', height: '40px' }}
          />
          <span className="text-lg font-bold text-foreground">S.G.E.</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="hidden md:flex gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesion</span>
        </Button>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="SGE Logo"
                  width={32}
                  height={32}
                  className="rounded"
                  style={{ width: '32px', height: '32px' }}
                />
                <span>S.G.E.</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 py-4">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleMobileNavClick}
                    className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-border pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  handleMobileNavClick()
                  handleLogout()
                }}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesion
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
