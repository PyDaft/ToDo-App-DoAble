# Plan: Personal To-Do Web App (React + Supabase, hosted on Vercel)

> **Status (Oct 13, 2026):** v1 (this plan) and v2 ([PLAN_V2.md](PLAN_V2.md)) are built, and the app is live on Vercel (Phase 8 below).
> **v3** renamed the app **DoAble**, with the tagline "Make today doable." It also added All/Active/Completed tabs, a date picker in the add box, the "Coming up" popup, progress and overdue nudges, Undo, a phone layout and light mode by default. v3 needed no database changes. See "What's new" in the [README](README.md).
> **Still open:** Phase 9 (installable app), and recurring tasks.

## Context
You want a to-do app that you open in your browser every day, with signup, login and the usual basics. The decisions so far:
- **Hosted online**, so it works on your laptop and your phone through a real URL.
- **Supabase handles login and the database**, so we don't write password or session code ourselves. You chose it over Neon + Better Auth, Neon + Clerk and Firebase because it's one service, needs no backend code, is plain Postgres underneath, and is free for personal use. One catch: the free tier pauses a project after about a week with no activity. Using the app daily keeps it running.
- **v1 features** (my default, since that question was skipped): due dates, a Today view, priorities and lists. Recurring tasks come later.
- **You review before anything goes live.** I build it and run it locally, then stop so you can see it. I deploy only after you say so.

**What I found on your machine:** the working folder is empty. Node.js v22.18.0 and npm 10.9.3 are installed. **Git is not installed**, and we need it to deploy through GitHub.

**Project location:** `C:\Users\abhin\dev\todo-app`, outside OneDrive. The project downloads tens of thousands of small library files into a `node_modules` folder, and OneDrive would try to sync all of them. That slows things down and can lock files. The code is still backed up on GitHub. If you'd rather keep it inside OneDrive, tell me when you review this plan.

## Tech stack
- **Frontend:** Vite + React + TypeScript, Tailwind CSS for styling, React Router for page navigation
- **Login and data:** Supabase (`@supabase/supabase-js`), free tier
- **Hosting:** Vercel (free tier), which updates the site automatically each time code is pushed to GitHub
- **Installable app:** `vite-plugin-pwa`, so you can install it on your laptop and phone
- **Dates:** `date-fns`

## Features in v1
**Accounts**
- Sign up with email and password, with email verification
- Log in and log out
- Forgot password → reset email → set a new password
- Stays logged in between visits
- Pages that need login send you to the login page if you're logged out

**Tasks**
- Add, edit, complete, un-complete and delete
- Title, notes, due date, priority (high, medium or low) and list
- Lists: create, rename, delete and pick a color

**Views**
- **Today:** due today, plus overdue tasks shown in red
- **Upcoming**, **All**, **Completed**, and one view per list
- Search, and press `n` to add a new task quickly

**Polish**
- Works on phone screens, with dark mode
- Loading, empty and error states, with instant updates on screen when you change a task

## Database (Supabase SQL, saved in the repo as `supabase/schema.sql`)
```
profiles (id uuid PK → auth.users, display_name, created_at)
lists    (id, user_id → auth.users, name, color, created_at)
tasks    (id, user_id → auth.users, list_id → lists ON DELETE SET NULL,
          title NOT NULL, notes, due_date date, priority smallint (1–3),
          is_done bool, completed_at, created_at, updated_at)
```
- **Row Level Security** is on for every table. It's a database rule that limits each user to rows where `user_id = auth.uid()`, which means rows they own. This is the main security protection.
- When someone signs up, the database creates their `profiles` row and a default "Personal" list.
- Indexes on `(user_id, is_done, due_date)` keep the views fast.

