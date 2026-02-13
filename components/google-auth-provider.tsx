"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface GoogleUser {
  name: string
  email: string
  picture: string
  accessToken: string
}

interface GoogleAuthContextType {
  user: GoogleUser | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => void
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  logout: () => {},
})

export function useGoogleAuth() {
  return useContext(GoogleAuthContext)
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive"

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      // Fallback: use a mock token for development
      setUser({
        name: "Development User",
        email: "dev@example.com",
        picture: "",
        accessToken: "dev-token",
      })
      return
    }

    setIsLoading(true)
    try {
      // Load Google Identity Services
      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (response: { access_token?: string; error?: string }) => {
          if (response.error) {
            setIsLoading(false)
            return
          }
          if (response.access_token) {
            // Fetch user info
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            })
            const userInfo = await userInfoRes.json()
            setUser({
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture,
              accessToken: response.access_token,
            })
          }
          setIsLoading(false)
        },
      })
      tokenClient?.requestAccessToken()
    } catch {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    if (user?.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(user.accessToken, () => {})
    }
    setUser(null)
  }, [user])

  return (
    <GoogleAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </GoogleAuthContext.Provider>
  )
}

// Extend window for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}
