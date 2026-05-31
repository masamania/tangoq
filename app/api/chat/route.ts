export const dynamic = 'force-dynamic'

import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAiModel } from '@/lib/ai'
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

  const settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings) {
    return new Response(
      JSON.stringify({ error: 'APIキーが設定されていません。設定画面から登録してください。' }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let aiModel
  try {
    aiModel = getAiModel(settings)
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const systemPrompt = `あなたは学習支援AIアシスタントです。ユーザーが以下のフラッシュカードを学習中です。

【問題】
${card.front}

【正解】
${card.back}

【解説】
${card.comment || '（解説なし）'}

ユーザーの疑問点や質問に対して、上記のカード内容を踏まえながら、わかりやすく詳しく説明してください。日本語で回答してください。`

  let sessionId = chatSessionId
  if (!sessionId) {
    const chatSession = await prisma.chatSession.create({ data: { cardId, userId } })
    sessionId = chatSession.id
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUserMsg) {
    await prisma.chatMessage.create({
      data: { chatSessionId: sessionId, role: 'user', content: lastUserMsg.content },
    })
  }

  const result = streamText({
    model:    aiModel,
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
