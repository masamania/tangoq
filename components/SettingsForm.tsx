'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { PROVIDERS, type Provider } from '@/lib/ai'

interface Props {
  hasAnthropicKey:   boolean
  hasOpenAiKey:      boolean
  hasGoogleKey:      boolean
  preferredProvider: string
  preferredModel:    string
  shuffleDefault:    boolean
}

export default function SettingsForm({
  hasAnthropicKey: initHasAnthropic,
  hasOpenAiKey:    initHasOpenAi,
  hasGoogleKey:    initHasGoogle,
  preferredProvider: initProvider,
  preferredModel:  initModel,
  shuffleDefault:  initShuffle,
}: Props) {
  const [provider,     setProvider]     = useState<Provider>((initProvider as Provider) || 'anthropic')
  const [model,        setModel]        = useState(initModel)
  const [shuffle,      setShuffle]      = useState(initShuffle)
  const [saving,       setSaving]       = useState(false)
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openAiKey,    setOpenAiKey]    = useState('')
  const [googleKey,    setGoogleKey]    = useState('')
  const [hasAnthropic, setHasAnthropic] = useState(initHasAnthropic)
  const [hasOpenAi,    setHasOpenAi]    = useState(initHasOpenAi)
  const [hasGoogle,    setHasGoogle]    = useState(initHasGoogle)
  const [testing,      setTesting]      = useState(false)

  function handleProviderChange(p: Provider) {
    setProvider(p)
    setModel(PROVIDERS[p].models[0].id)
  }

  async function testKey(keyType: Provider) {
    const keyMap: Record<Provider, string> = { anthropic: anthropicKey, openai: openAiKey, google: googleKey }
    const key = keyMap[keyType]
    if (!key) return
    setTesting(true)
    const res  = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testKey: key, testProvider: keyType }) })
    setTesting(false)
    const data = await res.json()
    if (res.ok) toast.success('✅ APIキーは有効です！')
    else        toast.error(data.error ?? 'APIキーが無効です')
  }

  async function save() {
    setSaving(true)
    const body: Record<string, unknown> = { preferredProvider: provider, preferredModel: model, shuffleDefault: shuffle }
    if (anthropicKey) body.anthropicKey = anthropicKey
    if (openAiKey)    body.openAiKey    = openAiKey
    if (googleKey)    body.googleKey    = googleKey
    const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) {
      toast.success('設定を保存しました')
      if (anthropicKey) { setAnthropicKey(''); setHasAnthropic(true) }
      if (openAiKey)    { setOpenAiKey('');    setHasOpenAi(true)    }
      if (googleKey)    { setGoogleKey('');    setHasGoogle(true)    }
    } else toast.error('保存に失敗しました')
  }

  const apiKeyConfigs = [
    { provider: 'anthropic' as Provider, label: '🟣 Anthropic (Claude)', hint: 'console.anthropic.com', placeholder: 'sk-ant-...', value: anthropicKey, setter: setAnthropicKey, hasKey: hasAnthropic },
    { provider: 'openai'    as Provider, label: '🟢 OpenAI (ChatGPT)',   hint: 'platform.openai.com',   placeholder: 'sk-proj-...', value: openAiKey,    setter: setOpenAiKey,    hasKey: hasOpenAi    },
    { provider: 'google'    as Provider, label: '🔵 Google (Gemini)',     hint: 'aistudio.google.com',   placeholder: 'AIza...',     value: googleKey,    setter: setGoogleKey,    hasKey: hasGoogle    },
  ]

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-700 mb-4">🔑 APIキー設定</h2>
        <div className="space-y-5">
          {apiKeyConfigs.map(cfg => (
            <div key={cfg.provider}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{cfg.label}</label>
              <p className="text-xs text-slate-400 mb-2"><a href={`https://${cfg.hint}`} target="_blank" rel="noopener noreferrer" className="underline">{cfg.hint}</a></p>
              {cfg.hasKey && !cfg.value && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5 mb-2">✅ 登録済み。変更する場合は新しいキーを入力</p>}
              <div className="flex gap-2">
                <input
                  type="password"
                  value={cfg.value}
                  onChange={e => cfg.setter(e.target.value)}
                  placeholder={cfg.placeholder}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                />
                <button onClick={() => testKey(cfg.provider)} disabled={!cfg.value || testing} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition disabled:opacity-40 whitespace-nowrap">
                  {testing ? '確認中...' : 'テスト'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provider & Model */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-700 mb-4">🤖 使用するAI・モデル</h2>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(Object.entries(PROVIDERS) as [Provider, (typeof PROVIDERS)[Provider]][]).map(([key, p]) => (
            <button key={key} onClick={() => handleProviderChange(key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition text-sm font-medium ${provider === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600 hover:border-slate-300'}`}>
              <span className="text-2xl">{p.icon}</span>
              <span className="text-xs text-center leading-tight">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {PROVIDERS[provider].models.map(m => (
            <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${model === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id)} className="accent-indigo-600" />
              <span className="text-sm font-medium text-slate-700">{m.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-700 mb-4">⚙️ 学習設定</h2>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-slate-700">🔀 デフォルトでシャッフル</p>
            <p className="text-xs text-slate-400 mt-0.5">学習開始時のデフォルト設定</p>
          </div>
          <div onClick={() => setShuffle(s => !s)} className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${shuffle ? 'bg-indigo-600' : 'bg-slate-200'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${shuffle ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        </label>
      </section>

      <button onClick={save} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-40">
        {saving ? '保存中...' : '💾 設定を保存'}
      </button>
    </div>
  )
}
