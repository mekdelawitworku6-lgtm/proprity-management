import { useDeferredValue, useState } from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react'
import {
  useApproveUserMutation,
  useGetAdminUsersQuery,
  useRejectUserMutation,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
} from '../../store/adminApi'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import type { AdminUser, ApprovalStatus } from '../../types/api'

const PAGE_SIZE = 10

type Tab = { key: string; label: string; filter: { approvalStatus?: ApprovalStatus; isSuspended?: boolean } }

const TABS: Tab[] = [
  { key: 'PENDING', label: 'Requests', filter: { approvalStatus: 'PENDING' } },
  { key: 'APPROVED', label: 'Approved', filter: { approvalStatus: 'APPROVED' } },
  { key: 'REJECTED', label: 'Rejected', filter: { approvalStatus: 'REJECTED' } },
  { key: 'SUSPENDED', label: 'Suspended', filter: { isSuspended: true } },
  { key: 'ALL', label: 'All Owners', filter: {} },
]

interface ReasonPrompt {
  owner: AdminUser
  action: 'reject' | 'suspend'
}

const REASON_PLACEHOLDER =
  'Explain the decision. This is stored in the audit log and shown to the account holder.'

export default function AdminOwners() {
  const log = useLogger('admin', 'OwnerRequests')
  const [tab, setTab] = useState('PENDING')
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput)
  const [page, setPage] = useState(1)
  const [prompt, setPrompt] = useState<ReasonPrompt | null>(null)
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]

  const { data, isLoading, isFetching, error, refetch } = useGetAdminUsersQuery(
    {
      role: 'OWNER',
      ...activeTab.filter,
      ...(search.trim() ? { search: search.trim() } : {}),
      page,
      limit: PAGE_SIZE,
    },
    { refetchOnMountOrArgChange: true }
  )

  const [approve, { isLoading: isApproving }] = useApproveUserMutation()
  const [reject] = useRejectUserMutation()
  const [suspend] = useSuspendUserMutation()
  const [unsuspend, { isLoading: isUnsuspending }] = useUnsuspendUserMutation()

  const handleApprove = async (owner: AdminUser) => {
    setActionError(null)
    try {
      await approve(owner.id).unwrap()
      log.info('owner approved', { id: owner.id, name: owner.fullName })
    } catch (caught) {
      setActionError(toErrorMessage(caught))
    }
  }

  const openReason = (owner: AdminUser, action: 'reject' | 'suspend') => {
    setActionError(null)
    setReason('')
    setPrompt({ owner, action })
  }

  const closeReason = () => {
    setPrompt(null)
    setReason('')
  }

  const handleConfirmReason = async () => {
    if (!prompt || reason.trim().length < 3) return
    setActionError(null)
    try {
      if (prompt.action === 'reject') {
        await reject({ id: prompt.owner.id, reason: reason.trim() }).unwrap()
        log.info('owner rejected', { id: prompt.owner.id, name: prompt.owner.fullName })
      } else {
        await suspend({ id: prompt.owner.id, reason: reason.trim() }).unwrap()
        log.info('owner suspended', { id: prompt.owner.id, name: prompt.owner.fullName })
      }
      closeReason()
    } catch (caught) {
      setActionError(toErrorMessage(caught))
    }
  }

  const handleUnsuspend = async (owner: AdminUser) => {
    setActionError(null)
    try {
      await unsuspend(owner.id).unwrap()
      log.info('owner unsuspended', { id: owner.id, name: owner.fullName })
    } catch (caught) {
      setActionError(toErrorMessage(caught))
    }
  }

  const docs = data?.docs ?? []
  const totalPages = data?.totalPages ?? 1
  const anyActionPending = isApproving || isUnsuspending

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Owner Requests &amp; Account Governance
          </h1>
          <p className="text-xs text-slate-500">
            Approve or reject new property owner registrations, and suspend accounts (FR-ADM-01,
            FR-ADM-02)
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
        {TABS.map((item) => {
          const active = tab === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key)
                setPage(1)
              }}
              className={`-mb-px border-b-2 px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
          placeholder="Search owners by name, phone number, or email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <p>{actionError}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <p>{toErrorMessage(error)}</p>
        </div>
      )}

      {/* Requests table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading owner accounts…
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-16 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-300" />
            <p className="text-sm font-bold text-slate-700">Nothing here</p>
            <p className="text-xs text-slate-500">
              {tab === 'PENDING'
                ? 'There are no owner accounts waiting for approval.'
                : 'No owner accounts match this filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Owner</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Portfolio</th>
                  <th className="px-4 py-3.5">Registered</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((owner) => (
                  <tr key={owner.id} className="align-top transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{owner.fullName}</div>
                      {owner.ownerProfile?.companyName && (
                        <div className="text-[11px] text-slate-500">
                          {owner.ownerProfile.companyName}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="font-mono text-[11px]">{owner.phoneNumber}</div>
                      <div className="text-[10px] text-slate-400">{owner.email ?? '—'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        {owner._count.properties}{' '}
                        <span className="text-slate-400">
                          building{owner._count.properties === 1 ? '' : 's'}
                        </span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(owner.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            owner.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : owner.approvalStatus === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {owner.approvalStatus}
                        </span>
                        {owner.isSuspended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <ShieldAlert className="h-3 w-3" />
                            SUSPENDED
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {owner.isSuspended ? (
                          <button
                            type="button"
                            onClick={() => handleUnsuspend(owner)}
                            disabled={anyActionPending}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1 inline" />
                            Restore
                          </button>
                        ) : owner.approvalStatus !== 'APPROVED' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(owner)}
                              disabled={anyActionPending}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 inline" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openReason(owner, 'reject')}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1 inline" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReason(owner, 'suspend')}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1 inline" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-[11px] text-slate-500">
              Page {data?.page ?? 1} of {totalPages} · {data?.total ?? 0} owner accounts
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={(data?.page ?? 1) <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={(data?.page ?? 1) >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reason dialog for reject / suspend */}
      {prompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reason-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="reason-dialog-title" className="text-sm font-bold text-slate-900">
              {prompt.action === 'reject' ? 'Reject owner request' : 'Suspend account'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {prompt.action === 'reject'
                ? `${prompt.owner.fullName} will not be able to sign in.`
                : `${prompt.owner.fullName} and their managers will be signed out immediately.`}
            </p>

            <label
              htmlFor="reason"
              className="mt-4 block text-xs font-bold text-slate-700 mb-1"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={REASON_PLACEHOLDER}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-[10px] text-slate-400">At least 3 characters.</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReason}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReason}
                disabled={reason.trim().length < 3}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  prompt.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {prompt.action === 'reject' ? 'Reject request' : 'Suspend account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
