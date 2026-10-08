import { useId, useState } from 'react'
import { MAX_TAGS, normalizeTag } from '../lib/types'
import { Icon } from './Icon'
import { inputClass } from './ui'

/** Tag chips: type a tag and press Enter (or comma) to add it, × or Backspace to remove. */
export function TagInput({ id, value, onChange, suggestions }: {
  id?: string
  value: string[]
  onChange: (tags: string[]) => void
  /** Tags used before, offered as autocomplete. */
  suggestions: string[]
}) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const full = value.length >= MAX_TAGS

  function add(raw: string) {
    const tag = normalizeTag(raw)
    setDraft('')
    if (tag && !value.includes(tag) && !full) onChange([...value, tag])
  }

  return (
    <div className={`${inputClass} flex flex-wrap items-center gap-1.5 py-1.5`}>
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
        >
          #{tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded hover:text-indigo-950 dark:hover:text-white"
          >
            <Icon name="x" className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        disabled={full}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' && !e.ctrlKey && !e.metaKey) || e.key === ',') {
            e.preventDefault() // don't submit the surrounding form
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={full ? `Up to ${MAX_TAGS} tags` : value.length ? 'Add another…' : 'Add a tag, press Enter'}
        className="min-w-24 flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  )
}
