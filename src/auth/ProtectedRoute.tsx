import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageSpinner } from '../components/FullPageSpinner'
import { useAuth } from './context'

/** Renders child routes only for logged-in users; everyone else goes to /login. */
export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** The opposite: login/signup pages bounce logged-in users into the app. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  if (loading) return <FullPageSpinner />
  if (session) return <Navigate to={from && from !== '/' ? from : '/today'} replace />
  return <Outlet />
}
