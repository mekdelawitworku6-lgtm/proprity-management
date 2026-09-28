import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLogger } from '../utils/logger'
import type { UserRole } from '../types'

interface Props {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { currentUser, isAuthenticated } = useAuth()
  const location = useLocation()
  const log = useLogger('navigation', 'ProtectedRoute')

  if (!isAuthenticated || !currentUser) {
    log.warn('access denied — not signed in', { attempted: location.pathname })
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    log.error('access denied — wrong role', {
      attempted: location.pathname,
      role: currentUser.role,
      allowedRoles,
    })
    if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/owner/dashboard" replace />
  }

  return <>{children}</>
}
