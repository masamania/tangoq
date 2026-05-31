import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { decryptApiKey } from './crypto'
import type { UserSettings } from '@prisma/client'

export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic (Claude)',
    icon:  '🟣',
    models: [
      { id: 'claude-opus-4-8',           label: 'Claude Opus 4.8（最高精度）'      },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6（推奨）'        },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5（高速・低コスト）' },
    ],
  },
  openai: {
    label: 'OpenAI (ChatGPT)',
    icon:  '🟢',
    models: [
      { id: 'gpt-4o',      label: 'GPT-4o（高精度）'      },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini（高速）'   },
      { id: 'o1-mini',     label: 'o1-mini（推論特化）'    },
    ],
  },
  google: {
    label: 'Google (Gemini)',
    icon:  '🔵',
    models: [
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash（最新・高速）' },
      { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro（高精度）'       },
      { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash（軽量）'       },
    ],
  },
} as const

export type Provider = keyof typeof PROVIDERS

/** Resolve the AI model instance from user settings */
export function getAiModel(settings: UserSettings) {
  const provider = (settings.preferredProvider || 'anthropic') as Provider
  const model    = settings.preferredModel

  if (provider === 'openai') {
    if (!settings.encryptedOpenAiKey) throw new Error('OpenAI APIキーが設定されていません。')
    const apiKey = decryptApiKey(settings.encryptedOpenAiKey)
    return createOpenAI({ apiKey })(model)
  }

  if (provider === 'google') {
    if (!settings.encryptedGoogleKey) throw new Error('Google AI APIキーが設定されていません。')
    const apiKey = decryptApiKey(settings.encryptedGoogleKey)
    return createGoogleGenerativeAI({ apiKey })(model)
  }

  // Default: Anthropic
  if (!settings.encryptedApiKey) throw new Error('Anthropic APIキーが設定されていません。')
  const apiKey = decryptApiKey(settings.encryptedApiKey)
  return createAnthropic({ apiKey })(model)
}

/** Default model per provider */
export function defaultModel(provider: Provider): string {
  return PROVIDERS[provider].models[0].id
}
