# Plan: Todo App v2 (history, categories + tags, completed tasks stay visible)

## Context
v1 works locally at `C:\Users\abhin\dev\todo-app` (commit `c7e3f3a`). For v2 you asked for three things:

1. **A left bar to browse past to-dos.** You chose **both** options: a week-by-week, day-by-day history ("This week", "Last week", and so on), and the ability to **archive** old categories.
2. **A category on each to-do** (Work, Personal, …), plus optional **tags**.
3. **Checked-off tasks stay where they are.** Instead of disappearing, they move into a **"Completed today"** section at the bottom of the same screen. This applies on every screen.

As before, I'll build it, run it locally, then stop. Nothing gets deployed.

## Key decisions
- **"Lists" become "Categories" on screen.** The database table keeps its name `lists`, so existing data needs no move. New accounts start with **Personal** and **Work**. Existing accounts get **Work** added if they don't already have it.
- **Tags** are free text, stored on each task (`tasks.tags text[]`). A task can have several. You add them in the task editor, or type `#tag` in the quick-add box.
- **What counts as a day in History:** any task that was **due** that day or **completed** that day, based on your local time zone.
- **Weeks start on Monday.**
- **Archiving a category** hides it from the main category list and from the category picker, and moves it into a folded **Archive** section at the bottom of the sidebar. Nothing is deleted, its tasks stay visible in Today and All, and you can unarchive it anytime.

## Left bar (new layout)
```
Today            3
Upcoming         5
All tasks       12
Completed
──────────────────
CATEGORIES     +
  ● Personal     4
  ● Work         8
──────────────────
TAGS
  # urgent       2
  # email        1
──────────────────
HISTORY
  This week  ▾
     Mon, Oct 6   ✓4 · 1 missed
     Tue, Oct 7   ✓2
  Last week  ▸
  Sep 22 – 28 ▸
  Show older…
──────────────────
ARCHIVE ▸
```
- Each section can be folded, and the app remembers which ones you folded on this browser.
- **Clicking a week** shows that week grouped by day. **Clicking a day** shows that day's tasks, with completed ones at the bottom.
- History only lists weeks and days that have some activity, and shows the last 8 weeks before "Show older…".

## "Completed today" on every screen
- In Today, All, each category, each tag and Upcoming: open tasks stay on top, and a **"Completed today (n)"** section underneath stays expanded.
- Unchecking a task moves it back up.
- Category screens also keep an **"Earlier completed (n)"** section below that, folded by default.
- The **Completed** screen still shows your full completed history, grouped by the day each task was done.

## Database change: `supabase/migrations/002_v2.sql`
You'll paste this into the Supabase SQL Editor once. It's safe to re-run. It will:
- add `alter table tasks add column tags text[] not null default '{}'`, plus a GIN index on `tags`
- add `alter table lists add column archived_at timestamptz`
- add an index on `tasks (user_id, completed_at)` for history
- update the signup trigger so new users get **Personal** and **Work**
- add **Work** for existing users who don't have it

I'll also update `supabase/schema.sql` so a fresh install includes all of this. The existing security rules (RLS) already cover the new columns, so no new policies are needed.

## Code changes (all in `C:\Users\abhin\dev\todo-app`)
| File | Change |
|---|---|
| `src/lib/types.ts` | Add `tags: string[]` to Task and `archived_at` to List; add tags to `NewTask`/`TaskPatch` |
| `src/lib/dates.ts` | Add `localDay(timestamp)` (date part of `completed_at` in your time zone), `weekStart` (Monday), `formatWeekRange`, and labels for "This week" / "Last week" |
| `src/lib/views.ts` | Add a shared `withCompletedToday()` helper used by every view; add `sectionsForDay`, `sectionsForWeek` and `sectionsForTag`; add `buildHistory(tasks)` (weeks → days, with done/missed counts) and `collectTags(tasks)`; make search match tags too |
| `src/hooks/useLists.ts` | Add `archiveList`/`unarchiveList`, using the same instant-update pattern as `updateList` |
| `src/hooks/useTasks.ts` | Send `tags` when adding a task (otherwise it already passes patches through as they are) |
| `src/components/Sidebar.tsx` | Rework into foldable sections: Views, Categories, Tags, History, Archive |
| `src/components/QuickAdd.tsx` | Add a **category picker** next to the input; turn `#tag` words into tags |
| `src/components/TagInput.tsx` (new) | Tag chips: type and press Enter to add, × to remove, with suggestions from tags you've used before |
| `src/components/TaskEditor.tsx` | Add the tag input; rename "List" to "Category"; hide archived categories from the picker |
| `src/components/TaskItem.tsx` | Show tag chips and a category chip; mark tasks completed today with a ✓ time |
| `src/components/ListManager.tsx` | Rename to "Category"; add an **Archive / Unarchive** button |
| `src/pages/Home.tsx` | New screens: `/category/:id`, `/tag/:name`, `/day/:yyyy-mm-dd`, `/week/:yyyy-mm-dd`; titles and empty states for each. Old `/list/:id` links redirect to the new address |
| `README.md`, `PLAN.md` | Document v2 and the migration step |

The current single route `/:view/:param?` already covers these new screens, so switching between them won't reload your data.

## Steps
1. **Migration (me):** write `002_v2.sql` and update `schema.sql`. **You:** run it in the Supabase SQL Editor, which takes about 1 minute. The app needs the new columns before the new version can load tasks.
2. **Types and logic (me):** update `types.ts`, `dates.ts` and `views.ts` (history, tags, "Completed today").
3. **Components (me):** TagInput, QuickAdd, TaskItem, TaskEditor, ListManager and Sidebar.
4. **Screens (me):** `Home.tsx` routing for category, tag, day and week.
5. **Check (me):** `npm run build` and `npm run lint` with no errors; the dev server running at http://localhost:5173.
6. **Commit (me):** a commit titled "v2: history, categories, tags, completed-today".
7. **STOP:** I give you the link to try it. No deploy.

## Verification
- **Build and lint:** `npm run build` and `npm run lint` pass.
- **Database:** after you run the migration, an anonymous request for `tasks?select=tags` returns `[]`, not a missing-column error.
- **Your checks in the browser:**
  - Check off a task in Today: it moves to "Completed today" on the same screen. Uncheck it: it moves back up.
  - Add `Call bank #urgent` with the Work category: the task shows the Work chip and an `#urgent` tag, and **Tags → urgent** lists it.
  - History → This week → today shows today's completed tasks. Last week shows past days, including tasks that were due and missed.
  - Archive a category: it moves to Archive, disappears from the category picker, and its tasks still show in All. Unarchive brings it back.
  - Refresh the page: everything is still there, including which sidebar sections you folded.