## Project structure (key files)
```
todo-app/
  PLAN.md                    # copy of this plan
  .env.local                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (git-ignored)
  supabase/schema.sql        # tables, RLS policies, trigger
  src/lib/supabase.ts        # Supabase client
  src/auth/AuthProvider.tsx  # session context, onAuthStateChange
  src/auth/ProtectedRoute.tsx
  src/pages/  Login, Signup, ForgotPassword, ResetPassword, Home (main app)
  src/components/  Sidebar, TaskList, TaskItem, TaskEditor, QuickAdd, ListManager
  src/hooks/  useTasks.ts, useLists.ts   # data fetch + mutations
  vite.config.ts             # PWA plugin config
  vercel.json                # SPA rewrite so page links don't break on refresh
```

---

## Phase-by-phase implementation
Each phase ends with a check you can see. I'll explain briefly what each phase does as we go.

### Phase 1: Prerequisites and accounts (mostly you, about 30 min)
**Goal:** get every tool and account ready.

**You do:**
1. Install Git: `winget install Git.Git`, then restart the terminal.
2. Create a free **Supabase** account. You don't need GitHub or Vercel for this build.
3. In Supabase, click **New project**. Name it `todo-app`, choose the region closest to you, and save the database password somewhere safe.
4. Open **Project Settings → API** and copy the **Project URL** and the **anon public key**.

**I do:** check that `git --version` works, then set your Git name and email.

**Done when:** Git works, and you have the Supabase URL and key ready to paste in.

### Phase 2: Create the project (me, about 20 min)
**Goal:** a blank app that runs in your browser.
1. Create `C:\Users\abhin\dev\todo-app` with `npm create vite@latest` (React + TypeScript template).
2. Install `@supabase/supabase-js`, `react-router-dom`, `date-fns`, `tailwindcss` and `@tailwindcss/vite`.
3. Set up Tailwind, the folder layout above, and `src/lib/supabase.ts`, which reads the keys from `.env.local`.
4. Create `.env.local` using the keys you paste in, and make sure Git ignores it so the keys never get uploaded.
5. Save a copy of this plan as `PLAN.md`, run `git init`, and make the first commit.

**Done when:** `npm run dev` shows a placeholder page at `localhost:5173`.

### Phase 3: Database (me writes it, you run it once, about 20 min)
**Goal:** tables that keep each user's data private.
1. Write `supabase/schema.sql` with:
   - the `profiles`, `lists` and `tasks` tables
   - indexes
   - security rules (RLS) on every table, covering read, add, change and delete
   - a trigger that runs on signup and creates the user's profile and a "Personal" list
   - a trigger that keeps `updated_at` current
2. **You:** paste the file into Supabase's **SQL Editor** and click Run. (Alternatively, I install the Supabase CLI and run it myself, but that needs one more login step.)
3. In **Authentication → URL Configuration**, add `http://localhost:5173` as an allowed redirect URL so verification and reset emails link back to your local app.

**Done when:** the Supabase **Table Editor** shows the three tables, each with RLS turned on.

### Phase 4: Login and signup (me, about 1–2 hrs)
**Goal:** accounts work from start to finish.
1. `AuthProvider.tsx`: loads the current login session on start, listens for login and logout events, and shares `user` with the rest of the app.
2. `ProtectedRoute.tsx`: sends logged-out visitors to `/login`.
3. Pages:
   - **Signup:** email, password, confirm password, then "check your email"
   - **Login:** with error messages
   - **Forgot password:** sends the reset email
   - **Reset password:** set a new one
4. A logout button in the app header.

**Done when:**
- You can sign up and the verification email arrives.
- After verifying, you can log in, refresh and stay logged in, and log out.
- The password reset flow works.
- Going to `/` while logged out sends you to `/login`.

### Phase 5: Core tasks and lists (me, about 2–3 hrs)
**Goal:** the actual to-do list.
1. `useLists.ts` and `useTasks.ts` load your data and handle add, edit and delete. The screen updates instantly and undoes the change if saving fails.
2. **QuickAdd:** type a title and press Enter.
3. **TaskItem:** a checkbox to complete or un-complete, the title, a priority dot, the due date, and a delete button.
4. **TaskEditor:** a panel or pop-up to edit the title, notes, due date, priority and list.
5. **Sidebar and ListManager:** create, rename, recolor and delete lists. Deleting a list keeps its tasks; they just lose the list.

