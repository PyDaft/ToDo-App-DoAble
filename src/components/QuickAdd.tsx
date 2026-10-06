import { useState, type FormEvent, type Ref } from 'react'
import { Icon } from './Icon'

/** One-line "add a task" box. Press Enter to add, Esc to leave. */
export function QuickAdd({ inputRef, onAdd, context }: {
  inputRef: Ref<HTMLInputElement>
  onAdd: (title: string) => void
  /** Explains defaults the new task will get, e.g. "Due today". */
  context?: string
}) {
  const [title, setTitle] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900">
        <Icon name="plus" className="size-5 shrink-0 text-indigo-500" />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
          placeholder="Add a task…"
          aria-label="Add a task"
          maxLength={500}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm placeholder:text-slate-400 focus:outline-none"
        />
        <kbd className="hidden rounded border border-slate-200 px-1.5 text-xs text-slate-400 sm:block dark:border-slate-700">
          N
        </kbd>
      </div>
      {context && <p className="mt-1.5 pl-1 text-xs text-slate-500">{context}</p>}
    </form>
  )
}
