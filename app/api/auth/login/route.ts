import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: backendResponse.status === 401 ? "Contraseña incorrecta" : "Error del servidor" },
        { status: backendResponse.status }
      )
    }

    // Get all Set-Cookie headers from backend
    const setCookieHeaders = backendResponse.headers.getSetCookie()
    const cookieStore = await cookies()

    for (const setCookie of setCookieHeaders) {
      // Parse cookie: name=value; attributes...
      const [nameValue, ...attributes] = setCookie.split(";").map(s => s.trim())
      const [name, value] = nameValue.split("=")
      
      if (name && value) {
        // Parse attributes
        const attrMap: Record<string, string> = {}
        for (const attr of attributes) {
          const [key, val] = attr.split("=")
          attrMap[key.toLowerCase()] = val || "true"
        }

        cookieStore.set(name, value, {
          httpOnly: attrMap.hasOwnProperty("httponly"),
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: attrMap["path"] || "/",
          maxAge: attrMap["max-age"] ? parseInt(attrMap["max-age"]) : 60 * 60 * 24 * 7,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login proxy error:", error)
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor" },
      { status: 500 }
    )
  }
}
