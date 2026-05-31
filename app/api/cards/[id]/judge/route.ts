import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['correct', 'incorrect', 'pending', 'star']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }   = await params
  const body     = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  // Verify the card belongs to the user
  const card = await prisma.card.findFirst({
    where: { id, deck: { userId: session.user.id } },
  })
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.card.update({
    where: { id },
    data:  { status: body.data.status },
  })
  return NextResponse.json(updated)
}
