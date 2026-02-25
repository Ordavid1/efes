import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'מחשבון זכויות בנייה - חיפה',
  description: 'כלי לחישוב זכויות בנייה והפקת דוח אפס עבור חלקות בעיר חיפה',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-hebrew antialiased">
        {children}
      </body>
    </html>
  )
}
