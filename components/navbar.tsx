"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useGoogleAuth } from "@/components/google-auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogIn, LogOut, User, RefreshCw, Shuffle } from "lucide-react"

const navLinks = [
  { href: "/update", label: "Actualizar" },
  { href: "/sortout", label: "Sortear" },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, isLoading, login, logout } = useGoogleAuth()

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
            />
            <span className="text-lg font-semibold text-foreground">S.G.E.</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.label === "Actualizar" && <RefreshCw className="h-4 w-4" />}
                {link.label === "Sortear" && <Shuffle className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-foreground sm:inline">
                    {user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                  <User className="mr-2 h-3 w-3" />
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={login}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? "Conectando..." : "Login"}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
