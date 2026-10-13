import { addDaysStr, formatDayHeading, localDay, weekLabel, weekStartOf } from './dates'
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
  /** Visually flag the section (overdue / missed tasks). */
  tone?: 'danger'
  /** Rendered folded by default (older completed tasks). */
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

/** The local day a task was completed on, or null if it's open. */
export function doneDay(t: Task): string | null {
  return t.is_done && t.completed_at ? localDay(t.completed_at) : null
}

export function isOverdue(t: Task, today: string): boolean {
  return !t.is_done && !!t.due_date && t.due_date < today
}

/** Due on `day` (in the past) and not finished that day — still open, or done later. */
function wasMissed(t: Task, day: string, today: string): boolean {
  if (t.due_date !== day || day >= today) return false
  const done = doneDay(t)
  return done === null || done > day
}

function nonEmpty(sections: Section[]): Section[] {
  return sections.filter((s) => s.tasks.length > 0)
}

/**
 * Checked tasks don't vanish: anything in `scope` completed today goes into a
 * "Completed today" section under the open tasks, on every screen.
 */
function completedToday(scope: Task[], today: string): Section {
  const done = scope.filter((t) => doneDay(t) === today).sort(byCompletedDesc)
  return { title: `Completed today (${done.length})`, tasks: done }
}

function openAndDoneSections(scope: Task[], today: string, olderTitle = 'Earlier completed'): Section[] {
  const older = scope.filter((t) => t.is_done && doneDay(t) !== today).sort(byCompletedDesc)
  return nonEmpty([
    { tasks: scope.filter(open).sort(compareTasks) },
    completedToday(scope, today),
    { title: `${olderTitle} (${older.length})`, tasks: older, collapsible: true },
  ])
}

export function sectionsForView(view: ViewKey, tasks: Task[], today: string): Section[] {
  switch (view) {
    case 'today': {
      const overdue = tasks.filter((t) => isOverdue(t, today)).sort(compareTasks)
      const dueToday = tasks.filter((t) => open(t) && t.due_date === today).sort(compareTasks)
      return nonEmpty([
        { title: 'Overdue', tasks: overdue, tone: 'danger' },
        { title: overdue.length ? 'Today' : undefined, tasks: dueToday },
        completedToday(tasks, today),
      ])
    }
    case 'upcoming': {
      const future = tasks.filter((t) => open(t) && !!t.due_date && t.due_date > today)
      const byDay = new Map<string, Task[]>()
      for (const t of future) byDay.set(t.due_date!, [...(byDay.get(t.due_date!) ?? []), t])
      const days = [...byDay.keys()]
        .sort()
        .map((day) => ({ title: formatDayHeading(day), tasks: byDay.get(day)!.sort(compareTasks) }))
      const futureDoneToday = tasks.filter((t) => !!t.due_date && t.due_date > today)
      return nonEmpty([...days, completedToday(futureDoneToday, today)])
    }
    case 'all':
      return nonEmpty([{ tasks: tasks.filter(open).sort(compareTasks) }, completedToday(tasks, today)])
    case 'completed': {
      // Full history of finished tasks, grouped by the day they were done.
      const byDay = new Map<string, Task[]>()
      for (const t of tasks) {
        const day = doneDay(t)
        if (day) byDay.set(day, [...(byDay.get(day) ?? []), t])
      }
      return [...byDay.keys()]
        .sort()
        .reverse()
        .map((day) => ({ title: formatDayHeading(day), tasks: byDay.get(day)!.sort(byCompletedDesc) }))
    }
  }
}

export function sectionsForCategory(listId: string, tasks: Task[], today: string): Section[] {
  return openAndDoneSections(tasks.filter((t) => t.list_id === listId), today)
}

export function sectionsForTag(tag: string, tasks: Task[], today: string): Section[] {
  return openAndDoneSections(tasks.filter((t) => t.tags.includes(tag)), today)
}

/** One day of history: what was missed, still due, and done that day. */
export function sectionsForDay(day: string, tasks: Task[], today: string): Section[] {
  const missed = tasks.filter((t) => wasMissed(t, day, today)).sort(compareTasks)
  const due = day >= today ? tasks.filter((t) => open(t) && t.due_date === day).sort(compareTasks) : []
  const done = tasks.filter((t) => doneDay(t) === day).sort(byCompletedDesc)
  return nonEmpty([
    { title: `Missed (${missed.length})`, tasks: missed, tone: 'danger' },
    { title: day === today ? 'Due today' : 'Due', tasks: due },
    { title: `Completed (${done.length})`, tasks: done },
  ])
}

/** A week of history, one section per day with activity (Monday first). */
export function sectionsForWeek(start: string, tasks: Task[], today: string): Section[] {
  const sections: Section[] = []
  for (let i = 0; i < 7; i++) {
    const day = addDaysStr(start, i)
    const dayTasks = sectionsForDay(day, tasks, today).flatMap((s) => s.tasks)
    if (dayTasks.length) sections.push({ title: formatDayHeading(day), tasks: dayTasks })
  }
  return sections
}

