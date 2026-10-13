import { useCallback, useRef, useState } from 'react'

export interface ToastData {
  message: string
  action?: { label: string; run: () => void }
}

export type ShownToast = ToastData & { id: number }

/** One toast at a time; a new one replaces the old. */
export function useToast() {
  const [toast, setToast] = useState<ShownToast | null>(null)
  const nextId = useRef(0)
  const show = useCallback((data: ToastData) => setToast({ ...data, id: ++nextId.current }), [])
  const dismiss = useCallback(() => setToast(null), [])
  return { toast, show, dismiss }
}
