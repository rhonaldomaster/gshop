import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GSHOP Panel de Vendedor',
  description: 'Panel de control para vendedores de GSHOP marketplace',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages();

  return (
    <html lang="es">
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}