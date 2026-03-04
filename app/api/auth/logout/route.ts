import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Forward all cookies to backend logout
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ")
    
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    }).catch(() => {})

    // Delete all auth-related cookies (common patterns)
    const authCookiePatterns = ["session", "auth", "token", "access"]
    for (const cookie of allCookies) {
      if (authCookiePatterns.some(p => cookie.name.toLowerCase().includes(p))) {
        cookieStore.delete(cookie.name)
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
