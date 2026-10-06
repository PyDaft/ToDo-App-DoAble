# Todo

A personal to-do app: React + Vite + Tailwind on the front end, Supabase for login and the database.
See [PLAN.md](PLAN.md) for the full plan.

## Run it locally

1. **Supabase project**: create one at supabase.com.
2. **Database**: open the Supabase **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. **Redirect URLs**: open **Authentication → URL Configuration**. Set **Site URL** to `http://localhost:5173` and add `http://localhost:5173/**` under **Redirect URLs**.
4. **Keys**: copy `.env.example` to `.env.local` and paste in your Project URL and anon (or publishable) key from **Project Settings → API**.
5. **Start**: `npm install`, then `npm run dev`, then open http://localhost:5173.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app at http://localhost:5173. It reloads as you edit. |
| `npm run build` | Type-checks and builds the app into `dist/`. |
| `npm run lint` | Runs oxlint. |

## Where things live

- `src/pages/`: Login, Signup, ForgotPassword, ResetPassword and Home (the main app)
- `src/components/`: Sidebar, TaskList, TaskItem, TaskEditor, QuickAdd, ListManager and Modal
- `src/hooks/useTasks.ts`, `useLists.ts`: load data and save changes. The screen updates right away, and changes are rolled back if saving fails.
- `src/lib/views.ts`: which tasks appear in Today, Upcoming, All, Completed and each list
- `supabase/schema.sql`: the tables, security rules (RLS) and signup trigger

## Keyboard shortcuts

- `N`: add a new task
- `/`: search
- `Esc`: close a dialog or clear the search
- `Ctrl+Enter`: save in the task editor
