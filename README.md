# DoAble

**Make today doable.**

A personal to-do app for the web and your phone: React + Vite + Tailwind on the front end, Supabase for login and the database, hosted on Vercel.

Live: https://todo-app-plum-one-47.vercel.app

## The name

**DoAble** = **Do** + **Able**, read together as *doable*: something you can actually get done.

That's the idea behind the app. A to-do list shouldn't be a wall of guilt. It should make today feel achievable: a short list for today, a clear view of what's coming, and a nudge when something slips. The capital **A** is the reminder that you're *able*. The logo shows the same thing: a check mark breaking out of a "D".

## What's new (v3)

**New name and look**
- Renamed from "Todo" to **DoAble**, with a new logo (a check breaking out of a "D" on an indigo-to-violet tile) on the login pages, in the sidebar, in the phone header and as the browser icon.
- **Light mode by default.** The sun/moon button switches to dark mode, and each device remembers the choice.
- **Dark mode is greyish black** (neutral greys) instead of dark blue.

**Managing tasks**
- **All | Active | Completed tabs** at the top of every screen, with counts. The choice is kept in the URL (`?status=active`), so Back works.
- **Pick a date when you add a task:** Today, Tomorrow, Next week, No date or any date. Each screen sets a sensible default (Today → today, Upcoming → tomorrow). If the date sends the task to another screen, a message says where it went and offers **View**.
- **Coming up popup:** the bell in the header shows a badge for tasks that are overdue, due today or due tomorrow. It opens a panel of the next 7 days where you can tick tasks off. It also opens by itself once a day when something needs attention.

**Nudges that help you follow through**
- **Today's progress:** a greeting plus a "2 of 5 done" bar with a short encouraging line. Seeing the finish line makes it easier to reach.
- **Overdue banner:** one click on **Move all to today** reschedules everything that slipped, so nothing quietly piles up.
- **Feedback when you finish:** completing a task shows "Nice! 2 left for today", or "All done for today! 🎉".
- **Undo everywhere:** completing, deleting and rescheduling all show an **Undo** for 8 seconds. Deleting is no longer instant and permanent.

**Desktop and phone**
- **Phone:** a bottom tab bar (Today, Upcoming, All, More), a floating **+** button within thumb reach, bigger tap targets, and the add box's date and category controls on their own row.
- **Desktop:** a sidebar, the tabs next to the page title, and keyboard shortcuts.
- **Works with pushy browser extensions.** Some extensions inject their own `.hidden` / `.flex` CSS into every page, which used to hide the sidebar on desktop. Tailwind's utilities are now unlayered, and screen-size switching uses `max-md:hidden` instead of `hidden md:block`, so the app's own styles win (see the comment at the top of `src/index.css`).

## Features

- **Screens:** Today, Upcoming, All tasks and Completed (grouped by the day each task was done)
- **Categories** (Work, Personal, …): each task can have one. Archive a category from the sidebar's pencil icon.
- **Tags:** a task can have several. Type `#tag` in the add box or use the task editor. Each tag has its own screen.
- **History:** the sidebar lists This week, Last week and earlier weeks, each with its days. A day shows what was completed and what was missed.
- **Completed today:** checked-off tasks stay on the same screen, in a "Completed today" section.
- **Accounts:** sign up, email verification, log in, forgot password. Each person only ever sees their own tasks, because database security rules (Row Level Security) enforce it.

## Keyboard shortcuts

- `N`: add a new task
- `/`: search
- `Esc`: close a dialog, menu or popup, or clear the search
- `Enter` in the add box's date field: confirm the date
- `Ctrl+Enter`: save in the task editor

## Run it locally

1. **Supabase project:** create one at supabase.com.
2. **Database:** open the Supabase **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   - **Upgrading from v1?** Run [`supabase/migrations/002_v2.sql`](supabase/migrations/002_v2.sql) once instead. It adds tags, archiving and the Work category. v3 needs no database changes.
3. **Redirect URLs:** open **Authentication → URL Configuration** and add `http://localhost:5173/**` under **Redirect URLs** so verification and reset emails can link back to your local app.
4. **Keys:** copy `.env.example` to `.env.local` and paste in your Project URL and anon (or publishable) key from **Project Settings → API**.
5. **Start:** run `npm install`, then `npm run dev`, then open http://localhost:5173.

## Deploy

The Vercel project is connected to this GitHub repo, so pushing is all it takes:

| Push to… | What Vercel does |
|---|---|
| `master` | Builds it and updates the **live site** (production) |
| `dev` or any other branch | Builds a separate **preview** link without touching the live site. Preview links are private; you need to be logged in to Vercel to open them. |

**Day to day:** work on `dev`, check its preview, then merge `dev` into `master` to go live.

**Setting it up from scratch** (already done for this project):
1. In Vercel, open **Project → Settings → Git → Connect Git Repository**. Install the Vercel GitHub App for this repo only, and keep `master` as the production branch.
2. Add the build-time keys for **Production** and **Preview**:
   `vercel env add VITE_SUPABASE_URL <production|preview>` and `vercel env add VITE_SUPABASE_ANON_KEY <production|preview> --type config`.
   The anon key is public by design because it ships in the browser bundle. The database's security rules (RLS) are what protect the data.
3. In Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to the Vercel URL and add `https://<vercel-url>/**` to **Redirect URLs**.

A manual deploy from your machine still works if you need one: run `npx vercel login`, then `npx vercel link`, then `npx vercel deploy --prod`.

`vercel.json` sends every path to `index.html`, so links like `/today` or `/tag/work` work when you refresh the page.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app at http://localhost:5173. It reloads as you edit. |
| `npm run build` | Type-checks and builds the app into `dist/`. |
| `npm run lint` | Runs oxlint. |

## Where things live

- `src/pages/Home.tsx`: the main app. It reads the URL to pick the screen (`/today`, `/category/:id`, `/tag/:name`, `/day/:date` or `/week/:monday`) and the status tab (`?status=`). It also handles Undo, toasts and the overdue banner.
- `src/pages/`: Login, Signup, ForgotPassword and ResetPassword
- `src/components/`
  - **Layout:** Sidebar, MobileNav (phone tab bar and + button), Logo
  - **Tasks:** TaskList, TaskItem, TaskEditor, QuickAdd (with the date picker), TagInput
  - **New in v3:** StatusTabs, UpcomingWidget (Coming up), DayProgress, Toast
  - **Dialogs:** ListManager (categories), Modal
- `src/hooks/`
  - `useTasks.ts`, `useLists.ts`: load data and save changes. The screen updates right away, and a change is rolled back if saving fails.
  - `useToast.ts`, `useDismiss.ts` (close popups on Esc or an outside click), `useTheme.ts`
- `src/lib/views.ts`: which tasks appear on each screen, the status filter, the Coming up groups, today's progress, and the history and tag summaries
- `src/index.css`: Tailwind setup, the animations, and the greyish-black dark palette
- `supabase/schema.sql`: the tables, security rules (RLS) and signup trigger. `supabase/migrations/` holds the upgrades.
- Plans: [PLAN.md](PLAN.md) (v1) and [PLAN_V2.md](PLAN_V2.md) (v2)
