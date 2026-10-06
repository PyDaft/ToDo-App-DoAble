import { NavLink } from 'react-router-dom'
import type { List } from '../lib/types'
import { VIEWS, type ViewKey } from '../lib/views'
import { Icon, type IconName } from './Icon'

const VIEW_ICONS: Record<ViewKey, IconName> = {
  today: 'calendar',
  upcoming: 'upcoming',
  all: 'inbox',
  completed: 'done',
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
    isActive
      ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export function Sidebar({ lists, counts, userEmail, onNewList, onEditList, onNavigate, onLogout }: {
  lists: List[]
  counts: { today: number; upcoming: number; all: number; byList: Record<string, number> }
  userEmail: string
  onNewList: () => void
  onEditList: (list: List) => void
  /** Called after a link is clicked (closes the drawer on phones). */
  onNavigate?: () => void
  onLogout: () => void
}) {
  const viewCount: Partial<Record<ViewKey, number>> = {
    today: counts.today,
    upcoming: counts.upcoming,
    all: counts.all,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-4">
        <img src="/favicon.svg" alt="" className="size-7" />
        <span className="text-lg font-semibold tracking-tight">Todo</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Views and lists">
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

        <div className="mt-6 mb-1 flex items-center justify-between px-3">
          <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">Lists</h2>
          <button
            type="button"
            onClick={onNewList}
            aria-label="New list"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="plus" className="size-4" />
          </button>
        </div>
        <ul className="space-y-0.5">
          {lists.map((list) => (
            <li key={list.id} className="group/list relative">
              <NavLink to={`/list/${list.id}`} className={navClass} onClick={onNavigate}>
                <span className="ml-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: list.color }} />
                <span className="flex-1 truncate pr-6">{list.name}</span>
                {!!counts.byList[list.id] && (
                  <span className="text-xs text-slate-400 md:group-hover/list:invisible">{counts.byList[list.id]}</span>
                )}
              </NavLink>
              <button
                type="button"
                onClick={() => onEditList(list)}
                aria-label={`Edit list ${list.name}`}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:opacity-100 md:opacity-0 md:group-hover/list:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <Icon name="pencil" className="size-3.5" />
              </button>
            </li>
          ))}
          {lists.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-500">No lists yet. Click + to add one.</li>
          )}
        </ul>
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
