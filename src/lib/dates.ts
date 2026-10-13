import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns'

/** Today's local date as 'YYYY-MM-DD', the same shape as tasks.due_date. */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function tomorrowStr(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd')
}

/** The local calendar day of a timestamp, e.g. completed_at → '2026-10-06'. */
export function localDay(timestamp: string): string {
  return format(parseISO(timestamp), 'yyyy-MM-dd')
}

export function addDaysStr(day: string, n: number): string {
  return format(addDays(parseISO(day), n), 'yyyy-MM-dd')
}

export function isValidDay(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))
}

/** Monday of the week containing `day`. */
export function weekStartOf(day: string): string {
  return format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** "Sep 22 – 28", "Sep 29 – Oct 5", or with the year when it isn't this year. */
export function formatWeekRange(start: string): string {
  const s = parseISO(start)
  const e = addDays(s, 6)
  const year = isSameYear(e, new Date()) ? '' : `, ${format(e, 'yyyy')}`
  if (isSameMonth(s, e)) return `${format(s, 'MMM d')} – ${format(e, 'd')}${year}`
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}${year}`
}

/** "This week", "Last week", or the date range. */
export function weekLabel(start: string, today: string): string {
  const thisWeek = weekStartOf(today)
  if (start === thisWeek) return 'This week'
  if (start === addDaysStr(thisWeek, -7)) return 'Last week'
  return formatWeekRange(start)
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

/** Heading for a day group, e.g. "Tomorrow · Sun, Oct 5". */
export function formatDayHeading(day: string): string {
  const label = formatDue(day)
  const full = format(parseISO(day), 'EEE, MMM d')
  return label === full ? full : `${label} · ${full}`
}

/** Short day label for the sidebar, e.g. "Mon, Oct 6". */
export function formatShortDay(day: string): string {
  return format(parseISO(day), 'EEE, MMM d')
}

/** Next Monday (always in the future, even when today is Monday). */
export function nextWeekStr(): string {
  const today = todayStr()
  return addDaysStr(weekStartOf(today), 7)
}

/** "Good morning" / "Good afternoon" / "Good evening" for the current local time. */
export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** "3:42 PM" */
export function formatTime(timestamp: string): string {
  return format(parseISO(timestamp), 'h:mm a')
}
