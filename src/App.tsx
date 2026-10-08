import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute'
import { isConfigured } from './lib/supabase'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { SetupNeeded } from './pages/SetupNeeded'
import { Signup } from './pages/Signup'

export default function App() {
  if (!isConfigured) return <SetupNeeded />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          {/* Needs the recovery session from the email link, so it's neither public-only nor protected. */}
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/today" replace />} />
            {/* One route for every view so switching views doesn't reload data. */}
            <Route path="/:view/:param?" element={<Home />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
