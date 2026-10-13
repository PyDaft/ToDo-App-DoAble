/** "3 of 5 done" bar for Today. Seeing the finish line makes people more likely to reach it. */
export function DayProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  const left = total - done
  const message =
    left === 0
      ? 'All clear for today. Nice work! 🎉'
      : done === 0
        ? 'Start with the smallest one — momentum helps.'
        : left === 1
          ? 'Just one left. Finish strong!'
          : `${left} to go — you're ${pct >= 50 ? 'over halfway' : 'on your way'}.`

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <p className="shrink-0 text-sm text-slate-500 tabular-nums dark:text-slate-400">
          {done}/{total}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Today's progress"
        className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${left === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
