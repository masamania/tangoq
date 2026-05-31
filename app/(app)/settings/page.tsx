import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const session = await auth()
  const userId  = session!.user!.id!

  const settings = await prisma.userSettings.findUnique({ where: { userId } })

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">⚙️ 設定</h1>
      <SettingsForm
        hasApiKey={!!settings?.encryptedApiKey}
        preferredModel={settings?.preferredModel ?? 'claude-sonnet-4-6'}
        shuffleDefault={settings?.shuffleDefault ?? false}
      />
    </main>
  )
}
