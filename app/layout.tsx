import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'TANGO — AI単語帳',
  description: 'Claude AIと深掘り学習できるフラッシュカードアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
