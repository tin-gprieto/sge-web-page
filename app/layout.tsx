import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { GoogleAuthProvider } from '@/components/google-auth-provider'
import { Navbar } from '@/components/navbar'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SGE - Sistema de Gestion de Expediciones',
  description: 'Sistema de Gestion de Expediciones - Actualizar y sortear participantes',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <GoogleAuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </GoogleAuthProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
