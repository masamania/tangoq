import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import GlobalNav from '@/components/GlobalNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GlobalNav user={session.user} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
