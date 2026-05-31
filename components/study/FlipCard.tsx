'use client'

interface Props {
  front:   string
  back:    string
  flipped: boolean
  onClick: () => void
}

export default function FlipCard({ front, back, flipped, onClick }: Props) {
  return (
    <div
      className="w-full cursor-pointer"
      style={{ perspective: '1200px' }}
      onClick={onClick}
    >
      <div
        className="relative w-full rounded-2xl shadow-md transition-transform duration-500"
        style={{
          transformStyle:     'preserve-3d',
          transform:          flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          height:             '300px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-white rounded-2xl p-6 flex flex-col overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-3">問 題</span>
          <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto text-slate-800">{front}</p>
          <p className="text-center text-[11px] text-slate-300 mt-3">クリックして答えを確認 →</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-indigo-700 text-white rounded-2xl p-6 flex flex-col overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-3">正 解</span>
          <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">{back}</p>
        </div>
      </div>
    </div>
  )
}
