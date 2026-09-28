import React, { createContext, useContext, useState, useEffect } from 'react'
import type { UserProfile, UserRole } from '../types'
import { useLogger } from '../utils/logger'

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  owner: {
    id: 'user-owner-1',
    name: 'Abebe Tadesse',
    email: 'owner@boleplaza.et',
    role: 'owner',
    phone: '+251-911-234567',
    organization: 'Bole Plaza Real Estate LLC',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
  },
  admin: {
    id: 'user-admin-1',
    name: 'Tewodros Kassahun',
    email: 'admin@possibletech.et',
    role: 'admin',
    phone: '+251-911-889900',
    organization: 'Possible Technology & Ethio Telecom',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
  },
  tenant: {
    id: 'user-tenant-1',
    name: 'Yonas Bekele',
    email: 'tenant@ethio.et',
    role: 'tenant',
    phone: '+251-912-478654',
    organization: 'Tenant Mobile Account',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
  },
}

interface AuthContextType {
  currentUser: UserProfile | null
  isAuthenticated: boolean
  login: (role: UserRole, customEmail?: string) => void
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const log = useLogger('auth', 'AuthProvider')
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('prop_platform_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile
        log.info('restored session from localStorage', { role: parsed.role, email: parsed.email })
        return parsed
      } catch {
        log.warn('stored session unreadable, falling back to demo user')
        return DEMO_USERS.owner
      }
    }
    log.info('no stored session, using demo user', { role: 'owner' })
    return DEMO_USERS.owner
  })

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('prop_platform_user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('prop_platform_user')
    }
  }, [currentUser])

  const login = (role: UserRole, customEmail?: string) => {
    const user = { ...DEMO_USERS[role] }
    if (customEmail) user.email = customEmail
    log.info('login', { role, email: user.email })
    setCurrentUser(user)
  }

  const logout = () => {
    log.warn('logout requested', { user: currentUser?.email })
    setCurrentUser(null)
  }

  const switchRole = (role: UserRole) => {
    log.info('role switched', { from: currentUser?.role, to: role })
    setCurrentUser(DEMO_USERS[role])
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
