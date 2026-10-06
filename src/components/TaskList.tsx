import { useState, type ReactNode } from 'react'
import type { List, Task } from '../lib/types'
import type { Section } from '../lib/views'
import { Icon } from './Icon'
import { TaskItem } from './TaskItem'

export function TaskList({ sections, listsById, showList, today, onToggle, onOpen, onDelete }: {
  sections: Section[]
  listsById: Map<string, List>
  showList: boolean
  today: string
  onToggle: (task: Task) => void
  onOpen: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <TaskSection key={section.title ?? i} section={section}>
          <ul className="space-y-0.5">
            {section.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                list={showList && task.list_id ? listsById.get(task.list_id) : undefined}
                today={today}
                onToggle={onToggle}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </TaskSection>
      ))}
    </div>
  )
}

function TaskSection({ section, children }: { section: Section; children: ReactNode }) {
  const [open, setOpen] = useState(!section.collapsible)
  const titleClass = `text-xs font-semibold tracking-wide uppercase ${
    section.tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
  }`

  return (
    <section>
      {section.title &&
        (section.collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`mb-1 flex items-center gap-1 px-2 ${titleClass}`}
          >
            <Icon name="chevron" className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
            {section.title}
          </button>
        ) : (
          <h2 className={`mb-1 px-2 ${titleClass}`}>{section.title}</h2>
        ))}
      {open && children}
    </section>
  )
}
