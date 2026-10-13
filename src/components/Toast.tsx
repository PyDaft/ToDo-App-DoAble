import { useEffect } from 'react'
import type { ShownToast } from '../hooks/useToast'
import { Icon } from './Icon'

const TOAST_MS = 8000

/** Bottom toast with an optional action (e.g. Undo). Sits above the phone tab bar. */
export function Toast({ toast, onDismiss }: { toast: ShownToast | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6"
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="animate-toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 py-2.5 pr-2 pl-4 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.run()
                onDismiss()
              }}
              className="rounded-md px-2.5 py-1 font-semibold text-indigo-300 hover:bg-white/10 dark:text-indigo-600 dark:hover:bg-slate-900/10"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 dark:hover:bg-slate-900/10"
          >
            <Icon name="x" className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
