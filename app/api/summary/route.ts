import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decryptApiKey } from '@/lib/crypto'
import { z } from 'zod'

// GET /api/summary?deckId=xxx&round=N
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deckId = req.nextUrl.searchParams.get('deckId')
  const round  = Number(req.nextUrl.searchParams.get('round'))

  if (!deckId || !round) return NextResponse.json(null)

  const summary = await prisma.roundSummary.findFirst({
    where: { deckId, userId: session.user.id, round },
  })
  return NextResponse.json(summary)
}

const schema = z.object({
  deckId: z.string(),
  round:  z.number(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return new Response('Bad Request', { status: 400 })

  const { deckId, round } = body.data
  const userId = session.user.id

  // Get user's API key
  const settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings?.encryptedApiKey) {
    return new Response(
      JSON.stringify({ error: 'APIキーが設定されていません。' }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Collect all chat sessions for this deck and user
  const deck = await prisma.deck.findFirst({
    where:   { id: deckId, userId },
    include: {
      cards: {
        include: {
          chatSessions: {
            where:   { userId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' },
            take:    1, // latest session per card
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!deck) return new Response('Not found', { status: 404 })

  // Build context from cards + chats
  type CardWithSessions = typeof deck.cards[0]
  const chatContext = deck.cards
    .filter((c: CardWithSessions) => c.chatSessions.length > 0)
    .map((c: CardWithSessions) => {
      const msgs = c.chatSessions[0].messages
        .map((m: { role: string; content: string }) => `${m.role === 'user' ? '🙋 質問' : '🤖 AI'}: ${m.content}`)
        .join('\n')
      return `【カード】\n問題: ${c.front}\n正解: ${c.back}\n\n【会話】\n${msgs}`
    })
    .join('\n\n---\n\n')

  if (!chatContext) {
    return new Response(
      JSON.stringify({ error: 'まとめるAIチャットがまだありません。カードを開いてAIに質問してみましょう。' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const apiKey    = decryptApiKey(settings.encryptedApiKey)
  const anthropic = createAnthropic({ apiKey })
  const model     = settings.preferredModel || 'claude-sonnet-4-6'

  const prompt = `あなたは学習コーチです。以下は学習者が単語帳「${deck.name}」の第${round}周目で行ったAIとの学習会話です。

${chatContext}

この学習セッション全体を振り返り、以下の形式でMarkdownで要点まとめを作成してください：

# 📚 第${round}周目 学習まとめ — ${deck.name}

## 🎯 今回学んだ主なポイント
（箇条書きで5〜10点）

## ✅ よく理解できた項目
（箇条書き）

## ⚠️ 要復習・注意すべき項目
（箇条書き、具体的な内容を含める）

## 💡 記憶定着のためのヒント
（実践的なアドバイスを3〜5点）

日本語で、簡潔かつ具体的に書いてください。`

  const result = streamText({
    model:  anthropic(model),
    prompt,
    onFinish: async ({ text }) => {
      // Upsert round summary
      await prisma.roundSummary.upsert({
        where:  { id: `${deckId}-${round}` },
        update: { content: text },
        create: { id: `${deckId}-${round}`, deckId, userId, round, content: text },
      })
    },
  })

  return result.toTextStreamResponse()
}
