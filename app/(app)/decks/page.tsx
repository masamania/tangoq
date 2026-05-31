import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DeckGrid from '@/components/DeckGrid'

export default async function DecksPage() {
  const session = await auth()
  const userId  = session!.user!.id!

  const decks = await prisma.deck.findMany({
    where:   { userId },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Count statuses per deck
  const deckStats = await Promise.all(
    decks.map(async (deck: { id: string }) => {
      const grouped = await prisma.card.groupBy({
        by:    ['status'],
        where: { deckId: deck.id, status: { not: null } },
        _count: true,
      })
      const counts: Record<string, number> = {}
      grouped.forEach((g: { status: string | null; _count: number }) => { if (g.status) counts[g.status] = g._count })
      return { deckId: deck.id, counts }
    }),
  )

  const statsMap = Object.fromEntries(deckStats.map((s) => [s.deckId, s.counts]))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <DeckGrid decks={decks} statsMap={statsMap} />
    </main>
  )
}
