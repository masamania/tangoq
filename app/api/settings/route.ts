import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { z } from 'zod'

const schema = z.object({
  apiKey:        z.string().optional(),
  preferredModel: z.string().optional(),
  shuffleDefault: z.boolean().optional(),
})

// GET /api/settings
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json({
    hasApiKey:      !!settings?.encryptedApiKey,
    preferredModel: settings?.preferredModel ?? 'claude-sonnet-4-6',
    shuffleDefault: settings?.shuffleDefault  ?? false,
  })
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { apiKey, preferredModel, shuffleDefault } = body.data

  const updateData: Record<string, unknown> = {}
  if (preferredModel !== undefined) updateData.preferredModel = preferredModel
  if (shuffleDefault !== undefined) updateData.shuffleDefault = shuffleDefault
  if (apiKey)                        updateData.encryptedApiKey = encryptApiKey(apiKey)

  await prisma.userSettings.upsert({
    where:  { userId: session.user.id },
    update: updateData,
    create: { userId: session.user.id, ...updateData },
  })

  return NextResponse.json({ ok: true })
}

// POST /api/settings/test-key  — verify the API key works
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey } = await req.json() as { apiKey?: string }

  // Use provided key or the one stored in DB
  let keyToTest = apiKey
  if (!keyToTest) {
    const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
    if (!settings?.encryptedApiKey) return NextResponse.json({ error: 'No API key' }, { status: 400 })
    keyToTest = decryptApiKey(settings.encryptedApiKey)
  }

  try {
    const anthropic = createAnthropic({ apiKey: keyToTest })
    await generateText({ model: anthropic('claude-haiku-4-5-20251001'), prompt: 'ping' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'APIキーが無効です。Anthropicのダッシュボードで確認してください。' }, { status: 400 })
  }
}
