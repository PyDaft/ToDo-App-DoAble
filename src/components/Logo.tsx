import { useId } from 'react'

const TAGLINE = 'Make today doable.'

/** The DoAble mark: a check breaking out of a "D" on an indigo→violet tile. Same art as public/favicon.svg. */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M10 8h5.5a8 8 0 0 1 0 16H10z" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M8.5 16.5l4 4L23.5 9.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Mark + "DoAble" wordmark, with the tagline underneath when `tagline` is set. */
export function Logo({ size = 'md', tagline = false }: { size?: 'md' | 'lg'; tagline?: boolean }) {
  const lg = size === 'lg'
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={lg ? 'size-11' : 'size-8'} />
      <div className="leading-none">
        <span className={`font-bold tracking-tight ${lg ? 'text-2xl' : 'text-lg'}`}>
          Do
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Able</span>
        </span>
        {tagline && (
          <span className={`block text-slate-500 dark:text-slate-400 ${lg ? 'mt-1 text-sm' : 'mt-0.5 text-[11px]'}`}>
            {TAGLINE}
          </span>
        )}
      </div>
    </div>
  )
}
