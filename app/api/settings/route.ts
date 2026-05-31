export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encryptApiKey } from '@/lib/crypto'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

// GET /api/settings
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const s = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json({
    hasAnthropicKey:   !!s?.encryptedApiKey,
    hasOpenAiKey:      !!s?.encryptedOpenAiKey,
    hasGoogleKey:      !!s?.encryptedGoogleKey,
    preferredProvider: s?.preferredProvider  ?? 'anthropic',
    preferredModel:    s?.preferredModel     ?? 'claude-sonnet-4-6',
    shuffleDefault:    s?.shuffleDefault     ?? false,
    autoAdvance:       s?.autoAdvance        ?? false,
    autoAdvanceDelay:  s?.autoAdvanceDelay   ?? 3,
  })
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>

  const updateData: Record<string, unknown> = {}
  if (body.preferredProvider !== undefined) updateData.preferredProvider = body.preferredProvider
  if (body.preferredModel    !== undefined) updateData.preferredModel    = body.preferredModel
  if (body.shuffleDefault    !== undefined) updateData.shuffleDefault    = body.shuffleDefault
  if (body.autoAdvance       !== undefined) updateData.autoAdvance       = body.autoAdvance
  if (body.autoAdvanceDelay  !== undefined) updateData.autoAdvanceDelay  = Number(body.autoAdvanceDelay)
  if (body.anthropicKey) updateData.encryptedApiKey    = encryptApiKey(body.anthropicKey as string)
  if (body.openAiKey)    updateData.encryptedOpenAiKey = encryptApiKey(body.openAiKey    as string)
  if (body.googleKey)    updateData.encryptedGoogleKey = encryptApiKey(body.googleKey    as string)

  await prisma.userSettings.upsert({
    where:  { userId: session.user.id },
    update: updateData,
    create: { userId: session.user.id, ...updateData },
  })

  return NextResponse.json({ ok: true })
}

// POST /api/settings — test an API key
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { testKey, testProvider } = await req.json() as { testKey: string; testProvider: string }
  if (!testKey) return NextResponse.json({ error: 'No key provided' }, { status: 400 })

  try {
    if (testProvider === 'openai') {
      const openai = createOpenAI({ apiKey: testKey })
      await generateText({ model: openai('gpt-4o-mini'), prompt: 'ping' })
    } else if (testProvider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey: testKey })
      await generateText({ model: google('gemini-1.5-flash'), prompt: 'ping' })
    } else {
      const anthropic = createAnthropic({ apiKey: testKey })
      await generateText({ model: anthropic('claude-haiku-4-5-20251001'), prompt: 'ping' })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'APIキーが無効です。各サービスのダッシュボードで確認してください。' }, { status: 400 })
  }
}
