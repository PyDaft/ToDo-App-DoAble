import { Link } from 'react-router-dom'
import { isPendingTask } from '../hooks/useTasks'
import { formatDue, formatShortDay, formatTime } from '../lib/dates'
import { priorityInfo, type List, type Task } from '../lib/types'
import { doneDay, isOverdue } from '../lib/views'
import { Icon } from './Icon'

export function TaskItem({ task, list, today, onToggle, onOpen, onDelete }: {
  task: Task
  /** Shown as a chip when set (omitted inside a category's own view). */
  list?: List
  today: string
  onToggle: (task: Task) => void
  onOpen: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const priority = priorityInfo(task.priority)
  const overdue = isOverdue(task, today)
  const pending = isPendingTask(task)
  const completedOn = doneDay(task)

  return (
    <li
      className={`group flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-slate-100 md:py-2.5 dark:hover:bg-slate-900 ${pending ? 'pointer-events-none opacity-60' : ''}`}
    >
      {/* The visible circle is small; the padded button gives a ~44px tap target on phones. */}
      <button
        type="button"
        role="checkbox"
        aria-checked={task.is_done}
        aria-label={task.is_done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
        title={task.is_done ? 'Mark as not done' : `Complete (${priority.label} priority)`}
        onClick={() => onToggle(task)}
        className="-m-2.5 shrink-0 p-2.5 md:-m-1 md:p-1"
      >
        <span
          className={`flex size-6 items-center justify-center rounded-full border-2 transition-colors md:mt-0.5 md:size-5 ${
            task.is_done
              ? 'animate-check border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600'
              : `${priority.ring} text-transparent hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-950/40`
          }`}
        >
          <Icon name="check" className="size-3.5 md:size-3" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onOpen(task)} className="block w-full text-left">
          <span
            className={`block text-[15px] break-words md:text-sm ${task.is_done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}
          >
            {task.title}
          </span>
        </button>
        {(task.due_date || list || task.notes || task.tags.length > 0 || completedOn) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {completedOn && task.completed_at && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Icon name="check" className="size-3.5" />
                {completedOn === today ? formatTime(task.completed_at) : formatShortDay(completedOn)}
              </span>
            )}
            {task.due_date && !task.is_done && (
              <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}`}>
                <Icon name="calendar" className="size-3.5" />
                {formatDue(task.due_date)}
              </span>
            )}
            {list && (
              <Link to={`/category/${list.id}`} className="inline-flex items-center gap-1 hover:underline">
                <span className="size-2 rounded-full" style={{ backgroundColor: list.color }} />
                {list.name}
              </Link>
            )}
            {task.tags.map((tag) => (
              <Link
                key={tag}
                to={`/tag/${encodeURIComponent(tag)}`}
                className="rounded bg-slate-100 px-1.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
              >
                #{tag}
              </Link>
            ))}
            {task.notes && (
              <span className="inline-flex items-center" title="Has notes">
                <Icon name="notes" className="size-3.5" />
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(task)}
        aria-label={`Delete "${task.title}"`}
        className="-my-1 rounded-md p-2 text-slate-400 hover:bg-red-50 md:my-0 md:p-1 hover:text-red-600 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-red-950/50"
      >
        <Icon name="trash" className="size-4" />
      </button>
    </li>
  )
}
