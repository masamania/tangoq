'use client'

const BUTTONS = [
  { status: 'correct',   icon: '✓', label: '正解',      kbd: '1', active: 'ring-2 ring-green-500 bg-green-50  text-green-700',  base: 'border-green-100 text-green-600'  },
  { status: 'incorrect', icon: '✗', label: '不正解',    kbd: '2', active: 'ring-2 ring-red-500   bg-red-50    text-red-700',    base: 'border-red-100   text-red-600'    },
  { status: 'pending',   icon: '⏭', label: '保留',      kbd: '3', active: 'ring-2 ring-slate-400 bg-slate-100 text-slate-700', base: 'border-slate-200 text-slate-600'  },
  { status: 'star',      icon: '⭐', label: 'お気に入り', kbd: '4', active: 'ring-2 ring-amber-500 bg-amber-50  text-amber-700', base: 'border-amber-100 text-amber-600'  },
] as const

interface Props {
  current?: string
  onJudge:  (status: string) => void
}

export default function JudgmentButtons({ current, onJudge }: Props) {
  return (
    <div className="flex gap-2">
      {BUTTONS.map(b => (
        <button
          key={b.status}
          onClick={() => onJudge(b.status)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md
            ${current === b.status ? b.active : b.base}`}
        >
          <span className="text-xl leading-none">{b.icon}</span>
          <span className="text-xs font-bold">{b.label}</span>
          <kbd className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-400">{b.kbd}</kbd>
        </button>
      ))}
    </div>
  )
}
