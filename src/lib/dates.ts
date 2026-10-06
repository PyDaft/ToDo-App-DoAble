import { addDays, differenceInCalendarDays, format, isSameYear, parseISO } from 'date-fns'

/** Today's local date as 'YYYY-MM-DD', the same shape as tasks.due_date. */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function tomorrowStr(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd')
}

/** Human label for a due date: Today, Tomorrow, Yesterday, "Mon, Oct 6" or "Oct 6, 2027". */
export function formatDue(due: string): string {
  const date = parseISO(due) // date-only strings parse as local midnight
  const diff = differenceInCalendarDays(date, new Date())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return isSameYear(date, new Date()) ? format(date, 'EEE, MMM d') : format(date, 'MMM d, yyyy')
}

/** Heading for a day group in the Upcoming view, e.g. "Tomorrow · Sun, Oct 5". */
export function formatDayHeading(due: string): string {
  const label = formatDue(due)
  const full = format(parseISO(due), 'EEE, MMM d')
  return label === full ? full : `${label} · ${full}`
}
