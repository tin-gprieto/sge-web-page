"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"

const PUBLIC_PATHS = ["/login"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      const authed = await checkAuth()
      if (cancelled) return

      if (!authed && !isPublicPath) {
        router.replace("/login")
      } else if (authed && isPublicPath) {
        router.replace("/")
      } else {
        setIsAuthed(authed)
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [pathname, isPublicPath, router])

  // On public paths (login), render immediately while checking
  if (isPublicPath) {
    return <>{children}</>
  }

  // On protected paths, show loading until verified
  if (isAuthed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return <>{children}</>
}
