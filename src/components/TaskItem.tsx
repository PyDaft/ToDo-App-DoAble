import { isPendingTask } from '../hooks/useTasks'
import { formatDue } from '../lib/dates'
import { priorityInfo, type List, type Task } from '../lib/types'
import { isOverdue } from '../lib/views'
import { Icon } from './Icon'

export function TaskItem({ task, list, today, onToggle, onOpen, onDelete }: {
  task: Task
  /** Shown as a chip when set (omitted inside a list's own view). */
  list?: List
  today: string
  onToggle: (task: Task) => void
  onOpen: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const priority = priorityInfo(task.priority)
  const overdue = isOverdue(task, today)
  const pending = isPendingTask(task)

  return (
    <li
      className={`group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-900 ${pending ? 'pointer-events-none opacity-60' : ''}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.is_done}
        aria-label={task.is_done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
        onClick={() => onToggle(task)}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          task.is_done
            ? 'border-slate-400 bg-slate-400 text-white dark:border-slate-600 dark:bg-slate-600'
            : `${priority.ring} hover:bg-slate-200 dark:hover:bg-slate-800`
        }`}
      >
        {task.is_done && <Icon name="check" className="size-3" />}
      </button>

      <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
        <span
          className={`block text-sm break-words ${task.is_done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}
        >
          {task.title}
        </span>
        {(task.due_date || list || task.notes) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {task.due_date && (
              <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}`}>
                <Icon name="calendar" className="size-3.5" />
                {formatDue(task.due_date)}
              </span>
            )}
            {list && (
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ backgroundColor: list.color }} />
                {list.name}
              </span>
            )}
            {task.notes && (
              <span className="inline-flex items-center" title="Has notes">
                <Icon name="notes" className="size-3.5" />
              </span>
            )}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onDelete(task)}
        aria-label={`Delete "${task.title}"`}
        className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-red-950/50"
      >
        <Icon name="trash" className="size-4" />
      </button>
    </li>
  )
}
