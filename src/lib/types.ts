/** 1 = high, 2 = medium, 3 = low (matches the `priority` column in schema.sql). */
export type Priority = 1 | 2 | 3

export interface List {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  list_id: string | null
  title: string
  notes: string | null
  /** Calendar date as 'YYYY-MM-DD' (no time zone). */
  due_date: string | null
  priority: Priority
  is_done: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type NewTask = Pick<Task, 'title'> &
  Partial<Pick<Task, 'notes' | 'due_date' | 'priority' | 'list_id'>>

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'notes' | 'due_date' | 'priority' | 'list_id' | 'is_done' | 'completed_at'>
>

export const DEFAULT_PRIORITY: Priority = 3

export const PRIORITIES: { value: Priority; label: string; ring: string; dot: string }[] = [
  { value: 1, label: 'High', ring: 'border-red-500', dot: 'bg-red-500' },
  { value: 2, label: 'Medium', ring: 'border-amber-500', dot: 'bg-amber-500' },
  { value: 3, label: 'Low', ring: 'border-slate-400 dark:border-slate-500', dot: 'bg-slate-400' },
]

export function priorityInfo(p: Priority) {
  return PRIORITIES.find((x) => x.value === p) ?? PRIORITIES[2]
}

export const LIST_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#a855f7', // purple
  '#64748b', // slate
]
