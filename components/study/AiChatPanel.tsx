'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message { role: 'user' | 'assistant'; content: string }

interface CardContext {
  id:      string
  front:   string
  back:    string
  comment: string
}

interface Props {
  card:   CardContext
  userId: string
}

const SUGGESTIONS = [
  'この問題のポイントをもっと詳しく教えて',
  'なぜこの答えになるの？',
  '関連する概念も説明して',
  '覚えやすい方法を教えて',
]

export default function AiChatPanel({ card }: Props) {
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [sessionId,   setSessionId]   = useState<string | undefined>()
  const [loadingHist, setLoadingHist] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  // Load existing chat history
  useEffect(() => {
    setLoadingHist(true)
    fetch(`/api/chat-sessions/${card.id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          setSessionId(data.id)
          setMessages(data.messages.map((m: { role: string; content: string }) => ({
            role:    m.role as 'user' | 'assistant',
            content: m.content,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHist(false))
  }, [card.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cardId:        card.id,
          chatSessionId: sessionId,
          messages:      newMessages,
          card:          { front: card.front, back: card.back, comment: card.comment },
        }),
        signal: ctrl.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'エラーが発生しました')
        setMessages(prev => prev.slice(0, -1))
        return
      }

      // Get session ID from response header
      const sid = res.headers.get('X-Chat-Session-Id')
      if (sid) setSessionId(sid)

      // Stream the response
      const reader    = res.body?.getReader()
      const decoder   = new TextDecoder()
      let   assistant = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistant += decoder.decode(value, { stream: true })
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistant },
        ])
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast.error('AIとの通信に失敗しました。APIキーを設定画面で確認してください。')
        setMessages(prev => prev.filter((_, i) => i !== prev.length - 1))
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [messages, card, sessionId, isLoading])

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: 480 }}>
      {/* Header */}
      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
        <span className="text-base">🤖</span>
        <span className="text-sm font-bold text-indigo-800">Claude AI — 深掘り解説</span>
        {sessionId && <span className="ml-auto text-xs text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full">会話保存済</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingHist ? (
          <p className="text-xs text-slate-400 text-center py-4">読み込み中...</p>
        ) : messages.length === 0 ? (
          <div className="py-2">
            <p className="text-xs text-slate-500 text-center mb-3">カードについて何でも質問してください</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md whitespace-pre-wrap'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                }`}
              >
                {m.role === 'assistant' ? (
                  m.content ? (
                    <div className="prose prose-sm prose-slate max-w-none
                      prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1
                      prose-headings:my-2 prose-pre:text-xs prose-code:text-xs
                      prose-strong:font-bold">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : isLoading && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : null
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-100 px-3 py-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="疑問点を入力..."
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40"
        >
          送信
        </button>
      </form>
    </div>
  )
}
