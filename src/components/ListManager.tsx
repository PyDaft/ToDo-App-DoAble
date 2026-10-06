import { useState, type FormEvent } from 'react'
import { LIST_COLORS, type List } from '../lib/types'
import { Modal } from './Modal'
import { Button, inputClass } from './ui'

/** Create a list, or rename / recolor / delete an existing one. */
export function ListManager({ list, onSave, onDelete, onClose }: {
  list?: List
  onSave: (name: string, color: string) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(list?.name ?? '')
  const [color, setColor] = useState(list?.color ?? LIST_COLORS[0])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSave(trimmed, color)
  }

  return (
    <Modal title={list ? 'Edit list' : 'New list'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <div>
          <label htmlFor="list-name" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Name
          </label>
          <input id="list-name" className={inputClass} value={name} maxLength={100} required autoFocus
            placeholder="e.g. Work" onChange={(e) => setName(e.target.value)} />
        </div>

        <fieldset>
          <legend className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">Color</legend>
          <div className="flex flex-wrap gap-2">
            {LIST_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`size-8 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${
                  color === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm(`Delete "${list?.name}"? Its tasks will be kept, just without a list.`)) onDelete()
              }}
            >
              Delete list
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{list ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
