import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout, linkClass } from '../components/AuthLayout'
import { Alert, Button, Field } from '../components/ui'
import { supabase } from '../lib/supabase'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We’ll email you a link to choose a new one."
      footer={<Link to="/login" className={linkClass}>Back to log in</Link>}
    >
      {sent ? (
        <Alert tone="success">
          If an account exists for <strong>{email}</strong>, a reset link is on its way.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email" type="email" autoComplete="email" required autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
