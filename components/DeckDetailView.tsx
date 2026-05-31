'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Card, Deck, RoundSummary } from '@prisma/client'

type DeckFull = Deck & { cards: Card[]; roundSummaries: RoundSummary[] }

const STATUS_PILL: Record<string, string> = {
  correct:   'bg-green-50  text-green-700',
  incorrect: 'bg-red-50    text-red-700',
  star:      'bg-amber-50  text-amber-700',
  pending:   'bg-slate-100 text-slate-600',
}

export default function DeckDetailView({ deck }: { deck: DeckFull }) {
  const [filter,  setFilter]  = useState<'all' | 'star' | 'incorrect' | 'unanswered'>('all')
  const [shuffle, setShuffle] = useState(false)

  const counts = deck.cards.reduce(
    (acc, c) => {
      if (!c.status) acc.unanswered++
      else           acc[c.status as keyof typeof acc] = (acc[c.status as keyof typeof acc] ?? 0) + 1
      return acc
    },
    { correct: 0, incorrect: 0, star: 0, pending: 0, unanswered: 0 } as Record<string, number>,
  )

  const filterCount: Record<string, number> = {
    all:        deck.cards.length,
    star:       counts.star,
    incorrect:  counts.incorrect,
    unanswered: counts.unanswered,
  }

  const FILTERS = [
    { key: 'all',        label: '全カード',     icon: '📋' },
    { key: 'unanswered', label: '未回答',        icon: '○'  },
    { key: 'star',       label: 'お気に入り',    icon: '⭐' },
    { key: 'incorrect',  label: '不正解',        icon: '✗'  },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/decks" className="text-slate-400 hover:text-slate-600 transition text-xl">←</Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{deck.name}</h1>
          <p className="text-xs text-slate-400">第 {deck.currentRound} 周目 · {deck.cards.length}枚</p>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {[
          { label: '未回答',  n: counts.unanswered, cls: 'text-slate-600 bg-slate-50'  },
          { label: '✓ 正解',  n: counts.correct,    cls: 'text-green-700 bg-green-50'  },
          { label: '✗ 不正解',n: counts.incorrect,  cls: 'text-red-700   bg-red-50'    },
          { label: '⭐',       n: counts.star,       cls: 'text-amber-700 bg-amber-50'  },
          { label: '⏭ 保留',  n: counts.pending,    cls: 'text-slate-500 bg-slate-100' },
        ].map(({ label, n, cls }) => (
          <div key={label} className={`${cls} rounded-xl p-3 text-center`}>
            <div className="text-xl font-extrabold">{n}</div>
            <div className="text-xs mt-0.5 opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">出題範囲</h2>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {FILTERS.map(f => (
          <button
            key={f.key}
            disabled={filterCount[f.key] === 0}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${filter === f.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            <span className="ml-auto text-xs opacity-60">{filterCount[f.key]}枚</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 mb-4 cursor-pointer">
        <span className="text-sm font-medium text-slate-700 flex-1">🔀 シャッフル</span>
        <div
          onClick={() => setShuffle(s => !s)}
          className={`relative w-11 h-6 rounded-full transition-colors ${shuffle ? 'bg-indigo-600' : 'bg-slate-200'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${shuffle ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </label>

      <Link
        href={`/decks/${deck.id}/study?filter=${filter}&shuffle=${shuffle}`}
        className={`block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition mb-8 ${filterCount[filter] === 0 ? 'opacity-40 pointer-events-none' : ''}`}
      >
        ▶ 学習を開始 （{filterCount[filter]}枚）
      </Link>

      {/* Past summaries */}
      {deck.roundSummaries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">過去のまとめ</h2>
          <div className="space-y-2">
            {deck.roundSummaries.map(s => (
              <details key={s.id} className="bg-white border border-slate-100 rounded-xl">
                <summary className="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer">第 {s.round} 周目 のまとめ</summary>
                <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-50">{s.content}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Card list */}
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">カード一覧</h2>
      <div className="space-y-2">
        {deck.cards.map((card, i) => (
          <div key={card.id} className="bg-white border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">カード {i + 1}</span>
              {card.status && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_PILL[card.status]}`}>
                  {card.status === 'correct' && '✓ 正解'}
                  {card.status === 'incorrect' && '✗ 不正解'}
                  {card.status === 'pending' && '⏭ 保留'}
                  {card.status === 'star' && '⭐ お気に入り'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-snug">{card.front.length > 120 ? card.front.slice(0, 120) + '…' : card.front}</p>
            <p className="text-sm text-indigo-600 font-medium mt-1.5">✓ {card.back}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
