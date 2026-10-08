import { useState, type FormEvent, type Ref } from 'react'
import { extractTags, type List, type NewTask } from '../lib/types'
import { Icon } from './Icon'

/**
 * One-line "add a task" box with a category picker. "#word" in the title
 * becomes a tag. Press Enter to add, Esc to leave.
 */
export function QuickAdd({ inputRef, categories, defaultCategoryId, onAdd, context }: {
  inputRef: Ref<HTMLInputElement>
  categories: List[]
  defaultCategoryId?: string
  onAdd: (task: Pick<NewTask, 'title' | 'tags' | 'list_id'>) => void
  /** Explains defaults the new task will get, e.g. "Due today". */
  context?: string
}) {
  const [text, setText] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const { title, tags } = extractTags(text)
    if (!title) return
    onAdd({ title, tags, list_id: categoryId || null })
    setText('')
  }

  const category = categories.find((c) => c.id === categoryId)

  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900">
        <Icon name="plus" className="size-5 shrink-0 text-indigo-500" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
          placeholder="Add a task…  (use #tag for tags)"
          aria-label="Add a task"
          maxLength={500}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm placeholder:text-slate-400 focus:outline-none"
        />
        <label className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <span
            className="size-2.5 rounded-full border border-slate-300 dark:border-slate-600"
            style={category ? { backgroundColor: category.color, borderColor: category.color } : undefined}
          />
          <span className="sr-only">Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="max-w-28 cursor-pointer bg-transparent focus:outline-none"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <kbd className="hidden rounded border border-slate-200 px-1.5 text-xs text-slate-400 sm:block dark:border-slate-700">
          N
        </kbd>
      </div>
      {context && <p className="mt-1.5 pl-1 text-xs text-slate-500">{context}</p>}
    </form>
  )
}
