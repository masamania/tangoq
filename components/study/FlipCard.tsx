'use client'

interface Props {
  front:   string
  back:    string
  flipped: boolean
  onClick: () => void
}

export default function FlipCard({ front, back, flipped, onClick }: Props) {
  return (
    <div className="w-full relative rounded-2xl shadow-md" style={{ height: '320px' }}>

      {/* Front */}
      <div
        className={`absolute inset-0 bg-white rounded-2xl flex flex-col overflow-hidden cursor-pointer transition-opacity duration-300 ${
          flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={onClick}
      >
        <div className="px-5 pt-5 pb-2 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">問 題</span>
        </div>

        {/* Scrollable — same pattern as AI chat panel */}
        <div className="flex-1 px-5 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <p className="text-base leading-relaxed whitespace-pre-wrap text-slate-800 pb-2">{front}</p>
        </div>

        <div className="px-5 py-3 flex-shrink-0 text-center">
          <span className="text-[11px] text-slate-300">タップして答えを確認 →</span>
        </div>
      </div>

      {/* Back */}
      <div
        className={`absolute inset-0 bg-indigo-700 text-white rounded-2xl flex flex-col overflow-hidden cursor-pointer transition-opacity duration-300 ${
          flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClick}
      >
        <div className="px-5 pt-5 pb-2 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">正 解</span>
        </div>

        <div className="flex-1 px-5 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <p className="text-base leading-relaxed whitespace-pre-wrap pb-2">{back}</p>
        </div>

        <div className="px-5 py-3 flex-shrink-0 text-center">
          <span className="text-[11px] text-indigo-300">タップして問題を確認 →</span>
        </div>
      </div>

    </div>
  )
}
