# Todo

A personal to-do app: React + Vite + Tailwind on the front end, Supabase for login and the database.
See [PLAN.md](PLAN.md) for the full plan.

## Run it locally

1. **Supabase project**: create one at supabase.com.
2. **Database**: open the Supabase **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   - **Upgrading from v1?** Run [`supabase/migrations/002_v2.sql`](supabase/migrations/002_v2.sql) once instead. It adds tags, archiving and the Work category.
3. **Redirect URLs**: open **Authentication → URL Configuration**. Set **Site URL** to `http://localhost:5173` and add `http://localhost:5173/**` under **Redirect URLs**.
4. **Keys**: copy `.env.example` to `.env.local` and paste in your Project URL and anon (or publishable) key from **Project Settings → API**.
5. **Start**: `npm install`, then `npm run dev`, then open http://localhost:5173.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app at http://localhost:5173. It reloads as you edit. |
| `npm run build` | Type-checks and builds the app into `dist/`. |
| `npm run lint` | Runs oxlint. |

## Features

- **Screens**: Today, Upcoming, All tasks and Completed (grouped by the day each task was done).
- **Categories** (Work, Personal, …): each task can have one. Categories can be archived from the sidebar's pencil icon.
- **Tags**: a task can have several. Type `#tag` in the add box or use the task editor. Each tag has its own screen.
- **History**: the sidebar lists This week, Last week and earlier weeks, each with its days. A day shows what was completed and what was missed.
- **Completed today**: checked-off tasks stay on the same screen, in a "Completed today" section.

## Where things live

- `src/pages/Home.tsx`: the main app. It reads the URL to pick the screen: `/today`, `/category/:id`, `/tag/:name`, `/day/:date` or `/week/:monday`.
- `src/pages/`: Login, Signup, ForgotPassword and ResetPassword
- `src/components/`: Sidebar, TaskList, TaskItem, TaskEditor, TagInput, QuickAdd, ListManager (categories) and Modal
- `src/hooks/useTasks.ts`, `useLists.ts`: load data and save changes. The screen updates right away, and changes are rolled back if saving fails.
- `src/lib/views.ts`: which tasks appear on each screen, plus the history and tag summaries
- `supabase/schema.sql`: the tables, security rules (RLS) and signup trigger. `supabase/migrations/` holds the upgrades.

## Keyboard shortcuts

- `N`: add a new task
- `/`: search
- `Esc`: close a dialog or clear the search
- `Ctrl+Enter`: save in the task editor
