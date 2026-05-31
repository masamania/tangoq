export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseCSV, csvToRawCards } from '@/lib/csv-parser'

// GET /api/decks
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decks = await prisma.deck.findMany({
    where:   { userId: session.user.id },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(decks)
}

// POST /api/decks  — imports a CSV file as a new deck
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const name     = (formData.get('name') as string | null)?.trim()

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text     = await file.text()
  const rows     = parseCSV(text)
  const rawCards = csvToRawCards(rows)

  if (!rawCards.length) return NextResponse.json({ error: 'No cards found in CSV' }, { status: 400 })

  const deck = await prisma.deck.create({
    data: {
      name:   name || file.name.replace(/\.csv$/i, '') || 'デッキ',
      userId: session.user.id,
      cards:  {
        create: rawCards.map((c, i) => ({
          front:    c.front,
          back:     c.back,
          comment:  c.comment,
          frontLang:c.frontLang,
          backLang: c.backLang,
          order:    i,
        })),
      },
    },
    include: { _count: { select: { cards: true } } },
  })

  return NextResponse.json(deck, { status: 201 })
}
