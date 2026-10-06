import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { Icon } from '../components/Icon'
import { ListManager } from '../components/ListManager'
import { QuickAdd } from '../components/QuickAdd'
import { Sidebar } from '../components/Sidebar'
import { TaskEditor } from '../components/TaskEditor'
import { TaskList } from '../components/TaskList'
import { useLists } from '../hooks/useLists'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../hooks/useTheme'
import { todayStr, tomorrowStr } from '../lib/dates'
import { supabase } from '../lib/supabase'
import type { List, NewTask } from '../lib/types'
import {
  countOpen,
  isViewKey,
  sectionsForList,
  sectionsForSearch,
  sectionsForView,
  VIEWS,
  type ViewKey,
} from '../lib/views'

const EMPTY_STATES: Record<ViewKey | 'list' | 'search', { emoji: string; text: string }> = {
  today: { emoji: '🎉', text: 'Nothing due today. Enjoy it — or add something above.' },
  upcoming: { emoji: '🗓️', text: 'Nothing scheduled. Tasks with a future due date show up here.' },
  all: { emoji: '✨', text: 'No open tasks. Add your first one above.' },
  completed: { emoji: '✅', text: 'Nothing completed yet. Tick off a task and it lands here.' },
  list: { emoji: '📝', text: 'This list is empty. Add a task above.' },
  search: { emoji: '🔍', text: 'No tasks match your search.' },
}

/** The main app: sidebar + the selected view (/today, /upcoming, /all, /completed, /list/:id). */
export function Home() {
  const { user } = useAuth()
  const userId = user!.id // ProtectedRoute guarantees a user here
  const { view, listId } = useParams()
  const navigate = useNavigate()

  const tasksApi = useTasks(userId)
  const listsApi = useLists(userId)
  const { tasks } = tasksApi
  const { lists } = listsApi
  const { theme, toggle: toggleTheme } = useTheme()

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [listDialog, setListDialog] = useState<{ list?: List } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const quickAddRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const today = todayStr()
  const listsById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists])
  const counts = useMemo(() => countOpen(tasks, today), [tasks, today])

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

  // ── Work out which view we're on ──────────────────────────────────────────
  const isList = view === 'list' && !!listId
  const activeList = isList ? listsById.get(listId) : undefined
  if (!isList && !isViewKey(view)) return <Navigate to="/today" replace />
  if (isList && !listsApi.loading && !activeList) return <Navigate to="/today" replace />

  const query = search.trim()
  const viewKey = isList ? null : (view as ViewKey)
  const sections = query
    ? sectionsForSearch(query, tasks)
    : isList
      ? sectionsForList(listId, tasks)
      : sectionsForView(viewKey!, tasks, today)

  const title = query
    ? `Search: “${query}”`
    : isList
      ? (activeList?.name ?? '')
      : VIEWS.find((v) => v.key === viewKey)!.label
  const emptyState = EMPTY_STATES[query ? 'search' : isList ? 'list' : viewKey!]

  // New tasks inherit sensible defaults from the current view.
  let defaults: Partial<NewTask> | null = {}
  let addContext: string | undefined
  if (query || viewKey === 'completed') defaults = null
  else if (viewKey === 'today') {
    defaults = { due_date: today }
    addContext = 'New tasks are due today.'
  } else if (viewKey === 'upcoming') {
    defaults = { due_date: tomorrowStr() }
    addContext = 'New tasks are due tomorrow — click a task to change its date.'
  } else if (isList && activeList) {
    defaults = { list_id: activeList.id }
  }

  const editingTask = editingId ? tasks.find((t) => t.id === editingId) : undefined
  const error = tasksApi.error ?? listsApi.error
  const loading = tasksApi.loading || listsApi.loading

  async function saveList(name: string, color: string) {
    const existing = listDialog?.list
    setListDialog(null)
    if (existing) {
      await listsApi.updateList(existing.id, { name, color })
    } else {
      const created = await listsApi.addList(name, color)
      if (created) navigate(`/list/${created.id}`)
    }
  }

  async function deleteList(list: List) {
    setListDialog(null)
    if (listId === list.id) navigate('/today')
    if (await listsApi.deleteList(list.id)) tasksApi.detachList(list.id)
  }

  const sidebar = (
    <Sidebar
      lists={lists}
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
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 md:block dark:border-slate-800 dark:bg-slate-900/50">
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
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="menu" />
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
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="w-full rounded-lg border border-transparent bg-slate-100 py-1.5 pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:bg-slate-900 dark:focus:bg-slate-950"
            />
          </div>
          <div className="flex-1" />
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
          <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
            <div className="mb-6">
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                {activeList && !query && (
                  <span className="size-3.5 rounded-full" style={{ backgroundColor: activeList.color }} />
                )}
                {title}
              </h1>
              {viewKey === 'today' && !query && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{format(parseISO(today), 'EEEE, MMMM d')}</p>
              )}
            </div>

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
                inputRef={quickAddRef}
                context={addContext}
                onAdd={(t) => tasksApi.addTask({ ...defaults, title: t })}
              />
            )}

            {loading ? (
              <div className="space-y-3" aria-label="Loading tasks">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl" aria-hidden="true">{emptyState.emoji}</div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{emptyState.text}</p>
              </div>
            ) : (
              <TaskList
                sections={sections}
                listsById={listsById}
                showList={!isList}
                today={today}
                onToggle={tasksApi.toggleDone}
                onOpen={(t) => setEditingId(t.id)}
                onDelete={(t) => tasksApi.deleteTask(t.id)}
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
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            tasksApi.updateTask(editingTask.id, patch)
            setEditingId(null)
          }}
          onDelete={() => {
            tasksApi.deleteTask(editingTask.id)
            setEditingId(null)
          }}
        />
      )}

      {listDialog && (
        <ListManager
          list={listDialog.list}
          onClose={() => setListDialog(null)}
          onSave={saveList}
          onDelete={listDialog.list ? () => deleteList(listDialog.list!) : undefined}
        />
      )}
    </div>
  )
}
