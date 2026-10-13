import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDismiss } from '../hooks/useDismiss'
import { formatDue } from '../lib/dates'
import type { Task } from '../lib/types'
import type { Section } from '../lib/views'
import { Icon } from './Icon'

const SHOWN_KEY = 'coming-up-shown'
/** Storage is unavailable: skip the auto-open rather than nag on every visit. */
const BLOCKED = 'blocked'

function readShownDay(): string | null {
  try {
    return localStorage.getItem(SHOWN_KEY)
  } catch {
    return BLOCKED
  }
}

function writeShownDay(day: string) {
  try {
    localStorage.setItem(SHOWN_KEY, day)
  } catch {
    // Blocked storage: the panel may open again next visit, which is harmless.
  }
}

/**
 * Bell in the header with a badge for what's overdue, due today or tomorrow.
 * Opens a "Coming up" panel; it pops open by itself once a day when something needs attention.
 */
export function UpcomingWidget({ sections, urgent, overdue, today, ready, onToggle, onOpen }: {
  sections: Section[]
  urgent: number
  overdue: number
  today: string
  /** Tasks have loaded, so the daily auto-open can decide. */
  ready: boolean
  onToggle: (task: Task) => void
  onOpen: (task: Task) => void
}) {
  // Daily briefing: opens by itself once per day when something is overdue or due soon.
  // `manual` takes over as soon as the person opens or closes it themselves.
  const [manual, setManual] = useState<boolean | null>(null)
  const [lastShown] = useState(readShownDay)
  const autoOpen = ready && urgent > 0 && lastShown !== today && lastShown !== BLOCKED
  const open = manual ?? autoOpen
  useEffect(() => {
    if (open && manual === null) writeShownDay(today)
  }, [open, manual, today])

  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setManual(false), [])
  useDismiss(ref, open, close)

  const total = sections.reduce((n, s) => n + s.tasks.length, 0)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setManual(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={urgent ? `Coming up: ${urgent} need attention` : 'Coming up'}
        title="Coming up"
        className={`relative rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 ${
          open ? 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        <Icon name="bell" />
        {urgent > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-4.5 font-bold text-white ${
              overdue ? 'bg-red-500' : 'bg-indigo-500'
            }`}
          >
            {urgent > 9 ? '9+' : urgent}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Coming up"
          className="animate-pop-in fixed inset-x-3 top-14 z-40 flex max-h-[70dvh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="font-semibold">Coming up</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {overdue > 0
                  ? `${overdue} overdue — tackle ${overdue === 1 ? 'it' : 'those'} first.`
                  : total > 0
                    ? 'Your next 7 days at a glance.'
                    : 'Nothing scheduled this week.'}
              </p>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Icon name="x" className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {total === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                🌤️ A clear week. Give tasks a due date and they'll show up here.
              </p>
            ) : (
              sections.map((section) => (
                <section key={section.title} className="mb-2">
                  <h3
                    className={`px-2 py-1 text-xs font-semibold tracking-wide uppercase ${
                      section.tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {section.title} · {section.tasks.length}
                  </h3>
                  <ul>
                    {section.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={false}
                          aria-label={`Complete "${task.title}"`}
                          onClick={() => {
                            setManual(true) // stay open even if this was the last urgent task
                            onToggle(task)
                          }}
                          className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600"
                        >
                          <Icon name="check" className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            close()
                            onOpen(task)
                          }}
                          className="min-w-0 flex-1 truncate text-left text-sm"
                        >
                          {task.title}
                        </button>
                        {section.title === 'Next 7 days' || section.tone === 'danger' ? (
                          <span className={`shrink-0 text-xs ${section.tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                            {formatDue(task.due_date!)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>

          <Link
            to="/upcoming"
            onClick={close}
            className="flex items-center justify-center gap-1.5 border-t border-slate-200 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-slate-50 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-slate-800/60"
          >
            See everything upcoming <Icon name="arrowRight" className="size-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
