"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"

const PATHS_WITHOUT_NAVBAR = ["/login"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNavbar = !PATHS_WITHOUT_NAVBAR.includes(pathname)

  if (!showNavbar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-primary/10">
        {children}
      </main>
    </div>
  )
}
