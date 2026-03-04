import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // No cookies = not authenticated
    if (allCookies.length === 0) {
      return NextResponse.json({ authenticated: false })
    }

    // Forward all cookies to backend for validation
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ")

    const backendResponse = await fetch(`${API_BASE_URL}/auth/status`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    })

    if (!backendResponse.ok) {
      return NextResponse.json({ authenticated: false })
    }

    const data = await backendResponse.json()
    return NextResponse.json({ authenticated: data.authenticated === true })
  } catch (error) {
    console.error("Auth status check error:", error)
    return NextResponse.json({ authenticated: false })
  }
}
