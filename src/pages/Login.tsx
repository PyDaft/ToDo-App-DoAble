import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout, linkClass } from '../components/AuthLayout'
import { Alert, Button, Field } from '../components/ui'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    setUnconfirmed(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (!error) return // PublicOnlyRoute sends us into the app once the session lands.
    if (error.code === 'email_not_confirmed') {
      setUnconfirmed(true)
      setError('Please verify your email first — check your inbox for the link.')
    } else if (error.code === 'invalid_credentials') {
      setError('Wrong email or password.')
    } else {
      setError(error.message)
    }
  }

  async function resendVerification() {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/today` },
    })
    if (error) setError(error.message)
    else {
      setError(null)
      setNotice(`Verification email sent to ${email}.`)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your tasks."
      footer={<>No account yet? <Link to="/signup" className={linkClass}>Sign up</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <Alert tone="error">
            {error}
            {unconfirmed && (
              <button type="button" onClick={resendVerification} className="ml-1 font-medium underline">
                Resend email
              </button>
            )}
          </Alert>
        )}
        {notice && <Alert tone="success">{notice}</Alert>}
        <Field label="Email" type="email" autoComplete="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className={linkClass}>Forgot password?</Link>
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
