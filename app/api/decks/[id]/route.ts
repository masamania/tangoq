import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/decks/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const deck = await prisma.deck.findFirst({ where: { id, userId: session.user.id } })
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.deck.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// PATCH /api/decks/[id]  — update name or increment round
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }   = await params
  const body     = await req.json() as { name?: string; incrementRound?: boolean }

  const deck = await prisma.deck.findFirst({ where: { id, userId: session.user.id } })
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.deck.update({
    where: { id },
    data:  {
      ...(body.name             ? { name: body.name }              : {}),
      ...(body.incrementRound   ? { currentRound: { increment: 1 } } : {}),
    },
  })
  return NextResponse.json(updated)
}
