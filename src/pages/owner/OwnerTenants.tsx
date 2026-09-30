import { useDeferredValue, useState } from 'react'
import { AlertCircle, Building2, Loader2, Search, Users } from 'lucide-react'
import { useGetAgreementsQuery, useGetOwnerBalancesQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import type { AgreementStatus } from '../../types/api'

const PAGE_SIZE = 10

type StatusFilter = 'ACTIVE' | 'PENDING_SIGNATURE' | 'ALL'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ACTIVE', label: 'Active leases' },
  { key: 'PENDING_SIGNATURE', label: 'Awaiting signature' },
  { key: 'ALL', label: 'All leases' },
]

const STATUS_BADGE: Partial<Record<AgreementStatus, string>> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PENDING_SIGNATURE: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
  TERMINATED: 'bg-rose-50 text-rose-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  RENEWED: 'bg-blue-50 text-blue-700',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

export default function OwnerTenants() {
  const log = useLogger('owner', 'OwnerTenants')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE')
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useGetAgreementsQuery(
    {
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      page,
      limit: PAGE_SIZE,
    },
    { refetchOnMountOrArgChange: true }
  )

  // Outstanding balances are keyed by tenant, so the roster can show what each owes.
  const { data: balances } = useGetOwnerBalancesQuery()
  const outstandingByTenant = new Map(
    (balances?.tenants ?? []).map((entry) => [entry.tenant.id, entry])
  )

  const leases = data?.docs ?? []
  const term = search.trim().toLowerCase()
  const filtered = term
    ? leases.filter((lease) =>
        [
          lease.tenant.fullName,
          lease.tenant.phoneNumber,
          lease.property.name,
          lease.unit.unitNumber,
          lease.referenceNo,
        ].some((value) => value?.toLowerCase().includes(term))
      )
    : leases

  const totalPages = data?.totalPages ?? 1
  const totalOutstanding = balances?.totalOutstanding ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tenants &amp; Leases</h1>
          <p className="text-xs text-slate-500">
            Every lease on your portfolio, with what each tenant currently owes
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total outstanding
            </p>
            <p className="text-lg font-black text-slate-900">
              ETB {totalOutstanding.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leases</p>
            <p className="text-lg font-black text-slate-900">{data?.total ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.key
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setStatusFilter(filter.key)
                  setPage(1)
                }}
                className={`-mb-px border-b-2 px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tenant, building, unit or reference..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <p>{toErrorMessage(error)}</p>
        </div>
      )}

      {/* Tenant list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your leases…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-16 text-center">
            <Users className="h-7 w-7 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">
              {leases.length === 0 ? 'No tenants yet' : 'No matches'}
            </p>
            <p className="max-w-sm text-xs text-slate-500">
              {leases.length === 0
                ? 'Tenants appear here once a rental request is accepted and a lease is signed. Until then this is genuinely empty.'
                : 'No lease matches your search on this page.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Tenant</th>
                  <th className="px-4 py-3.5">Building / Unit</th>
                  <th className="px-4 py-3.5">Lease</th>
                  <th className="px-4 py-3.5">Rent</th>
                  <th className="px-4 py-3.5">Outstanding</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lease) => {
                  const balance = outstandingByTenant.get(lease.tenantId)
                  const outstanding = balance?.outstanding ?? 0
                  return (
                    <tr key={lease.id} className="align-top transition hover:bg-slate-50/80">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{lease.tenant.fullName}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {lease.tenant.phoneNumber}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          {lease.property.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Unit {lease.unit.unitNumber}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        <div className="font-mono text-[10px]">{lease.referenceNo}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(lease.startDate)} → {formatDate(lease.endDate)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        ETB {lease.rentAmount.toLocaleString()}
                        <div className="text-[10px] font-normal text-slate-400">
                          deposit ETB {lease.depositAmount.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {outstanding > 0 ? (
                          <>
                            <div className="font-bold text-rose-700">
                              ETB {outstanding.toLocaleString()}
                            </div>
                            {balance && balance.overdueCount > 0 && (
                              <div className="text-[10px] text-rose-500">
                                {balance.overdueCount} overdue
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-emerald-600">Settled</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            STATUS_BADGE[lease.status] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {lease.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-[11px] text-slate-500">
              Page {data?.page ?? 1} of {totalPages} · {data?.total ?? 0} leases
              {isFetching ? ' · refreshing…' : ''}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  log.info('previous page', { from: page })
                  setPage((p) => Math.max(1, p - 1))
                }}
                disabled={(data?.page ?? 1) <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  log.info('next page', { from: page })
                  setPage((p) => Math.min(totalPages, p + 1))
                }}
                disabled={(data?.page ?? 1) >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
