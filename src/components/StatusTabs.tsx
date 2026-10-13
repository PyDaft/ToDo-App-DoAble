import { STATUS_FILTERS, type StatusFilter } from '../lib/views'

/** ALL | ACTIVE | COMPLETED switcher for the current screen, with counts. */
export function StatusTabs({ value, counts, onChange }: {
  value: StatusFilter
  counts: Record<StatusFilter, number>
  onChange: (value: StatusFilter) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter tasks by status"
      className="flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto dark:bg-slate-900"
    >
      {STATUS_FILTERS.map((f) => {
        const selected = f.key === value
        return (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(f.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              selected
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                selected ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-200' : 'bg-slate-200/70 dark:bg-slate-800'
              }`}
            >
              {counts[f.key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
