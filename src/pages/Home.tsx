import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { DayProgress } from '../components/DayProgress'
import { Icon } from '../components/Icon'
import { ListManager } from '../components/ListManager'
import { LogoMark } from '../components/Logo'
import { MobileNav } from '../components/MobileNav'
import { QuickAdd } from '../components/QuickAdd'
import { Sidebar } from '../components/Sidebar'
import { StatusTabs } from '../components/StatusTabs'
import { TaskEditor } from '../components/TaskEditor'
import { TaskList } from '../components/TaskList'
import { Toast } from '../components/Toast'
import { UpcomingWidget } from '../components/UpcomingWidget'
import { useLists } from '../hooks/useLists'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import {
  formatDayHeading,
  formatDue,
  formatWeekRange,
  greeting,
  isValidDay,
  todayStr,
  tomorrowStr,
  weekLabel,
  weekStartOf,
} from '../lib/dates'
import { supabase } from '../lib/supabase'
import type { List, NewTask, Task } from '../lib/types'
import {
  buildHistory,
  collectTags,
  comingUp,
  countByStatus,
  countOpen,
  filterSections,
  isStatusFilter,
  isViewKey,
  todayProgress,
  sectionsForCategory,
  sectionsForDay,
  sectionsForSearch,
  sectionsForTag,
  sectionsForView,
  sectionsForWeek,
  VIEWS,
  type Section,
  type StatusFilter,
  type ViewKey,
} from '../lib/views'

/** How long a deleted task can be brought back with Undo. Matches the toast. */
const UNDO_MS = 8000

const FILTER_EMPTY: Record<Exclude<StatusFilter, 'all'>, { emoji: string; text: string }> = {
  active: { emoji: '🎉', text: 'Nothing left to do here. Enjoy the calm.' },
  completed: { emoji: '🌱', text: 'Nothing completed here yet. Tick off a task and it shows up here.' },
}

const shortTitle = (title: string) => (title.length > 40 ? `${title.slice(0, 39)}…` : title)

/** Which screen the URL points at. */
type Screen =
  | { kind: 'view'; key: ViewKey }
  | { kind: 'category'; id: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'day'; day: string }
  | { kind: 'week'; start: string }

function parseScreen(view: string | undefined, param: string | undefined): Screen | null {
  if (isViewKey(view) && !param) return { kind: 'view', key: view }
  if (view === 'category' && param) return { kind: 'category', id: param }
  if (view === 'tag' && param) return { kind: 'tag', tag: param }
  if (view === 'day' && isValidDay(param)) return { kind: 'day', day: param }
  if (view === 'week' && isValidDay(param)) return { kind: 'week', start: param }
  return null
}

const EMPTY_STATES: Record<ViewKey | Exclude<Screen['kind'], 'view'> | 'search', { emoji: string; text: string }> = {
  today: { emoji: '🎉', text: 'Nothing due today. Enjoy it — or add something above.' },
  upcoming: { emoji: '🗓️', text: 'Nothing scheduled. Tasks with a future due date show up here.' },
  all: { emoji: '✨', text: 'No open tasks. Add your first one above.' },
  completed: { emoji: '✅', text: 'Nothing completed yet. Tick off a task and it lands here.' },
  category: { emoji: '📝', text: 'This category is empty. Add a task above.' },
  tag: { emoji: '🏷️', text: 'No tasks with this tag.' },
  day: { emoji: '📭', text: 'Nothing was due or completed on this day.' },
  week: { emoji: '📭', text: 'Nothing was due or completed this week.' },
  search: { emoji: '🔍', text: 'No tasks match your search.' },
}

/**
 * The main app: sidebar + the selected screen
 * (/today, /upcoming, /all, /completed, /category/:id, /tag/:name, /day/:date, /week/:monday).
 */
