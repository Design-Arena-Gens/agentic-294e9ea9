import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Business Objects Universe Reader',
  description: 'Read and analyze Business Objects Universe files',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
