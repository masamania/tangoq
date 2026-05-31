'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'

interface Props {
  user: Session['user']
}

export default function GlobalNav({ user }: Props) {
  return (
    <nav className="bg-indigo-700 text-white h-14 flex items-center px-4 gap-4 shadow-md sticky top-0 z-50">
      <Link href="/decks" className="font-bold text-lg tracking-tight">📖 TANGO</Link>
      <div className="flex-1" />
      <Link href="/decks"    className="text-sm opacity-80 hover:opacity-100 transition">単語帳</Link>
      <Link href="/settings" className="text-sm opacity-80 hover:opacity-100 transition">設定</Link>
      {user?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ''} className="w-8 h-8 rounded-full border-2 border-white/30" />
      )}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-sm opacity-70 hover:opacity-100 transition"
      >
        ログアウト
      </button>
    </nav>
  )
}
