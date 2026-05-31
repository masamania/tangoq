'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'

interface Props {
  user: Session['user']
}

export default function GlobalNav({ user }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="bg-indigo-700 text-white h-14 flex items-center px-4 gap-4 shadow-md sticky top-0 z-50">
      <Link href="/decks" className="font-bold text-lg tracking-tight">📖 TANGOQ</Link>
      <div className="flex-1" />
      <Link href="/decks"    className="text-sm opacity-80 hover:opacity-100 transition hidden sm:block">単語帳</Link>
      <Link href="/settings" className="text-sm opacity-80 hover:opacity-100 transition hidden sm:block">設定</Link>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 hover:opacity-90 transition"
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ''} className="w-8 h-8 rounded-full border-2 border-white/40" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
            </div>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 w-64 z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                    {(user?.name ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{user?.name ?? '名前なし'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email ?? ''}</p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              <Link href="/decks" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition">
                📚 単語帳一覧
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition">
                ⚙️ 設定
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 py-1">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                🚪 ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
