const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    })

    if (response.ok) {
      return { success: true }
    }

    if (response.status === 401) {
      return { success: false, error: "Contrasena incorrecta" }
    }

    return { success: false, error: "Error del servidor. Intenta de nuevo." }
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor." }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // Silently fail - we redirect to login regardless
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      credentials: "include",
    })
    return response.ok
  } catch {
    return false
  }
}
