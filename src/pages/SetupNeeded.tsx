import { AuthLayout } from '../components/AuthLayout'

/** Shown instead of the app until .env.local has the Supabase keys. */
export function SetupNeeded() {
  return (
    <AuthLayout title="Almost there — connect Supabase">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
        <li>In Supabase, open <strong>Project Settings → API</strong>.</li>
        <li>
          Copy <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.example</code> to{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.local</code> and paste in the
          Project URL and anon/publishable key.
        </li>
        <li>Restart <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run dev</code>.</li>
      </ol>
    </AuthLayout>
  )
}
