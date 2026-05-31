import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const session = await auth()
  const userId  = session!.user!.id!

  const s = await prisma.userSettings.findUnique({ where: { userId } })

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">⚙️ 設定</h1>
      <SettingsForm
        hasAnthropicKey={!!s?.encryptedApiKey}
        hasOpenAiKey={!!s?.encryptedOpenAiKey}
        hasGoogleKey={!!s?.encryptedGoogleKey}
        preferredProvider={s?.preferredProvider ?? 'anthropic'}
        preferredModel={s?.preferredModel ?? 'claude-sonnet-4-6'}
        shuffleDefault={s?.shuffleDefault ?? false}
        autoAdvance={s?.autoAdvance ?? false}
        autoAdvanceDelay={s?.autoAdvanceDelay ?? 3}
      />
    </main>
  )
}
