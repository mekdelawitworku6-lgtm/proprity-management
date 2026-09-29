import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/hooks'
import { useLogger } from '../utils/logger'
import { HOME_FOR } from '../lib/routes'
import type { UserRole } from '../types/api'

interface Props {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { currentUser, isAuthenticated, isRestoring } = useAuth()
  const location = useLocation()
  const log = useLogger('navigation', 'ProtectedRoute')

  // Wait for a persisted refresh token to be exchanged, otherwise a page
  // refresh would bounce an authenticated user to the login screen.
  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    log.warn('access denied — not signed in', { attempted: location.pathname })
    return <Navigate to="/login" replace />
  }

  if (currentUser.isSuspended) {
    log.error('access denied — suspended account', { role: currentUser.role })
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    log.error('access denied — wrong role', {
      attempted: location.pathname,
      role: currentUser.role,
      allowedRoles,
    })
    return <Navigate to={HOME_FOR[currentUser.role] ?? '/login'} replace />
  }

  return <>{children}</>
}
