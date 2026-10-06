import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { List } from '../lib/types'

/** Same pattern as useTasks: load once, update the screen first, roll back on error. */
export function useLists(userId: string) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const listsRef = useRef(lists)
  useEffect(() => {
    listsRef.current = lists
  }, [lists])

  useEffect(() => {
    let active = true
    supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(`Couldn’t load lists: ${error.message}`)
        else setLists(data as List[])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  /** Waits for the server so the caller gets the real id (e.g. to open the new list). */
  const addList = useCallback(async (name: string, color: string): Promise<List | null> => {
    const { data, error } = await supabase.from('lists').insert({ name, color }).select().single()
    if (error) {
      setError(`Couldn’t create list: ${error.message}`)
      return null
    }
    setLists((prev) => [...prev, data as List])
    return data as List
  }, [])

  const updateList = useCallback(async (id: string, patch: Pick<List, 'name' | 'color'>) => {
    const before = listsRef.current.find((l) => l.id === id)
    if (!before) return
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))

    const { error } = await supabase.from('lists').update(patch).eq('id', id)
    if (error) {
      setLists((prev) => prev.map((l) => (l.id === id ? before : l)))
      setError(`Couldn’t save list: ${error.message}`)
    }
  }, [])

  /** Resolves true if the list is gone, so the caller can also detach its tasks. */
  const deleteList = useCallback(async (id: string): Promise<boolean> => {
    const before = listsRef.current.find((l) => l.id === id)
    if (!before) return false
    setLists((prev) => prev.filter((l) => l.id !== id))

    const { error } = await supabase.from('lists').delete().eq('id', id)
    if (error) {
      setLists((prev) => [...prev, before].sort((a, b) => a.created_at.localeCompare(b.created_at)))
      setError(`Couldn’t delete list: ${error.message}`)
      return false
    }
    return true
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { lists, loading, error, clearError, addList, updateList, deleteList }
}
