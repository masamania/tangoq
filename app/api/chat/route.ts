import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decryptApiKey } from '@/lib/crypto'
import { z } from 'zod'

const schema = z.object({
  cardId:        z.string(),
  chatSessionId: z.string().optional(),
  messages:      z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  card:          z.object({ front: z.string(), back: z.string(), comment: z.string() }),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return new Response('Bad Request', { status: 400 })

  const { cardId, chatSessionId, messages, card } = body.data
  const userId = session.user.id

  // Get user's API key
  const settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings?.encryptedApiKey) {
    return new Response(
      JSON.stringify({ error: 'APIキーが設定されていません。設定画面からClaude APIキーを登録してください。' }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const apiKey       = decryptApiKey(settings.encryptedApiKey)
  const anthropic    = createAnthropic({ apiKey })
  const model        = settings.preferredModel || 'claude-sonnet-4-6'

  // System prompt: card context
  const systemPrompt = `あなたは学習支援AIアシスタントです。ユーザーが以下のフラッシュカードを学習中です。

【問題】
${card.front}

【正解】
${card.back}

【解説】
${card.comment || '（解説なし）'}

ユーザーの疑問点や質問に対して、上記のカード内容を踏まえながら、わかりやすく詳しく説明してください。日本語で回答してください。`

  // Upsert chat session and save user message
  let sessionId = chatSessionId
  if (!sessionId) {
    const chatSession = await prisma.chatSession.create({
      data: { cardId, userId },
    })
    sessionId = chatSession.id
  }

  // Save the latest user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUserMsg) {
    await prisma.chatMessage.create({
      data: { chatSessionId: sessionId, role: 'user', content: lastUserMsg.content },
    })
  }

  // Stream response
  const result = streamText({
    model:    anthropic(model),
    system:   systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    onFinish: async ({ text }) => {
      await prisma.chatMessage.create({
        data: { chatSessionId: sessionId!, role: 'assistant', content: text },
      })
    },
  })

  const response = result.toTextStreamResponse()
  if (sessionId) response.headers.set('X-Chat-Session-Id', sessionId)
  return response
}