export function Home() {
  const { user } = useAuth()
  const userId = user!.id // ProtectedRoute guarantees a user here
  const { view, param } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const tasksApi = useTasks(userId)
  const listsApi = useLists(userId)
  const { lists } = listsApi
  const { theme, toggle: toggleTheme } = useTheme()
  const { toast, show: showToast, dismiss: dismissToast } = useToast()

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [listDialog, setListDialog] = useState<{ list?: List } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [wantAdd, setWantAdd] = useState(false)
  const quickAddRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // ALL | ACTIVE | COMPLETED lives in the URL (?status=active) so Back works.
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const status: StatusFilter = isStatusFilter(statusParam) ? statusParam : 'all'
  const setStatus = (next: StatusFilter) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'all') params.delete('status')
        else params.set('status', next)
        return params
      },
      { replace: true },
    )

  // Deleted tasks are hidden at once but only removed after UNDO_MS, so Undo is instant.
  const [pendingDeletes, setPendingDeletes] = useState<ReadonlySet<string>>(new Set())
  const deleteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const { deleteTask: removeTask } = tasksApi
  useEffect(() => {
    const timers = deleteTimers.current
    return () => {
      // Leaving the app (e.g. logging out): finish any deletes still waiting.
      for (const [id, timer] of timers) {
        clearTimeout(timer)
        removeTask(id)
      }
    }
  }, [removeTask])

  const tasks = useMemo(
    () => (pendingDeletes.size ? tasksApi.tasks.filter((t) => !pendingDeletes.has(t.id)) : tasksApi.tasks),
    [tasksApi.tasks, pendingDeletes],
  )

  // The phone "+" button may switch screens first; focus the add box once it's there.
  useEffect(() => {
    if (!wantAdd || !quickAddRef.current) return
    quickAddRef.current.focus()
    quickAddRef.current.scrollIntoView({ block: 'center' })
    setWantAdd(false)
  }, [wantAdd, location.pathname])

  const today = todayStr()
  const listsById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists])
  const activeCategories = useMemo(() => lists.filter((l) => !l.archived_at), [lists])
  const archivedCategories = useMemo(() => lists.filter((l) => l.archived_at), [lists])
  const counts = useMemo(() => countOpen(tasks, today), [tasks, today])
  const tags = useMemo(() => collectTags(tasks), [tasks])
  const history = useMemo(() => buildHistory(tasks, today), [tasks, today])
  const upcoming = useMemo(() => comingUp(tasks, today), [tasks, today])
  const progress = useMemo(() => todayProgress(tasks, today), [tasks, today])

  // Shortcuts: N = new task, / = search. Ignored while typing or when a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        quickAddRef.current?.focus()
      } else if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Work out which screen we're on ────────────────────────────────────────
  if (view === 'list' && param) return <Navigate to={`/category/${param}`} replace /> // v1 links
  const screen = parseScreen(view, param)
  if (!screen) return <Navigate to="/today" replace />
  if (screen.kind === 'week' && weekStartOf(screen.start) !== screen.start) {
    return <Navigate to={`/week/${weekStartOf(screen.start)}`} replace />
  }
  const category = screen.kind === 'category' ? listsById.get(screen.id) : undefined
  if (screen.kind === 'category' && !listsApi.loading && !category) return <Navigate to="/today" replace />

  const query = search.trim()

  let sections: Section[]
  let title: string
  let subtitle: string | undefined
  // New tasks inherit sensible defaults from the current screen; null hides the add box.
  let defaults: Partial<NewTask> | null = {}
  let addContext: string | undefined

  switch (screen.kind) {
    case 'view':
      sections = sectionsForView(screen.key, tasks, today)
      title = VIEWS.find((v) => v.key === screen.key)!.label
      if (screen.key === 'today') {
        subtitle = `${greeting()} · ${format(parseISO(today), 'EEEE, MMMM d')}`
        defaults = { due_date: today }
      } else if (screen.key === 'upcoming') {
        defaults = { due_date: tomorrowStr() }
      } else if (screen.key === 'completed') {
        subtitle = 'Everything you’ve finished, by the day you finished it.'
        defaults = null
      }
      break
    case 'category':
      sections = sectionsForCategory(screen.id, tasks, today)
      title = category?.name ?? ''
      subtitle = category?.archived_at ? 'Archived category' : undefined
      defaults = { list_id: screen.id }
      break
    case 'tag':
      sections = sectionsForTag(screen.tag, tasks, today)
      title = `#${screen.tag}`
      defaults = { tags: [screen.tag] }
      addContext = `New tasks get the #${screen.tag} tag.`
      break
    case 'day': {
      sections = sectionsForDay(screen.day, tasks, today)
      title = formatDayHeading(screen.day)
      const done = history.flatMap((w) => w.days).find((d) => d.day === screen.day)
      if (done) subtitle = `${done.done} completed · ${done.missed} missed`
      if (screen.day >= today) {
        defaults = { due_date: screen.day }
      } else {
        defaults = null
      }
      break
    }
    case 'week': {
      sections = sectionsForWeek(screen.start, tasks, today)
      title = weekLabel(screen.start, today)
      subtitle = title === formatWeekRange(screen.start) ? undefined : formatWeekRange(screen.start)
      defaults = null
      break
    }
  }

  const screenAllowsAdd = defaults !== null
  /** Whether a new task with this due date shows up on the current screen. */
  const landsHere: (due: string | null) => boolean =
    screen.kind === 'view' && screen.key === 'today'
      ? (due) => !!due && due <= today
      : screen.kind === 'view' && screen.key === 'upcoming'
        ? (due) => !!due && due > today
        : screen.kind === 'day'
          ? ((day: string) => (due: string | null) => due === day)(screen.day)
          : () => true
  if (query) {
    sections = sectionsForSearch(query, tasks)
    title = `Search: “${query}”`
    subtitle = undefined
    defaults = null
  }

  const isToday = screen.kind === 'view' && screen.key === 'today' && !query
  // The Completed screen is already "completed only", so tabs would add nothing there.
  const showTabs = !(screen.kind === 'view' && screen.key === 'completed' && !query)
  const statusCounts = countByStatus(sections)
  const shownSections = showTabs ? filterSections(sections, status) : sections

  const emptyState =
    sections.length > 0 && status !== 'all'
      ? FILTER_EMPTY[status]
      : EMPTY_STATES[query ? 'search' : screen.kind === 'view' ? screen.key : screen.kind]
  const editingTask = editingId ? tasks.find((t) => t.id === editingId) : undefined
  const error = tasksApi.error ?? listsApi.error
  const loading = tasksApi.loading || listsApi.loading
  const overdueTasks = isToday && status !== 'completed' ? tasks.filter((t) => !t.is_done && !!t.due_date && t.due_date < today) : []

  function toggleTask(task: Task) {
    tasksApi.toggleDone(task)
    if (task.is_done) return
    // Positive feedback plus how close today's finish line is.
    const countsForToday = !!task.due_date && task.due_date <= today
    const left = progress.total - progress.done - 1
    showToast({
      message: !countsForToday
        ? `Completed “${shortTitle(task.title)}”`
        : left === 0
          ? 'All done for today! 🎉'
          : `Nice! ${left} left for today.`,
      action: { label: 'Undo', run: () => tasksApi.updateTask(task.id, { is_done: false, completed_at: null }) },
    })
  }

  function requestDelete(task: Task) {
    setPendingDeletes((prev) => new Set(prev).add(task.id))
    const forget = () =>
      setPendingDeletes((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    deleteTimers.current.set(
      task.id,
      setTimeout(() => {
        deleteTimers.current.delete(task.id)
        tasksApi.deleteTask(task.id)
        forget()
      }, UNDO_MS),
    )
    showToast({
      message: `Deleted “${shortTitle(task.title)}”`,
      action: {
        label: 'Undo',
        run: () => {
          clearTimeout(deleteTimers.current.get(task.id))
          deleteTimers.current.delete(task.id)
          forget()
        },
      },
    })
  }

  function addTask(picked: Pick<NewTask, 'title' | 'tags' | 'list_id' | 'due_date'>) {
    tasksApi.addTask({
      ...defaults,
      ...picked,
      tags: [...new Set([...(defaults?.tags ?? []), ...(picked.tags ?? [])])],
    })
    if (status === 'completed') setStatus('all')
    // If the chosen date sends the task off this screen, say where it went.
    const due = picked.due_date ?? null
    if (!landsHere(due)) {
      const dest = !due ? { label: 'All tasks', to: '/all' } : due <= today ? { label: 'Today', to: '/today' } : { label: formatDue(due), to: '/upcoming' }
      showToast({ message: `Added to ${dest.label}`, action: { label: 'View', run: () => navigate(dest.to) } })
    }
  }

  function moveOverdueToToday() {
    const moved = overdueTasks.map((t) => ({ id: t.id, due: t.due_date }))
    for (const t of moved) tasksApi.updateTask(t.id, { due_date: today })
    showToast({
      message: `Moved ${moved.length} ${moved.length === 1 ? 'task' : 'tasks'} to today`,
      action: { label: 'Undo', run: () => moved.forEach((t) => tasksApi.updateTask(t.id, { due_date: t.due })) },
    })
  }

  /** Phone "+" button: jump to an add box, switching to Today if this screen has none. */
  function startAdd() {
    if (status === 'completed') setStatus('all')
    if (defaults && quickAddRef.current) {
      quickAddRef.current.focus() // inside the tap, so phones open the keyboard
      quickAddRef.current.scrollIntoView({ block: 'center' })
      return
    }
    setSearch('')
    if (!screenAllowsAdd) navigate('/today')
    setWantAdd(true)
  }

  async function saveList(name: string, color: string) {
    const existing = listDialog?.list
    setListDialog(null)
    if (existing) {
      await listsApi.updateList(existing.id, { name, color })
    } else {
      const created = await listsApi.addList(name, color)
      if (created) navigate(`/category/${created.id}`)
    }
  }

  async function deleteList(list: List) {
    setListDialog(null)
    if (screen?.kind === 'category' && screen.id === list.id) navigate('/today')
    if (await listsApi.deleteList(list.id)) tasksApi.detachList(list.id)
  }

  const sidebar = (
    <Sidebar
      categories={activeCategories}
      archived={archivedCategories}
      tags={tags}
      history={history}
      counts={counts}
      userEmail={user!.email ?? ''}
      onNewList={() => setListDialog({})}
      onEditList={(list) => setListDialog({ list })}
      onNavigate={() => {
        setDrawerOpen(false)
        setSearch('')
      }}
      onLogout={() => supabase.auth.signOut()}
    />
  )

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar: fixed column on desktop, slide-out drawer on phones */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 max-md:hidden dark:border-slate-800 dark:bg-slate-900/50">
        {sidebar}
      </aside>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-50 shadow-xl dark:bg-slate-900">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 md:px-6 dark:border-slate-800">
          {/* Phones: the brand mark opens the menu (also under "More" in the bottom bar). */}
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="shrink-0 rounded-lg md:hidden">
            <LogoMark className="size-8" />
          </button>
          <div className="relative max-w-md flex-1">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearch('')
                  e.currentTarget.blur()
                }
              }}
              placeholder="Search tasks and #tags"
              aria-label="Search tasks"
              className="w-full rounded-lg border border-transparent bg-slate-100 py-1.5 pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:bg-slate-900 dark:focus:bg-slate-950"
            />
          </div>
          <div className="flex-1" />
          <UpcomingWidget
            sections={upcoming.sections}
            urgent={upcoming.urgent}
            overdue={upcoming.overdue}
            today={today}
            ready={!tasksApi.loading}
            onToggle={toggleTask}
            onOpen={(t) => setEditingId(t.id)}
          />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 pt-6 pb-36 md:px-8 md:pt-10 md:pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
                  {category && !query && (
                    <span className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  )}
                  <span className="truncate">{title}</span>
                </h1>
                {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              {showTabs && !loading && <StatusTabs value={status} counts={statusCounts} onChange={setStatus} />}
            </div>

            {isToday && !loading && status !== 'completed' && <DayProgress done={progress.done} total={progress.total} />}

            {overdueTasks.length > 0 && !loading && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/30">
                <p className="flex-1 text-sm text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">
                    {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'}.
                  </span>{' '}
                  Move {overdueTasks.length === 1 ? 'it' : 'them'} to today so nothing piles up, or open one to pick a new date.
                </p>
                <button
                  type="button"
                  onClick={moveOverdueToToday}
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  Move all to today
                </button>
              </div>
            )}

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => {
                    tasksApi.clearError()
                    listsApi.clearError()
                  }}
                >
                  <Icon name="x" className="size-4" />
                </button>
              </div>
            )}

            {defaults && (
              <QuickAdd
                key={location.pathname} // reset the category picker per screen
                inputRef={quickAddRef}
                categories={activeCategories}
                defaultCategoryId={defaults.list_id ?? undefined}
                defaultDue={defaults.due_date ?? null}
                context={addContext}
                onAdd={addTask}
              />
            )}

            {loading ? (
              <div className="space-y-3" aria-label="Loading tasks">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : shownSections.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl" aria-hidden="true">{emptyState.emoji}</div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{emptyState.text}</p>
              </div>
            ) : (
              <TaskList
                key={status} // re-open folded sections when switching tabs
                sections={shownSections}
                listsById={listsById}
                showList={screen.kind !== 'category'}
                today={today}
                onToggle={toggleTask}
                onOpen={(t) => setEditingId(t.id)}
                onDelete={requestDelete}
              />
            )}
          </div>
        </main>
      </div>

      {editingTask && (
        <TaskEditor
          key={editingTask.id}
          task={editingTask}
          lists={lists}
          tagSuggestions={tags.map((t) => t.tag)}
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            tasksApi.updateTask(editingTask.id, patch)
            setEditingId(null)
          }}
          onDelete={() => {
            requestDelete(editingTask)
            setEditingId(null)
          }}
        />
      )}

      <MobileNav counts={counts} onMenu={() => setDrawerOpen(true)} onAdd={startAdd} />
      <Toast toast={toast} onDismiss={dismissToast} />

      {listDialog && (
        <ListManager
          list={listDialog.list}
          onClose={() => setListDialog(null)}
          onSave={saveList}
          onToggleArchive={
            listDialog.list
              ? () => {
                  const list = listDialog.list!
                  setListDialog(null)
                  listsApi.setArchived(list.id, !list.archived_at)
                }
              : undefined
          }
          onDelete={listDialog.list ? () => deleteList(listDialog.list!) : undefined}
        />
      )}
    </div>
  )
}
