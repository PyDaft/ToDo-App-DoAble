import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { AuthLayout, linkClass } from '../components/AuthLayout'
import { FullPageSpinner } from '../components/FullPageSpinner'
import { Alert, Button, Field } from '../components/ui'
import { supabase } from '../lib/supabase'

/**
 * Landing page for the password-reset email. The link logs the user in with a
 * short-lived recovery session, which lets them set a new password here.
 */
export function ResetPassword() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <FullPageSpinner />

  if (!session) {
    return (
      <AuthLayout
        title="Link expired"
        footer={<Link to="/login" className={linkClass}>Back to log in</Link>}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This reset link is invalid or has expired.{' '}
          <Link to="/forgot-password" className={linkClass}>Request a new one</Link>.
        </p>
      </AuthLayout>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords don’t match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    navigate('/today', { replace: true })
  }

  return (
    <AuthLayout title="Choose a new password" subtitle={session.user.email}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="New password" type="password" autoComplete="new-password" required autoFocus
          minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
