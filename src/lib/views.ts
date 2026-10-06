import { formatDayHeading } from './dates'
import type { Task } from './types'

export type ViewKey = 'today' | 'upcoming' | 'all' | 'completed'

export const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All tasks' },
  { key: 'completed', label: 'Completed' },
]

export function isViewKey(value: string | undefined): value is ViewKey {
  return VIEWS.some((v) => v.key === value)
}

export interface Section {
  title?: string
  tasks: Task[]
  /** Visually flag the section (used for overdue tasks). */
  tone?: 'danger'
  /** Rendered folded by default (used for completed tasks inside a list). */
  collapsible?: boolean
}

/** Priority first, then earliest due date (no date last), then oldest first. */
export function compareTasks(a: Task, b: Task): number {
  if (a.priority !== b.priority) return a.priority - b.priority
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date < b.due_date ? -1 : 1
  }
  return a.created_at < b.created_at ? -1 : 1
}

function byCompletedDesc(a: Task, b: Task): number {
  return (b.completed_at ?? '').localeCompare(a.completed_at ?? '')
}

const open = (t: Task) => !t.is_done

export function isOverdue(t: Task, today: string): boolean {
  return !t.is_done && !!t.due_date && t.due_date < today
}

export function sectionsForView(view: ViewKey, tasks: Task[], today: string): Section[] {
  switch (view) {
    case 'today': {
      const overdue = tasks.filter((t) => isOverdue(t, today)).sort(compareTasks)
      const dueToday = tasks.filter((t) => open(t) && t.due_date === today).sort(compareTasks)
      return [
        { title: 'Overdue', tasks: overdue, tone: 'danger' as const },
        { title: overdue.length ? 'Today' : undefined, tasks: dueToday },
      ].filter((s) => s.tasks.length > 0)
    }
    case 'upcoming': {
      const future = tasks.filter((t) => open(t) && !!t.due_date && t.due_date > today)
      const byDay = new Map<string, Task[]>()
      for (const t of future) byDay.set(t.due_date!, [...(byDay.get(t.due_date!) ?? []), t])
      return [...byDay.keys()]
        .sort()
        .map((day) => ({ title: formatDayHeading(day), tasks: byDay.get(day)!.sort(compareTasks) }))
    }
    case 'all': {
      const all = tasks.filter(open).sort(compareTasks)
      return all.length ? [{ tasks: all }] : []
    }
    case 'completed': {
      const done = tasks.filter((t) => t.is_done).sort(byCompletedDesc)
      return done.length ? [{ tasks: done }] : []
    }
  }
}

export function sectionsForList(listId: string, tasks: Task[]): Section[] {
  const inList = tasks.filter((t) => t.list_id === listId)
  const pending = inList.filter(open).sort(compareTasks)
  const done = inList.filter((t) => t.is_done).sort(byCompletedDesc)
  const sections: Section[] = []
  if (pending.length) sections.push({ tasks: pending })
  if (done.length) sections.push({ title: `Completed (${done.length})`, tasks: done, collapsible: true })
  return sections
}

export function sectionsForSearch(query: string, tasks: Task[]): Section[] {
  const q = query.trim().toLowerCase()
  const hits = tasks.filter(
    (t) => t.title.toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q),
  )
  const pending = hits.filter(open).sort(compareTasks)
  const done = hits.filter((t) => t.is_done).sort(byCompletedDesc)
  const sections: Section[] = []
  if (pending.length) sections.push({ tasks: pending })
  if (done.length) sections.push({ title: 'Completed', tasks: done })
  return sections
}

/** Open-task counts shown next to each sidebar entry. */
export function countOpen(tasks: Task[], today: string) {
  const byList: Record<string, number> = {}
  let todayCount = 0
  let upcoming = 0
  let all = 0
  for (const t of tasks) {
    if (t.is_done) continue
    all++
    if (t.due_date && t.due_date <= today) todayCount++
    if (t.due_date && t.due_date > today) upcoming++
    if (t.list_id) byList[t.list_id] = (byList[t.list_id] ?? 0) + 1
  }
  return { today: todayCount, upcoming, all, byList }
}
