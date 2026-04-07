import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthGuard } from '@/components/auth-guard'
import { AppShell } from '@/components/app-shell'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SGE - Sistema de Gestion de Expediciones',
  description: 'Sistema de Gestion de Expediciones - Actualizar y sortear participantes',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
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
        <AuthGuard>
          <AppShell>
            {children}
          </AppShell>
        </AuthGuard>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
