'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import FlipCard from './FlipCard'
import JudgmentButtons from './JudgmentButtons'
import AiChatPanel from './AiChatPanel'
import SummaryPanel from './SummaryPanel'
import type { Card, Deck } from '@prisma/client'

type DeckWithCards = Deck & { cards: Card[] }
type Filter = 'all' | 'star' | 'incorrect' | 'unanswered'

function filterCards(cards: Card[], filter: Filter): Card[] {
  if (filter === 'all')        return cards
  if (filter === 'unanswered') return cards.filter(c => !c.status)
  return cards.filter(c => c.status === filter)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  deck:           DeckWithCards
  userId:           string
  initialFilter:    Filter
  initialShuffle:   boolean
  autoAdvance:      boolean
  autoAdvanceDelay: number
}

export default function StudyView({ deck, userId, initialFilter, initialShuffle, autoAdvance, autoAdvanceDelay }: Props) {
  const router = useRouter()

  // Build study order
  const [order, setOrder] = useState<Card[]>(() => {
    const filtered = filterCards(deck.cards, initialFilter)
    return initialShuffle ? shuffle(filtered) : filtered
  })
  const [cardIdx,      setCardIdx]      = useState(0)
  const [flipped,      setFlipped]      = useState(false)
  const [countdown,    setCountdown]    = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showComment,  setShowComment]  = useState(false)
  const [showChat,     setShowChat]     = useState(false)
  const [showSummary,  setShowSummary]  = useState(false)
  const [judgments,    setJudgments]    = useState<Record<string, string>>({}) // cardId → status
  const [round]                         = useState(deck.currentRound)

  const card   = order[cardIdx]
  const total  = order.length
  const isLast = cardIdx >= total - 1

  const counts = {
    correct:   Object.values(judgments).filter(s => s === 'correct').length,
    incorrect: Object.values(judgments).filter(s => s === 'incorrect').length,
    star:      Object.values(judgments).filter(s => s === 'star').length,
    pending:   Object.values(judgments).filter(s => s === 'pending').length,
    none:      total - Object.keys(judgments).length,
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT'    ) return
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' ) return
      if (showChat || showSummary) return
      switch (e.key) {
        case 'ArrowRight': if (!isLast) next(); break
        case 'ArrowLeft':  if (cardIdx > 0) prev(); break
        case ' ': case 'Enter': e.preventDefault(); setFlipped(f => !f); break
        case 's': case 'S': if (card?.comment) setShowComment(c => !c); break
        case '1': if (flipped) judge('correct');   break
        case '2': if (flipped) judge('incorrect'); break
        case '3': if (flipped) judge('pending');   break
        case '4': if (flipped) judge('star');      break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIdx, isLast, flipped, card, showChat, showSummary])

  const next = useCallback(() => {
    clearCountdown()
    setCardIdx(i => i + 1)
    setFlipped(false)
    setShowComment(false)
    setShowChat(false)
  }, [clearCountdown])

  const prev = useCallback(() => {
    clearCountdown()
    setCardIdx(i => i - 1)
    setFlipped(false)
    setShowComment(false)
    setShowChat(false)
  }, [clearCountdown])

  // Clear countdown timer
  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setCountdown(null)
  }, [])

  const judge = useCallback(async (status: string) => {
    if (!card) return
    setJudgments(prev => ({ ...prev, [card.id]: status }))
    // Persist to DB
    await fetch(`/api/cards/${card.id}/judge`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    // Auto-advance (if enabled in settings)
    if (autoAdvance && !isLast) {
      clearCountdown()
      let remaining = autoAdvanceDelay
      setCountdown(remaining)
      countdownRef.current = setInterval(() => {
        remaining -= 1
        if (remaining <= 0) {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          setCountdown(null)
          setCardIdx(i => i + 1)
          setFlipped(false)
          setShowComment(false)
          setShowChat(false)
        } else {
          setCountdown(remaining)
        }
      }, 1000)
    }
  }, [card, isLast, autoAdvance, autoAdvanceDelay, clearCountdown])

  async function startNextRound(filter: Filter, doShuffle = false) {
    // Increment round on server
    await fetch(`/api/decks/${deck.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ incrementRound: true }),
    })
    const newCards = filterCards(deck.cards.map(c => ({
      ...c,
      status: judgments[c.id] ?? c.status,
    })), filter)
    if (!newCards.length) { toast.error('対象カードがありません'); return }
    setOrder(doShuffle ? shuffle(newCards) : newCards)
    setCardIdx(0)
    setFlipped(false)
    setShowComment(false)
    setShowChat(false)
    setShowSummary(false)
    setJudgments({})
    toast.success(`第${round + 1}周目を開始します！`)
    router.refresh()
  }

  const pct = Math.round(((cardIdx + 1) / total) * 100)

  if (!card) return <p className="text-center p-8 text-slate-400">カードがありません</p>

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white h-14 flex items-center px-4 gap-3 sticky top-0 z-40 shadow">
        <Link href={`/decks/${deck.id}`} className="text-xl opacity-80 hover:opacity-100">←</Link>
        <h1 className="font-bold flex-1 truncate">{deck.name}</h1>
        <span className="text-xs bg-white/20 border border-white/30 rounded-full px-3 py-1 font-bold whitespace-nowrap">
          第 {round} 周目
        </span>
        <button
          onClick={() => { setShowSummary(s => !s); setShowChat(false) }}
          className={`text-xs px-3 py-1 rounded-full font-bold transition border ${showSummary ? 'bg-white text-indigo-700 border-white' : 'bg-white/10 border-white/30 hover:bg-white/20'}`}
        >
          📝 まとめ
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Summary panel */}
        {showSummary && (
          <SummaryPanel deckId={deck.id} deckName={deck.name} round={round} onClose={() => setShowSummary(false)} />
        )}

        {/* Progress */}
        <div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <div className="flex gap-3">
              {counts.correct   > 0 && <span className="text-green-600 font-bold">✓ {counts.correct}</span>}
              {counts.incorrect > 0 && <span className="text-red-500   font-bold">✗ {counts.incorrect}</span>}
              {counts.star      > 0 && <span className="text-amber-500 font-bold">⭐ {counts.star}</span>}
              {counts.pending   > 0 && <span className="text-slate-500 font-bold">⏭ {counts.pending}</span>}
            </div>
            <span>{cardIdx + 1} / {total}</span>
          </div>
        </div>

        {/* Current judgment badge */}
        {judgments[card.id] && (
          <div className={`text-center text-sm font-bold py-1 rounded-lg ${
            judgments[card.id] === 'correct'   ? 'bg-green-50 text-green-700' :
            judgments[card.id] === 'incorrect' ? 'bg-red-50   text-red-700'   :
            judgments[card.id] === 'star'      ? 'bg-amber-50 text-amber-700' :
                                                  'bg-slate-100 text-slate-600'
          }`}>
            {judgments[card.id] === 'correct'   && '✓ 正解'}
            {judgments[card.id] === 'incorrect' && '✗ 不正解'}
            {judgments[card.id] === 'star'      && '⭐ お気に入り'}
            {judgments[card.id] === 'pending'   && '⏭ 保留'}
          </div>
        )}

        {/* Flip card */}
        <FlipCard
          front={card.front}
          back={card.back}
          flipped={flipped}
          onClick={() => setFlipped(f => !f)}
        />

        {/* Judgment buttons */}
        {flipped && (
          <JudgmentButtons
            current={judgments[card.id]}
            onJudge={judge}
          />
        )}

        {/* Comment */}
        {card.comment && (
          <div>
            <button
              onClick={() => setShowComment(c => !c)}
              className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
            >
              {showComment ? '▲' : '▼'}　解説を{showComment ? '閉じる' : '表示する'}
            </button>
            {showComment && (
              <div
                className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-base text-amber-900 whitespace-pre-wrap leading-relaxed overflow-y-auto"
                style={{ maxHeight: '240px', WebkitOverflowScrolling: 'touch' }}
              >
                {card.comment}
              </div>
            )}
          </div>
        )}

        {/* AI Chat toggle */}
        <button
          onClick={() => setShowChat(c => !c)}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition shadow-sm ${
            showChat
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <span className="text-base">💬</span>
          {showChat ? 'AIチャットを閉じる' : 'Claudeにもっと詳しく聞く'}
          {!showChat && <span className="ml-auto text-xs opacity-60">疑問点・深掘り</span>}
        </button>

        {/* AI Chat panel */}
        {showChat && (
          <AiChatPanel
            card={{ id: card.id, front: card.front, back: card.back, comment: card.comment }}
            userId={userId}
          />
        )}

        {/* Auto-advance countdown */}
        {countdown !== null && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-indigo-700">{countdown}秒後に次のカードへ...</span>
            <button
              onClick={clearCountdown}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg px-3 py-1 transition"
            >
              キャンセル
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-center">
          <button onClick={prev} disabled={cardIdx === 0} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition disabled:opacity-30 text-sm">← 前へ</button>
          <button onClick={() => setFlipped(f => !f)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition text-sm">
            {flipped ? '🔄 問題に戻る' : '答えを確認'}
          </button>
          <button onClick={next} disabled={isLast} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition disabled:opacity-30 text-sm">次へ →</button>
        </div>

        <p className="text-center text-xs text-slate-400">
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">←/→</kbd> 前後&ensp;
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Space</kbd> めくる&ensp;
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">1</kbd>正解&ensp;
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">2</kbd>不正解&ensp;
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">3</kbd>保留&ensp;
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">4</kbd>⭐
        </p>

        {/* Completion */}
        {isLast && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            <p className="text-lg font-bold mb-4">🎉 第 {round} 周目 完了！</p>
            <div className="flex gap-3 justify-center flex-wrap mb-5">
              {[
                { label: '✓ 正解',       n: counts.correct,   cls: 'bg-green-50 text-green-700' },
                { label: '✗ 不正解',     n: counts.incorrect, cls: 'bg-red-50   text-red-700'   },
                { label: '⭐ お気に入り', n: counts.star,      cls: 'bg-amber-50 text-amber-700' },
                { label: '⏭ 保留',       n: counts.pending,   cls: 'bg-slate-100 text-slate-600' },
              ].map(({ label, n, cls }) => (
                <div key={label} className={`${cls} rounded-xl px-4 py-2 text-center`}>
                  <div className="text-2xl font-extrabold">{n}</div>
                  <div className="text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-500 mb-3 font-medium">次のラウンドを選択</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={() => startNextRound('all')}        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">全カード ({total}枚)</button>
              {counts.star      > 0 && <button onClick={() => startNextRound('star')}      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium">⭐ お気に入り ({counts.star}枚)</button>}
              {counts.incorrect > 0 && <button onClick={() => startNextRound('incorrect')} className="px-4 py-2 bg-red-100   hover:bg-red-200   text-red-800   rounded-lg text-sm font-medium">✗ 不正解 ({counts.incorrect}枚)</button>}
              {counts.none      > 0 && <button onClick={() => startNextRound('unanswered')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">未回答 ({counts.none}枚)</button>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
