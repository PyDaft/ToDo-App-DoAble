import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const TABS: { to: string; label: string; icon: IconName; count?: 'today' | 'upcoming' | 'all' }[] = [
  { to: '/today', label: 'Today', icon: 'calendar', count: 'today' },
  { to: '/upcoming', label: 'Upcoming', icon: 'upcoming', count: 'upcoming' },
  { to: '/all', label: 'All', icon: 'inbox', count: 'all' },
]

/** Phone-only bottom tab bar, plus a floating "+" button within thumb reach. */
export function MobileNav({ counts, onMenu, onAdd }: {
  counts: { today: number; upcoming: number; all: number }
  onMenu: () => void
  onAdd: () => void
}) {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
    }`

  return (
    <>
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add a task"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 active:scale-95 md:hidden"
      >
        <Icon name="plus" className="size-6" />
      </button>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={tabClass}>
            <span className="relative">
              <Icon name={t.icon} className="size-6" />
              {!!(t.count && counts[t.count]) && (
                <span className="absolute -top-1 -right-2.5 min-w-4 rounded-full bg-slate-200 px-1 text-center text-[10px] leading-4 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {counts[t.count!]}
                </span>
              )}
            </span>
            {t.label}
          </NavLink>
        ))}
        <button type="button" onClick={onMenu} className={tabClass({ isActive: false })}>
          <Icon name="menu" className="size-6" />
          More
        </button>
      </nav>
    </>
  )
}
