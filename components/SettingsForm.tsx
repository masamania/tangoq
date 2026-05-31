'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

const MODELS = [
  { id: 'claude-opus-4-8',         label: 'Claude Opus 4.8 (最高精度)'     },
  { id: 'claude-sonnet-4-6',       label: 'Claude Sonnet 4.6 (推奨・バランス)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (高速・低コスト)' },
]

interface Props {
  hasApiKey:      boolean
  preferredModel: string
  shuffleDefault: boolean
}

export default function SettingsForm({ hasApiKey, preferredModel: initialModel, shuffleDefault: initialShuffle }: Props) {
  const [apiKey,   setApiKey]   = useState('')
  const [model,    setModel]    = useState(initialModel)
  const [shuffle,  setShuffle]  = useState(initialShuffle)
  const [testing,  setTesting]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [hasKey,   setHasKey]   = useState(hasApiKey)

  async function testKey() {
    if (!apiKey) return
    setTesting(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ apiKey }),
    })
    setTesting(false)
    const data = await res.json()
    if (res.ok) toast.success('✅ APIキーは有効です！')
    else toast.error(data.error ?? 'APIキーが無効です')
  }

  async function save() {
    setSaving(true)
    const body: Record<string, unknown> = { preferredModel: model, shuffleDefault: shuffle }
    if (apiKey) body.apiKey = apiKey
    const res = await fetch('/api/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('設定を保存しました')
      if (apiKey) { setApiKey(''); setHasKey(true) }
    } else toast.error('保存に失敗しました')
  }

  return (
    <div className="space-y-6">

      {/* API Key */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
          🔑 Claude APIキー
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a> で取得できます。キーはサーバー側でAES-256暗号化して保存されます。
        </p>

        {hasKey && !apiKey && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
            ✅ APIキーは登録済みです。変更する場合は新しいキーを入力してください。
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={hasKey ? '新しいキーで上書きする場合に入力' : 'sk-ant-...'}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
          />
          <button
            onClick={testKey}
            disabled={!apiKey || testing}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition disabled:opacity-40"
          >
            {testing ? '確認中...' : '接続テスト'}
          </button>
        </div>
      </section>

      {/* Model selection */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">🤖 使用モデル</h2>
        <div className="space-y-2">
          {MODELS.map(m => (
            <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${model === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id)} className="accent-indigo-600" />
              <span className="text-sm font-medium text-slate-700">{m.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">⚙️ 学習設定</h2>
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">🔀 デフォルトでシャッフル</p>
            <p className="text-xs text-slate-400 mt-0.5">学習開始時のデフォルト設定</p>
          </div>
          <div
            onClick={() => setShuffle(s => !s)}
            className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${shuffle ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${shuffle ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        </label>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-40"
      >
        {saving ? '保存中...' : '💾 設定を保存'}
      </button>
    </div>
  )
}
