import { useState, type ReactNode } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { formatShortDay } from '../lib/dates'
import type { List } from '../lib/types'
import { VIEWS, type HistoryWeek, type TagSummary, type ViewKey } from '../lib/views'
import { Icon, type IconName } from './Icon'

const VIEW_ICONS: Record<ViewKey, IconName> = {
  today: 'calendar',
  upcoming: 'upcoming',
  all: 'inbox',
  completed: 'done',
}

/** How many weeks of history to list before "Show older…". */
const RECENT_WEEKS = 8

const navClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
    isActive
      ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

type SectionKey = 'categories' | 'tags' | 'history' | 'archive'
const FOLDS_KEY = 'sidebar-folds'
const DEFAULT_FOLDS: Record<SectionKey, boolean> = { categories: false, tags: false, history: false, archive: true }

/** Which sidebar sections are folded, remembered in this browser. */
function useFolds() {
  const [folds, setFolds] = useState<Record<SectionKey, boolean>>(() => {
    try {
      return { ...DEFAULT_FOLDS, ...JSON.parse(localStorage.getItem(FOLDS_KEY) ?? '{}') }
    } catch {
      return DEFAULT_FOLDS
    }
  })
  function toggle(key: SectionKey) {
    setFolds((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(FOLDS_KEY, JSON.stringify(next))
      } catch {
        // Storage blocked — folding still works for this visit.
      }
      return next
    })
  }
  return { folds, toggle }
}

function SidebarSection({ title, folded, onToggle, action, children }: {
  title: string
  folded: boolean
  onToggle: () => void
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mt-5">
      <div className="mb-1 flex items-center justify-between px-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!folded}
          className="flex items-center gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Icon name="chevron" className={`size-3 transition-transform ${folded ? '' : 'rotate-90'}`} />
          {title}
        </button>
        {action}
      </div>
      {!folded && children}
    </section>
  )
}

