import { useState, type FormEvent } from 'react'
import { todayStr, tomorrowStr } from '../lib/dates'
import { PRIORITIES, type List, type Priority, type Task, type TaskPatch } from '../lib/types'
import { Modal } from './Modal'
import { TagInput } from './TagInput'
import { Button, inputClass } from './ui'

/** Edit every field of a task. Changes are saved together on "Save" (or Ctrl+Enter). */
export function TaskEditor({ task, lists, tagSuggestions, onSave, onDelete, onClose }: {
  task: Task
  lists: List[]
  tagSuggestions: string[]
  onSave: (patch: TaskPatch) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [listId, setListId] = useState(task.list_id ?? '')
  const [tags, setTags] = useState(task.tags)
  // Archived categories are hidden from the picker, unless this task is already in one.
  const choices = lists.filter((l) => !l.archived_at || l.id === task.list_id)

  function save(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSave({
      title: trimmed,
      notes: notes.trim() || null,
      due_date: dueDate || null,
      priority,
      list_id: listId || null,
      tags,
    })
  }

  const labelClass = 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'
  const chipClass = 'rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50'

  return (
    <Modal title="Edit task" onClose={onClose}>
      <form
        onSubmit={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
        }}
        className="space-y-4 p-5"
      >
        <div>
          <label htmlFor="task-title" className={labelClass}>Title</label>
          <input id="task-title" className={inputClass} value={title} maxLength={500} required autoFocus
            onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label htmlFor="task-notes" className={labelClass}>Notes</label>
          <textarea id="task-notes" className={`${inputClass} min-h-24 resize-y`} value={notes}
            placeholder="Add details…" onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-due" className={labelClass}>Due date</label>
            <input id="task-due" type="date" className={inputClass} value={dueDate}
              onChange={(e) => setDueDate(e.target.value)} />
            <div className="mt-1 flex gap-1">
              <button type="button" className={chipClass} onClick={() => setDueDate(todayStr())}>Today</button>
              <button type="button" className={chipClass} onClick={() => setDueDate(tomorrowStr())}>Tomorrow</button>
              {dueDate && (
                <button type="button" className={chipClass} onClick={() => setDueDate('')}>Clear</button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="task-list" className={labelClass}>Category</label>
            <select id="task-list" className={inputClass} value={listId}
              onChange={(e) => setListId(e.target.value)}>
              <option value="">No category</option>
              {choices.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.archived_at ? ' (archived)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="task-tags" className={labelClass}>Tags</label>
          <TagInput id="task-tags" value={tags} onChange={setTags} suggestions={tagSuggestions} />
        </div>

        <fieldset>
          <legend className={labelClass}>Priority</legend>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={priority === p.value}
                onClick={() => setPriority(p.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  priority === p.value
                    ? 'border-indigo-500 bg-indigo-50 font-medium dark:bg-indigo-950/50'
                    : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`size-2.5 rounded-full ${p.dot}`} />
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="danger" onClick={onDelete}>Delete</Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
