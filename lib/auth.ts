// Auth calls go through local API routes to avoid cross-origin cookie issues
// The API routes proxy to the backend and handle cookies as first-party

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (response.ok) {
      return { success: true }
    }

    const data = await response.json().catch(() => ({}))
    return {
      success: false,
      error: data.error || "Error del servidor. Intenta de nuevo.",
    }
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor." }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    // Silently fail - we redirect to login regardless
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/status", {
      method: "GET",
      cache: "no-store",
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.authenticated === true
  } catch {
    return false
  }
}
