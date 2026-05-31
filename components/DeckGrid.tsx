'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DeckSummary {
  id: string
  name: string
  currentRound: number
  _count: { cards: number }
}

interface Props {
  decks:    DeckSummary[]
  statsMap: Record<string, Record<string, number>>
}

export default function DeckGrid({ decks, statsMap }: Props) {
  const router         = useRouter()
  const [, startTrans] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [deckName, setDeckName]   = useState('')
  const [importing, setImporting] = useState(false)
  const [file, setFile]           = useState<File | null>(null)
  const [dragOver, setDragOver]   = useState(false)

  async function handleImport() {
    if (!file) return
    setImporting(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', deckName)

    const res = await fetch('/api/decks', { method: 'POST', body: fd })
    setImporting(false)

    if (res.ok) {
      toast.success('インポート完了！')
      setShowModal(false)
      setFile(null)
      setDeckName('')
      startTrans(() => router.refresh())
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'インポートに失敗しました')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return
    const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('削除しました')
      startTrans(() => router.refresh())
    } else toast.error('削除に失敗しました')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">マイ単語帳</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
        >
          ＋ 追加
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => {
          const stats = statsMap[deck.id] ?? {}
          return (
            <div key={deck.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-3xl">📚</span>
                  <h2 className="font-bold text-slate-800 mt-1 text-base leading-tight">{deck.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{deck._count.cards}枚 · 第{deck.currentRound}周目</p>
                </div>
                <button onClick={() => handleDelete(deck.id, deck.name)} className="text-slate-300 hover:text-red-400 transition text-lg">🗑</button>
              </div>

              {/* Status summary */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {stats.correct   > 0 && <span className="text-xs bg-green-50  text-green-700  px-2 py-0.5 rounded-full font-medium">✓ {stats.correct}</span>}
                {stats.incorrect > 0 && <span className="text-xs bg-red-50    text-red-700    px-2 py-0.5 rounded-full font-medium">✗ {stats.incorrect}</span>}
                {stats.star      > 0 && <span className="text-xs bg-amber-50  text-amber-700  px-2 py-0.5 rounded-full font-medium">⭐ {stats.star}</span>}
                {stats.pending   > 0 && <span className="text-xs bg-slate-100 text-slate-600  px-2 py-0.5 rounded-full font-medium">⏭ {stats.pending}</span>}
              </div>

              <div className="mt-auto flex gap-2">
                <Link
                  href={`/decks/${deck.id}/study`}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg text-center transition"
                >
                  ▶ 学習
                </Link>
                <Link
                  href={`/decks/${deck.id}`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition"
                >
                  詳細
                </Link>
              </div>
            </div>
          )
        })}

        {/* Add card */}
        <button
          onClick={() => setShowModal(true)}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition min-h-[160px]"
        >
          <span className="text-4xl">➕</span>
          <span className="font-medium text-sm">新しいデッキを追加</span>
          <span className="text-xs opacity-70">CSVをインポート</span>
        </button>
      </div>

      {/* Import modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">📂 デッキを追加</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">デッキ名（省略可）</label>
              <input
                type="text"
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                placeholder="例：Salesforce問題集"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition mb-1 ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
              onClick={() => document.getElementById('csv-input')?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f?.name.endsWith('.csv')) setFile(f)
                else toast.error('CSVファイルを選択してください')
              }}
            >
              {file ? (
                <p className="text-sm text-slate-700 font-medium">📄 {file.name}</p>
              ) : (
                <>
                  <span className="text-4xl">📄</span>
                  <p className="text-sm font-medium mt-2">CSVをドロップ、またはクリックして選択</p>
                </>
              )}
            </div>
            <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-slate-400 mb-4">形式: FrontText, BackText, Comment, ...</p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">キャンセル</button>
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-40"
              >
                {importing ? 'インポート中...' : 'インポート'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