function CategoryLink({ list, count, onEdit, onNavigate }: {
  list: List
  count?: number
  onEdit: () => void
  onNavigate?: () => void
}) {
  return (
    <li className="group/list relative">
      <NavLink to={`/category/${list.id}`} className={navClass} onClick={onNavigate}>
        <span className="ml-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: list.color }} />
        <span className="flex-1 truncate pr-6">{list.name}</span>
        {!!count && <span className="text-xs text-slate-400 md:group-hover/list:invisible">{count}</span>}
      </NavLink>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit category ${list.name}`}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:opacity-100 md:opacity-0 md:group-hover/list:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <Icon name="pencil" className="size-3.5" />
      </button>
    </li>
  )
}

export function Sidebar({
  categories,
  archived,
  tags,
  history,
  counts,
  userEmail,
  onNewList,
  onEditList,
  onNavigate,
  onLogout,
}: {
  categories: List[]
  archived: List[]
  tags: TagSummary[]
  history: HistoryWeek[]
  counts: { today: number; upcoming: number; all: number; byList: Record<string, number> }
  userEmail: string
  onNewList: () => void
  onEditList: (list: List) => void
  /** Called after a link is clicked (closes the drawer on phones). */
  onNavigate?: () => void
  onLogout: () => void
}) {
  const { folds, toggle } = useFolds()
  const { view, param } = useParams()
  const [showOlder, setShowOlder] = useState(false)
  // Expanded weeks: the current week, plus whichever week you're looking at.
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({})
  const isWeekOpen = (w: HistoryWeek, i: number) =>
    openWeeks[w.start] ?? (i === 0 || (view === 'week' && param === w.start) || w.days.some((d) => view === 'day' && param === d.day))

  const viewCount: Partial<Record<ViewKey, number>> = {
    today: counts.today,
    upcoming: counts.upcoming,
    all: counts.all,
  }
  const weeks = showOlder ? history : history.slice(0, RECENT_WEEKS)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-4">
        <img src="/favicon.svg" alt="" className="size-7" />
        <span className="text-lg font-semibold tracking-tight">Todo</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Views, categories and history">
        <ul className="space-y-0.5">
          {VIEWS.map((v) => (
            <li key={v.key}>
              <NavLink to={`/${v.key}`} className={navClass} onClick={onNavigate}>
                <Icon name={VIEW_ICONS[v.key]} className="size-5 shrink-0" />
                <span className="flex-1">{v.label}</span>
                {!!viewCount[v.key] && <span className="text-xs text-slate-400">{viewCount[v.key]}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <SidebarSection
          title="Categories"
          folded={folds.categories}
          onToggle={() => toggle('categories')}
          action={
            <button
              type="button"
              onClick={onNewList}
              aria-label="New category"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Icon name="plus" className="size-4" />
            </button>
          }
        >
          <ul className="space-y-0.5">
            {categories.map((list) => (
              <CategoryLink key={list.id} list={list} count={counts.byList[list.id]}
                onEdit={() => onEditList(list)} onNavigate={onNavigate} />
            ))}
            {categories.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500">No categories yet. Click + to add one.</li>
            )}
          </ul>
        </SidebarSection>

        {tags.length > 0 && (
          <SidebarSection title="Tags" folded={folds.tags} onToggle={() => toggle('tags')}>
            <ul className="space-y-0.5">
              {tags.map(({ tag, open }) => (
                <li key={tag}>
                  <NavLink to={`/tag/${encodeURIComponent(tag)}`} className={navClass} onClick={onNavigate}>
                    <Icon name="tag" className="size-4 shrink-0 text-slate-400" />
                    <span className="flex-1 truncate">{tag}</span>
                    {!!open && <span className="text-xs text-slate-400">{open}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </SidebarSection>
        )}

        <SidebarSection title="History" folded={folds.history} onToggle={() => toggle('history')}>
          <ul className="space-y-0.5">
            {weeks.map((week, i) => {
              const expanded = isWeekOpen(week, i)
              return (
                <li key={week.start}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setOpenWeeks((prev) => ({ ...prev, [week.start]: !expanded }))}
                      aria-label={expanded ? `Collapse ${week.label}` : `Expand ${week.label}`}
                      aria-expanded={expanded}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Icon name="chevron" className={`size-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                    <NavLink to={`/week/${week.start}`} className={(s) => `${navClass(s)} flex-1 !py-1.5 !pl-1.5`} onClick={onNavigate}>
                      <Icon name="history" className="size-4 shrink-0 text-slate-400" />
                      <span className="flex-1 truncate">{week.label}</span>
                    </NavLink>
                  </div>
                  {expanded && (
                    <ul className="mb-1 ml-7 space-y-0.5">
                      {week.days.map((d) => (
                        <li key={d.day}>
                          <NavLink to={`/day/${d.day}`} className={(s) => `${navClass(s)} !py-1.5`} onClick={onNavigate}>
                            <span className="flex-1 truncate">{formatShortDay(d.day)}</span>
                            <span className="flex gap-1.5 text-xs">
                              {d.done > 0 && <span className="text-emerald-600 dark:text-emerald-400">✓{d.done}</span>}
                              {d.missed > 0 && <span className="text-red-500 dark:text-red-400">{d.missed} missed</span>}
                            </span>
                          </NavLink>
                        </li>
                      ))}
                      {week.days.length === 0 && (
                        <li className="px-3 py-1.5 text-xs text-slate-500">Nothing yet this week.</li>
                      )}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
          {history.length > RECENT_WEEKS && (
            <button
              type="button"
              onClick={() => setShowOlder((s) => !s)}
              className="mt-1 px-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {showOlder ? 'Show fewer' : `Show older… (${history.length - RECENT_WEEKS})`}
            </button>
          )}
        </SidebarSection>

        {archived.length > 0 && (
          <SidebarSection title={`Archive (${archived.length})`} folded={folds.archive} onToggle={() => toggle('archive')}>
            <ul className="space-y-0.5 opacity-80">
              {archived.map((list) => (
                <CategoryLink key={list.id} list={list} onEdit={() => onEditList(list)} onNavigate={onNavigate} />
              ))}
            </ul>
          </SidebarSection>
        )}
      </nav>

      <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2">
          <span className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-400" title={userEmail}>
            {userEmail}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="logout" className="size-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
