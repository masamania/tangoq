import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DeckDetailView from '@/components/DeckDetailView'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: Props) {
  const { id }  = await params
  const session = await auth()
  const userId  = session!.user!.id!

  const deck = await prisma.deck.findFirst({
    where:   { id, userId },
    include: {
      cards: { orderBy: { order: 'asc' } },
      roundSummaries: { orderBy: { round: 'desc' }, take: 5 },
    },
  })

  if (!deck) notFound()

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <DeckDetailView deck={deck} />
    </main>
  )
}