**Done when:** you can add tasks to lists, edit them, check them off and delete them, and everything is still there after a refresh.

### Phase 6: Views and polish (me, about 1–2 hrs)
**Goal:** something you'd enjoy opening every day.
1. Views in the sidebar:
   - **Today:** due today, plus overdue in red
   - **Upcoming:** future dates, grouped by day
   - **All:** everything not done, sorted by priority then date
   - **Completed**
   - one view per list
2. A search box, the `n` shortcut to add a task, and `Esc` to close the editor.
3. Dark mode that follows your system setting, plus a toggle.
4. Phone layout: the sidebar becomes a slide-out menu.
5. Loading, empty ("Nothing due today 🎉") and error states.

**Done when:** every view shows the right tasks, and the app works well at phone width.

### Phase 7: Run it locally, then STOP (me, then you). This is the end of this plan.
**Goal:** you see and try the app before anything goes online.
1. Run `npm run build` and `npm run lint` and fix any errors.
2. Start `npm run dev` in the background, then go through the full verification list below in the browser.
3. Give you the link `http://localhost:5173` and **stop**.
4. You try it. I make any changes you ask for and check them locally.

**This build does not deploy anything.** There's no GitHub push and no Vercel. The work ends with the app running locally. Phases 8–9 below are for reference only, and I'll do them only if you ask later.

### Phase 8: Deploy ✅ Done (Oct 13, 2026)
**Goal:** a real URL you can use from anywhere.

**How it was actually done** (the Vercel CLI instead of importing from GitHub):
1. The code is in a private GitHub repo, `PyDaft/todo-app`. Work happens on `dev` and is merged into `master`.
2. `npx vercel link` created the Vercel project `todo-app` from this folder.
3. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` were added as Production env vars with `vercel env add`. The anon key is a "config" (public) value, because Vite ships it in the browser bundle.
4. `npx vercel deploy --prod` published the site to **https://todo-app-plum-one-47.vercel.app**.
5. In Supabase, **Site URL** is the Vercel URL, and **Redirect URLs** has both the Vercel URL and `http://localhost:5173/**`.
6. `vercel.json` rewrites every path to `index.html`, so deep links like `/today` work when you refresh the page.

The Vercel project is **not** connected to GitHub, so each release is deployed with `npx vercel deploy --prod`. See the README.

**Done when:** you can sign up and use the app at the Vercel URL. ✅

### Phase 9 (NOT in this build, only if you ask later): Make it a daily app
**Goal:** one click to open it on your laptop and phone.
1. Add `vite-plugin-pwa` with an app name, icons and a theme color, then redeploy.
2. On your laptop, open the site in Chrome or Edge, click the install icon in the address bar, and pin the app to your taskbar.
3. On your phone, open the site, choose **Share/menu → Add to Home Screen**, and log in.

**Done when:** the app opens in its own window on your laptop and phone and shows the same tasks on both.

**Later (not in v1):** recurring tasks, reminders, drag-to-reorder, sub-tasks, Google sign-in, shared lists.

---

## Verification (run locally in Phase 7; the "Production" item only applies if you deploy later)
- **Login flow:** sign up → verify the email → log in → refresh and stay logged in → log out → forgot password → reset it → log in with the new password.
- **Security check:** with two accounts A and B, confirm B can't see A's tasks in the app or by querying the database directly with B's login.
- **Tasks:** add, edit, complete and delete. Check that each view shows the right tasks for a given date, and that deleting a list keeps its tasks with no list.
- **Build:** `npm run build` and `npm run lint` finish with no errors.
- **Production:** on the live URL, repeat the login flow, refresh a deep link, install the app on your phone, and confirm your tasks match across devices.