export function sectionsForSearch(query: string, tasks: Task[]): Section[] {
  const q = query.trim().toLowerCase().replace(/^#/, '')
  const hits = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.notes ?? '').toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)),
  )
  return nonEmpty([
    { tasks: hits.filter(open).sort(compareTasks) },
    { title: 'Completed', tasks: hits.filter((t) => t.is_done).sort(byCompletedDesc) },
  ])
}

export type StatusFilter = 'all' | 'active' | 'completed'

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

export function isStatusFilter(value: string | null): value is StatusFilter {
  return STATUS_FILTERS.some((f) => f.key === value)
}

/** How many tasks a screen shows under each status tab. */
export function countByStatus(sections: Section[]): Record<StatusFilter, number> {
  const all = sections.flatMap((s) => s.tasks)
  const completed = all.filter((t) => t.is_done).length
  return { all: all.length, active: all.length - completed, completed }
}

/** Narrows a screen's sections to open or finished tasks. Completed sections stay unfolded. */
export function filterSections(sections: Section[], filter: StatusFilter): Section[] {
  if (filter === 'all') return sections
  const keep = filter === 'completed'
  return nonEmpty(
    sections.map((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.is_done === keep),
      collapsible: keep ? false : s.collapsible,
    })),
  )
}

/** Open tasks for the "Coming up" panel: overdue, today, tomorrow and the rest of the next 7 days. */
export function comingUp(tasks: Task[], today: string) {
  const tomorrow = addDaysStr(today, 1)
  const weekOut = addDaysStr(today, 7)
  const openDated = tasks.filter((t) => open(t) && !!t.due_date).sort(compareTasks)
  const overdue = openDated.filter((t) => t.due_date! < today)
  const dueToday = openDated.filter((t) => t.due_date === today)
  const dueTomorrow = openDated.filter((t) => t.due_date === tomorrow)
  const later = openDated
    .filter((t) => t.due_date! > tomorrow && t.due_date! <= weekOut)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!) || compareTasks(a, b))
  return {
    sections: nonEmpty([
      { title: 'Overdue', tasks: overdue, tone: 'danger' },
      { title: 'Today', tasks: dueToday },
      { title: 'Tomorrow', tasks: dueTomorrow },
      { title: 'Next 7 days', tasks: later },
    ]),
    /** What deserves attention now: overdue + today + tomorrow. */
    urgent: overdue.length + dueToday.length + dueTomorrow.length,
    overdue: overdue.length,
  }
}

/** Today's plan: everything due by today plus what was finished today. */
export function todayProgress(tasks: Task[], today: string) {
  let done = 0
  let left = 0
  for (const t of tasks) {
    if (doneDay(t) === today) done++
    else if (open(t) && t.due_date && t.due_date <= today) left++
  }
  return { done, total: done + left }
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

export interface TagSummary {
  tag: string
  open: number
}

/** Every tag in use (alphabetical), with how many open tasks carry it. */
export function collectTags(tasks: Task[]): TagSummary[] {
  const counts = new Map<string, number>()
  for (const t of tasks) {
    for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + (t.is_done ? 0 : 1))
  }
  return [...counts.entries()]
    .map(([tag, open]) => ({ tag, open }))
    .sort((a, b) => a.tag.localeCompare(b.tag))
}

export interface HistoryDay {
  day: string
  done: number
  missed: number
}

export interface HistoryWeek {
  start: string
  label: string
  days: HistoryDay[]
}

/**
 * Weeks (newest first) that had activity up to today, each with its days
 * (Monday first). A day counts if something was completed or missed on it.
 */
export function buildHistory(tasks: Task[], today: string): HistoryWeek[] {
  const byDay = new Map<string, HistoryDay>()
  const entry = (day: string) => {
    let d = byDay.get(day)
    if (!d) byDay.set(day, (d = { day, done: 0, missed: 0 }))
    return d
  }
  for (const t of tasks) {
    const done = doneDay(t)
    if (done && done <= today) entry(done).done++
    if (t.due_date && wasMissed(t, t.due_date, today)) entry(t.due_date).missed++
  }

  const weeks = new Map<string, HistoryDay[]>()
  for (const d of byDay.values()) {
    const start = weekStartOf(d.day)
    weeks.set(start, [...(weeks.get(start) ?? []), d])
  }
  // Always show the current week so today is one click away.
  const thisWeek = weekStartOf(today)
  if (!weeks.has(thisWeek)) weeks.set(thisWeek, [])

  return [...weeks.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([start, days]) => ({
      start,
      label: weekLabel(start, today),
      days: days.sort((a, b) => a.day.localeCompare(b.day)),
    }))
}
