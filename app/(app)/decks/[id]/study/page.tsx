import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import StudyView from '@/components/study/StudyView'

interface Props {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ filter?: string; shuffle?: string }>
}

export default async function StudyPage({ params, searchParams }: Props) {
  const { id }              = await params
  const { filter, shuffle } = await searchParams
  const session             = await auth()
  const userId              = session!.user!.id!

  const deck = await prisma.deck.findFirst({
    where:   { id, userId },
    include: { cards: { orderBy: { order: 'asc' } } },
  })

  if (!deck) notFound()

  // Settings are optional — fail gracefully if not found
  let autoAdvance      = false
  let autoAdvanceDelay = 3
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId } })
    if (settings) {
      autoAdvance      = settings.autoAdvance      ?? false
      autoAdvanceDelay = settings.autoAdvanceDelay ?? 3
    }
  } catch {
    // DB field might not exist yet — use defaults
  }

  return (
    <StudyView
      deck={deck!}
      userId={userId}
      initialFilter={(filter as 'all' | 'star' | 'incorrect' | 'unanswered') ?? 'all'}
      initialShuffle={shuffle === 'true'}
      autoAdvance={autoAdvance}
      autoAdvanceDelay={autoAdvanceDelay}
    />
  )
}
