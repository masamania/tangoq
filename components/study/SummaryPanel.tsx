'use client'

import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Props {
  deckId:   string
  deckName: string
  round:    number
  onClose:  () => void
}

export default function SummaryPanel({ deckId, deckName, round, onClose }: Props) {
  const [summary,    setSummary]    = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [hasSaved,   setHasSaved]   = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Load saved summary if exists
  useEffect(() => {
    fetch(`/api/summary?deckId=${deckId}&round=${round}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.content) { setSummary(data.content); setHasSaved(true) } })
      .catch(() => {})
  }, [deckId, round])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [summary])

  async function generate() {
    setIsLoading(true)
    setSummary('')
    try {
      const res = await fetch('/api/summary', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deckId, round }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'まとめの生成に失敗しました')
        return
      }

      const reader  = res.body?.getReader()
      const decoder = new TextDecoder()
      let   text    = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setSummary(text)
      }

      setHasSaved(true)
      toast.success('まとめを保存しました！')
    } catch {
      toast.error('まとめの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-4 flex items-center gap-3">
        <span className="text-xl">📝</span>
        <div className="flex-1">
          <div className="font-bold text-sm">第 {round} 周目 まとめ</div>
          <div className="text-xs opacity-70">{deckName}</div>
        </div>
        {hasSaved && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">保存済</span>}
        <button onClick={onClose} className="opacity-70 hover:opacity-100 text-xl">×</button>
      </div>

      <div className="p-5">
        {!summary && !isLoading && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-4">
              このラウンドのAI会話を元に、記憶定着のまとめをClaudeが作成します。
            </p>
            <button
              onClick={generate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition text-sm"
            >
              🚀 まとめを生成する
            </button>
          </div>
        )}

        {isLoading && !summary && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        {summary && (
          <>
            <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap mb-4 max-h-96 overflow-y-auto text-sm">
              {summary}
            </div>
            <div ref={endRef} />
            {!isLoading && (
              <button
                onClick={generate}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 border-t border-slate-100 transition"
              >
                🔄 再生成
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
