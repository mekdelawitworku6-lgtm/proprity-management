import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useRegisterMutation } from '../store/propertyApi'
import { toErrorMessage } from '../store/api'
import { useLogger } from '../utils/logger'
import type { PublicUser } from '../types/api'

const MIN_PASSWORD_LENGTH = 8

interface FormState {
  fullName: string
  phoneNumber: string
  email: string
  companyName: string
  password: string
  confirmPassword: string
}

const EMPTY_FORM: FormState = {
  fullName: '',
  phoneNumber: '',
  email: '',
  companyName: '',
  password: '',
  confirmPassword: '',
}

/** Mirrors the server's isStrongPassword: length, a letter, and a digit. */
function checkPassword(password: string): string[] {
  const problems: string[] = []
  if (password.length < MIN_PASSWORD_LENGTH) {
    problems.push(`at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  if (!/[A-Za-z]/.test(password)) problems.push('a letter')
  if (!/\d/.test(password)) problems.push('a digit')
  return problems
}

export default function RegisterOwner() {
  const log = useLogger('auth', 'RegisterOwner')
  const [register, { isLoading, error }] = useRegisterMutation()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [registered, setRegistered] = useState<PublicUser | null>(null)

  const serverError = error ? toErrorMessage(error) : null
  const serverFieldErrors = useMemo(() => {
    const data = (error as { data?: { errors?: string[] } } | undefined)?.data
    const list = data?.errors
    if (!Array.isArray(list)) return {} as Record<string, string>
    const mapped: Record<string, string> = {}
    for (const message of list) {
      const field = message.split(' ')[0]
      if (field && !mapped[field]) mapped[field] = message
    }
    return mapped
  }, [error])

  const passwordProblems = checkPassword(form.password)
  const passwordValid = form.password.length > 0 && passwordProblems.length === 0
  const passwordsMatch = form.confirmPassword.length === 0 || form.password === form.confirmPassword

  const localErrors: Record<string, string> = {}
  if (touched.fullName && form.fullName.trim().length < 2) {
    localErrors.fullName = 'Enter your full name (at least 2 characters).'
  }
  if (touched.phoneNumber && !/^(\+?251|0)9\d{8}$/.test(form.phoneNumber.trim())) {
    localErrors.phoneNumber = 'Enter a valid Ethiopian mobile, e.g. 0911223344.'
  }
  if (touched.email && form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    localErrors.email = 'Enter a valid email address or leave it blank.'
  }
  if (touched.password && form.password && passwordProblems.length > 0) {
    localErrors.password = `Password needs ${passwordProblems.join(', ')}.`
  }
  if (touched.confirmPassword && !passwordsMatch) {
    localErrors.confirmPassword = 'Passwords do not match.'
  }

  const errorFor = (field: keyof FormState) =>
    serverFieldErrors[field] ?? localErrors[field] ?? undefined

  const isValid =
    form.fullName.trim().length >= 2 &&
    /^(\+?251|0)9\d{8}$/.test(form.phoneNumber.trim()) &&
    (!form.email.trim() || /^\S+@\S+\.\S+$/.test(form.email.trim())) &&
    passwordValid &&
    passwordsMatch

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const blur = (field: keyof FormState) => () => setTouched((prev) => ({ ...prev, [field]: true }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ fullName: true, phoneNumber: true, email: true, password: true, confirmPassword: true })
    if (!isValid || isLoading) return

    log.info('owner registration submit', { phoneNumber: form.phoneNumber.trim() })
    try {
      const result = await register({
        role: 'OWNER',
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.companyName.trim() ? { companyName: form.companyName.trim() } : {}),
        password: form.password,
      }).unwrap()
      log.info('owner registration submitted', { approvalStatus: result.user.approvalStatus })
      setRegistered(result.user)
    } catch {
      /* surfaced through `error` */
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white px-6 py-10 shadow-xl border border-slate-200/80 sm:rounded-3xl sm:px-10 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-xl font-black tracking-tight text-slate-900">
              Registration submitted
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Thanks, <strong>{registered.fullName}</strong>. Your owner account
              {registered.ownerProfile?.companyName ? (
                <>
                  {' '}
                  for <strong>{registered.ownerProfile.companyName}</strong>
                </>
              ) : null}{' '}
              has been created and is now{' '}
              <strong className="text-amber-700">
                {registered.approvalStatus === 'APPROVED' ? 'approved' : 'pending administrator review'}
              </strong>
              .
            </p>

            <ol className="mt-6 space-y-3 text-left text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>A verification SMS was sent to {registered.phoneNumber}.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  A platform administrator reviews every owner account before it can be used.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>Once approved, sign in to add your buildings and units.</span>
              </li>
            </ol>

            <div className="mt-7 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-[11px] text-slate-600 text-left">
              <p className="font-bold text-slate-700">How to test the approval step</p>
              <p className="mt-1 leading-relaxed">
                Sign in as <span className="font-mono">admin@possibletech.et</span> (password{' '}
                <span className="font-mono">Demo@12345</span>), open the owner approval screen and
                approve this account. You can then sign back in as the new owner.
              </p>
            </div>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#0F2744] py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-[#1A365D] transition"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold text-xl shadow-md">
          PT
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
          Register as a Property Owner
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Create an account to list and manage your buildings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 sm:rounded-3xl sm:px-10">
          <div className="mb-6 rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Building2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
            <p>
              <strong>Owner accounts require administrator approval.</strong> Your phone number is
              the primary identifier for the account, so an email address is optional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.fullName}
                  onChange={update('fullName')}
                  onBlur={blur('fullName')}
                  placeholder="Abebe Kebede"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {errorFor('fullName') && (
                <p className="mt-1.5 text-[11px] font-medium text-red-600">{errorFor('fullName')}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={form.phoneNumber}
                    onChange={update('phoneNumber')}
                    onBlur={blur('phoneNumber')}
                    placeholder="0911223344"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {errorFor('phoneNumber') ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-600">
                    {errorFor('phoneNumber')}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    09xxxxxxxx or +2519xxxxxxxx
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update('email')}
                    onBlur={blur('email')}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {errorFor('email') && (
                  <p className="mt-1.5 text-[11px] font-medium text-red-600">{errorFor('email')}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-xs font-bold text-slate-700 mb-1">
                Company name <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  autoComplete="organization"
                  value={form.companyName}
                  onChange={update('companyName')}
                  placeholder="Bole Real Estate PLC"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={update('password')}
                  onBlur={blur('password')}
                  placeholder="Abebe2025"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
                {errorFor('password') ? (
                  <p className="mt-1.5 text-[11px] font-medium text-red-600">{errorFor('password')}</p>
                ) : form.password ? (
                  <p
                    className={`mt-1.5 text-[10px] font-medium ${
                      passwordValid ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {passwordValid
                      ? 'Password meets the requirement'
                      : `Needs ${passwordProblems.join(', ')}`}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    8+ characters with a letter and a digit
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  onBlur={blur('confirmPassword')}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
                {errorFor('confirmPassword') && (
                  <p className="mt-1.5 text-[11px] font-medium text-red-600">
                    {errorFor('confirmPassword')}
                  </p>
                )}
              </div>
            </div>

            {serverError && !Object.keys(serverFieldErrors).length && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <p>{serverError}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0F2744] py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-[#1A365D] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting…' : 'Create owner account'}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Already registered? Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
