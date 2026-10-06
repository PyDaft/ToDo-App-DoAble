export function FullPageSpinner() {
  return (
    <div className="flex h-dvh items-center justify-center" role="status" aria-label="Loading">
      <div className="size-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
    </div>
  )
}
