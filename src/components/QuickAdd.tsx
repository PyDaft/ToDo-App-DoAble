import { useCallback, useRef, useState, type FormEvent, type Ref } from 'react'
import { useDismiss } from '../hooks/useDismiss'
import { formatDue, nextWeekStr, todayStr, tomorrowStr } from '../lib/dates'
import { extractTags, type List, type NewTask } from '../lib/types'
import { Icon } from './Icon'

/**
 * "Add a task" box with a due-date picker and a category picker.
 * "#word" in the title becomes a tag. Press Enter (or Add) to add, Esc to leave.
 */
export function QuickAdd({ inputRef, categories, defaultCategoryId, defaultDue, onAdd, context }: {
  inputRef: Ref<HTMLInputElement>
  categories: List[]
  defaultCategoryId?: string
  /** Pre-selected due date for this screen ('YYYY-MM-DD'), or none. */
  defaultDue?: string | null
  onAdd: (task: Pick<NewTask, 'title' | 'tags' | 'list_id' | 'due_date'>) => void
  /** Explains defaults the new task will get, e.g. "New tasks get the #work tag". */
  context?: string
}) {
  const [text, setText] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '')
  const [due, setDue] = useState<string | null>(defaultDue ?? null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const { title, tags } = extractTags(text)
    if (!title) return
    onAdd({ title, tags, list_id: categoryId || null, due_date: due })
    setText('')
  }

  const category = categories.find((c) => c.id === categoryId)
  const overdue = !!due && due < todayStr()

  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="flex flex-wrap items-center gap-x-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 flex-[1_1_100%] items-center gap-2 sm:flex-1">
          <Icon name="plus" className="size-5 shrink-0 text-indigo-500" />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') e.currentTarget.blur()
            }}
            placeholder="What do you need to do?"
            aria-label="Add a task"
            enterKeyHint="done"
            maxLength={500}
            className="min-w-0 flex-1 bg-transparent py-3 text-base placeholder:text-slate-400 focus:outline-none sm:text-sm"
          />
        </div>

        {/* Controls: own row on phones, inline on wider screens */}
        <div className="flex w-full items-center gap-1 border-t border-slate-100 py-1.5 sm:w-auto sm:border-0 sm:py-0 dark:border-slate-800">
          <DuePicker value={due} onChange={setDue} overdue={overdue} />

          <label className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <span
              className="size-2.5 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
              style={category ? { backgroundColor: category.color, borderColor: category.color } : undefined}
            />
            <span className="sr-only">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="max-w-28 cursor-pointer bg-transparent focus:outline-none dark:bg-slate-900"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <div className="flex-1" />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:bg-indigo-500 disabled:opacity-0 sm:disabled:hidden"
          >
            Add
          </button>
          <kbd className="rounded border border-slate-200 px-1.5 text-xs text-slate-400 max-sm:hidden dark:border-slate-700">
            N
          </kbd>
        </div>
      </div>
      <p className="mt-1.5 pl-1 text-xs text-slate-500">
        {context ?? 'Tip: type #tag to tag a task. Press Enter to add.'}
      </p>
    </form>
  )
}

/** Due-date chip that opens Today / Tomorrow / Next week / pick a date / No date. */
function DuePicker({ value, onChange, overdue }: {
  value: string | null
  onChange: (value: string | null) => void
  overdue: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const pick = (day: string | null) => {
    onChange(day)
    close()
  }
  const options: { label: string; day: string | null; hint?: string }[] = [
    { label: 'Today', day: todayStr() },
    { label: 'Tomorrow', day: tomorrowStr() },
    { label: 'Next week', day: nextWeekStr(), hint: formatDue(nextWeekStr()) },
    { label: 'No date', day: null },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={value ? `Due ${formatDue(value)}. Change due date` : 'Set a due date'}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 ${
          overdue
            ? 'text-red-600 dark:text-red-400'
            : value
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Icon name="calendar" className="size-4" />
        {value ? formatDue(value) : 'Date'}
      </button>

      {open && (
        <div className="animate-pop-in absolute top-full left-0 z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => pick(o.day)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                o.day === value ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              {o.label}
              {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
            </button>
          ))}
          <div className="mt-1 border-t border-slate-100 px-3 pt-2 pb-1 dark:border-slate-800">
            <label htmlFor="quick-add-date" className="mb-1 block text-xs text-slate-500">Pick a date</label>
            <div className="flex gap-1.5">
              {/* Applies as you type (each typed segment fires a change), so it stays open until Enter / Done. */}
              <input
                id="quick-add-date"
                type="date"
                value={value ?? ''}
                onChange={(e) => e.target.value && onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault() // don't submit the add form
                    close()
                  }
                }}
                className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={close}
                className="rounded-md bg-indigo-600 px-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
