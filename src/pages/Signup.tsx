import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout, linkClass } from '../components/AuthLayout'
import { Alert, Button, Field } from '../components/ui'
import { supabase } from '../lib/supabase'

const MIN_PASSWORD = 8

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`)
    if (password !== confirm) return setError('Passwords don’t match.')

    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/today` },
    })
    setBusy(false)
    if (error) return setError(error.message)
    // With email confirmation off, Supabase logs the user in right away and
    // PublicOnlyRoute redirects. Otherwise they need to click the email link.
    if (!data.session) setSentTo(email)
  }

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        footer={<Link to="/login" className={linkClass}>Back to log in</Link>}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We sent a verification link to <strong>{sentTo}</strong>. Click it to activate your account,
          then you’ll be logged in automatically.
        </p>
        <p className="mt-3 text-xs text-slate-500">Don’t see it? Check spam, or try logging in to resend it.</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free, private, just for you."
      footer={<>Already have an account? <Link to="/login" className={linkClass}>Log in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email" type="email" autoComplete="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="new-password" required
          minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm password" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </AuthLayout>
  )
}
