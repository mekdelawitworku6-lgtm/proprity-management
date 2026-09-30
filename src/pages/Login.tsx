import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  User,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../store/hooks'
import { useLogger } from '../utils/logger'
import { API_BASE_URL } from '../lib/env'
import { HOME_FOR } from '../lib/routes'
import type { UserRole } from '../types/api'

type Portal = 'owner' | 'admin'

const PORTALS: Record<Portal, { label: string; icon: typeof Building2; accent: string; blurb: string }> =
  {
    owner: {
      label: 'Property Owner',
      icon: Building2,
      accent: 'text-blue-700',
      blurb: 'Manage your buildings, units, tenants, agreements and rent collection.',
    },
    admin: {
      label: 'Platform Admin',
      icon: Shield,
      accent: 'text-slate-800',
      blurb: 'Approve owner accounts, oversee the ecosystem and audit activity.',
    },
  }

const DEMO_ACCOUNTS: Record<Portal, { role: UserRole; label: string; identifier: string }[]> = {
  owner: [
    { role: 'OWNER', label: 'Property Owner', identifier: 'owner@demo.et' },
    { role: 'MANAGER', label: 'Property Manager', identifier: 'manager@demo.et' },
    { role: 'TENANT', label: 'Tenant', identifier: 'tenant@demo.et' },
  ],
  admin: [{ role: 'ADMIN', label: 'Platform Admin', identifier: 'admin@possibletech.et' }],
}

const DEMO_PASSWORD = 'Demo@12345'

export default function Login() {
  const { login, isSubmitting, error, fieldErrors, clearError } = useAuth()
  const navigate = useNavigate()
  const log = useLogger('auth', 'Login')
  const [portal, setPortal] = useState<Portal>('owner')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const demoAccounts = DEMO_ACCOUNTS[portal]
  const activePortal = PORTALS[portal]
  const PortalIcon = activePortal.icon

  const selectPortal = (next: Portal) => {
    setPortal(next)
    setNotice(null)
    clearError()
    log.info('portal selected', { portal: next })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setNotice(null)
    log.info('login submit', { identifier, portal })
    const user = await login({ identifier: identifier.trim(), password })
    if (!user) return

    if (user.isSuspended) {
      log.warn('login blocked: suspended account', { role: user.role })
      setNotice(
        user.suspendedReason
          ? `This account is suspended: ${user.suspendedReason}`
          : 'This account is suspended. Contact the platform administrator.'
      )
      return
    }

    if (user.approvalStatus !== 'APPROVED') {
      log.warn('login blocked: awaiting approval', { role: user.role })
      setNotice('Your account is still awaiting administrator approval.')
      return
    }

    navigate(HOME_FOR[user.role] ?? '/login', { replace: true })
  }

  const handleQuickLogin = (account: (typeof demoAccounts)[number]) => {
    log.info('demo login', { role: account.role })
    setIdentifier(account.identifier)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Platform Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold text-xl shadow-md">
          PT
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
          Property Rental Platform
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Possible Technology &amp; Ethio Telecom Ecosystem
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 sm:rounded-3xl sm:px-10">
          {/* Portal selector: states which sign-in you expect, it does not grant access */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            {(Object.keys(PORTALS) as Portal[]).map((key) => {
              const item = PORTALS[key]
              const Icon = item.icon
              const active = portal === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectPortal(key)}
                  aria-pressed={active}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? item.accent : ''}`} />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Portal Description Banner */}
          <div className="mt-5 mb-6 rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <PortalIcon className={`h-4 w-4 shrink-0 mt-0.5 ${activePortal.accent}`} />
            <p>
              <strong>{activePortal.label} portal.</strong> {activePortal.blurb} Sign in with your
              registered phone number or email.
            </p>
          </div>

          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-900">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
            <p>
              Access is decided by the role on your account, not by this tab. Selecting
              &ldquo;Platform Admin&rdquo; with an owner account still opens the owner portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-700 mb-1">
                Phone number or email
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (error) clearError()
                  }}
                  placeholder={
                    portal === 'owner' ? 'owner@demo.et or +251911000003' : 'admin@possibletech.et'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {fieldErrors.identifier && (
                <p className="mt-1.5 text-[11px] font-medium text-red-600">{fieldErrors.identifier}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) clearError()
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-[11px] font-medium text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <p>{notice}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0F2744] py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-[#1A365D] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in…' : `Sign in to ${activePortal.label} Portal`}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Owner self-registration */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              New property owner?{' '}
              <Link
                to="/register"
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800 hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create an owner account
              </Link>
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Owner accounts are reviewed by a platform administrator before they can sign in.
            </p>
          </div>

          {/* Demo accounts: these perform real logins against the seeded backend */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-1">
              Demo Accounts — {activePortal.label}
            </p>
            <p className="text-[10px] text-slate-400 text-center mb-3">
              password {DEMO_PASSWORD} — fills the form, then press Sign In
            </p>
            <div
              className={`grid gap-2 ${demoAccounts.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}
            >
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleQuickLogin(account)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-2 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                >
                  {account.role === 'OWNER' ? (
                    <Building2 className="h-3.5 w-3.5" />
                  ) : account.role === 'ADMIN' ? (
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              API: <code className="font-mono">{API_BASE_URL}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
