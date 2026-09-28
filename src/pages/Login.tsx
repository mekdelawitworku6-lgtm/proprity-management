import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Shield, ArrowRight, CheckCircle2, Lock, Mail } from 'lucide-react'
import { useAuth, DEMO_USERS } from '../context/AuthContext'
import { useLogger } from '../utils/logger'
import type { UserRole } from '../types'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const log = useLogger('auth', 'Login')
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner')
  const [email, setEmail] = useState('owner@boleplaza.et')
  const [password, setPassword] = useState('••••••••')

  const homeFor = (role: UserRole) =>
    role === 'admin' ? '/admin/dashboard' : '/owner/dashboard'

  const handleRoleSelect = (role: UserRole) => {
    log.debug('role tab selected', { role })
    setSelectedRole(role)
    setEmail(DEMO_USERS[role].email)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const target = homeFor(selectedRole)
    log.info('form submit', { role: selectedRole, email, target })
    login(selectedRole, email)
    navigate(target)
  }

  const handleQuickLogin = (role: UserRole) => {
    const target = homeFor(role)
    log.info('quick demo login', { role, target })
    login(role)
    navigate(target)
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
          Possible Technology & Ethio Telecom Ecosystem
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 sm:rounded-3xl sm:px-10">
          {/* Portal Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/70 mb-7">
            <button
              type="button"
              onClick={() => handleRoleSelect('owner')}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-semibold transition ${
                selectedRole === 'owner'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-4 w-4 mb-1" />
              Property Owner
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-semibold transition ${
                selectedRole === 'admin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="h-4 w-4 mb-1 text-blue-600" />
              Admin Portal
            </button>
          </div>

          {/* Role Description Banner */}
          <div className="mb-6 rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              {selectedRole === 'owner' && (
                <p>
                  <strong>Property Owner Dashboard:</strong> Manage buildings, monitor rent collected vs. expected, review digital agreements, and resolve tenant complaints.
                </p>
              )}
              {selectedRole === 'admin' && (
                <p>
                  <strong>Admin Control Dashboard (Possible Tech & Ethio Telecom):</strong> Full oversight of all owners, tenants, digital agreements, dispute arbitration, and Telebirr payment reconciliation.
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Account Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0F2744] py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-[#1A365D] transition"
              >
                Sign In to {selectedRole === 'owner' ? 'Owner Portal' : 'Admin Dashboard'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* 1-Click Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast 1-Click Demo Evaluation
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-2 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
              >
                Login as Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-2 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
              >
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
