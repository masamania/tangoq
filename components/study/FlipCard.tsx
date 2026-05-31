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
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={onClick}
    >
      <div
        className="relative w-full rounded-2xl shadow-md transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform:      flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          height:         '300px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-white rounded-2xl flex flex-col"
          style={{ backfaceVisibility: 'hidden', overflow: 'hidden' }}
        >
          <div className="px-6 pt-6 pb-2 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
              問 題
            </span>
          </div>

          {/* Scrollable text — touch-action:pan-y allows iOS scroll without blocking parent tap */}
          <div
            className="flex-1 px-6 overflow-y-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
            }}
            onClick={e => e.stopPropagation()} // scroll area tap doesn't flip
          >
            <p className="text-base leading-relaxed whitespace-pre-wrap text-slate-800 pb-2">
              {front}
            </p>
          </div>

          <div className="px-6 py-3 flex-shrink-0 text-center">
            <span className="text-[11px] text-slate-300">タップして答えを確認 →</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-indigo-700 text-white rounded-2xl flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', overflow: 'hidden' }}
        >
          <div className="px-6 pt-6 pb-2 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              正 解
            </span>
          </div>

          <div
            className="flex-1 px-6 overflow-y-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-base leading-relaxed whitespace-pre-wrap pb-2">
              {back}
            </p>
          </div>
        </div>
      </div>

      {/* Tap zone: always flips the card */}
      <p className="text-center text-xs text-slate-400 mt-2">
        {flipped ? '↩ 問題に戻る' : '↩ タップでめくる'}
      </p>
    </div>
  )
}
