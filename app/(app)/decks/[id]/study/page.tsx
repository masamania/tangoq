import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import StudyView from '@/components/study/StudyView'

interface Props {
  params:      Promise<{ id: string }>
  searchParams: Promise<{ filter?: string; shuffle?: string }>
}

export default async function StudyPage({ params, searchParams }: Props) {
  const { id }             = await params
  const { filter, shuffle } = await searchParams
  const session            = await auth()
  const userId             = session!.user!.id!

  const deck = await prisma.deck.findFirst({
    where:   { id, userId },
    include: { cards: { orderBy: { order: 'asc' } } },
  })

  if (!deck) notFound()

  return (
    <StudyView
      deck={deck}
      userId={userId}
      initialFilter={(filter as 'all' | 'star' | 'incorrect' | 'unanswered') ?? 'all'}
      initialShuffle={shuffle === 'true'}
    />
  )
}
