import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_PRIORITY, type NewTask, type Task, type TaskPatch } from '../lib/types'

const TEMP_PREFIX = 'temp-'

/** True while a newly added task is still being saved (it has no real id yet). */
export const isPendingTask = (t: Task) => t.id.startsWith(TEMP_PREFIX)

/**
 * Loads all of the user's tasks once, then applies every change to the screen
 * immediately and rolls it back if Supabase rejects it.
 * RLS in schema.sql guarantees the query only ever returns this user's rows.
 */
export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Latest tasks for rollbacks, without re-creating callbacks on every change.
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    let active = true
    supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(`Couldn’t load tasks: ${error.message}`)
        else setTasks(data as Task[])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  const addTask = useCallback(
    async (input: NewTask) => {
      const now = new Date().toISOString()
      const fields = {
        title: input.title,
        notes: input.notes ?? null,
        due_date: input.due_date ?? null,
        priority: input.priority ?? DEFAULT_PRIORITY,
        list_id: input.list_id ?? null,
        tags: input.tags ?? [],
      }
      const tempId = TEMP_PREFIX + crypto.randomUUID()
      const optimistic: Task = {
        ...fields,
        id: tempId,
        user_id: userId,
        is_done: false,
        completed_at: null,
        created_at: now,
        updated_at: now,
      }
      setTasks((prev) => [...prev, optimistic])

      const { data, error } = await supabase.from('tasks').insert(fields).select().single()
      if (error) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId))
        setError(`Couldn’t add task: ${error.message}`)
        return
      }
      setTasks((prev) => prev.map((t) => (t.id === tempId ? (data as Task) : t)))
    },
    [userId],
  )

  const updateTask = useCallback(async (id: string, patch: TaskPatch) => {
    const before = tasksRef.current.find((t) => t.id === id)
    if (!before) return
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? before : t)))
      setError(`Couldn’t save change: ${error.message}`)
    }
  }, [])

  const toggleDone = useCallback(
    (task: Task) =>
      updateTask(task.id, {
        is_done: !task.is_done,
        completed_at: task.is_done ? null : new Date().toISOString(),
      }),
    [updateTask],
  )

  const deleteTask = useCallback(async (id: string) => {
    const before = tasksRef.current.find((t) => t.id === id)
    if (!before) return
    setTasks((prev) => prev.filter((t) => t.id !== id))

    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      setTasks((prev) => [...prev, before])
      setError(`Couldn’t delete task: ${error.message}`)
    }
  }, [])

  /** Mirror the database's ON DELETE SET NULL after a list is removed. */
  const detachList = useCallback((listId: string) => {
    setTasks((prev) => prev.map((t) => (t.list_id === listId ? { ...t, list_id: null } : t)))
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { tasks, loading, error, clearError, addTask, updateTask, toggleDone, deleteTask, detachList }
}
