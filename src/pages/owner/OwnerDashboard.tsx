import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  FileSignature,
  Loader2,
  Plus,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useGetAgreementsQuery,
  useGetComplaintsQuery,
  useGetOwnerBalancesQuery,
  useGetOwnerDashboardQuery,
} from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import type { Priority } from '../../types/api'

const PRIORITY_BADGE: Record<Priority, string> = {
  URGENT: 'bg-rose-100 text-rose-700',
  HIGH: 'bg-amber-100 text-amber-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  LOW: 'bg-slate-100 text-slate-600',
}

function formatMoney(amount: number): string {
  return `ETB ${amount.toLocaleString()}`
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

function StatCard({
  label,
  value,
  hint,
  hintTone,
  to,
  icon,
}: {
  label: string
  value: string | number
  hint: string
  hintTone: string
  to: string
  icon: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-blue-300"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className={`mt-1 flex items-center text-[11px] font-medium ${hintTone}`}>
        {hint}
        <ArrowUpRight className="ml-0.5 h-3 w-3" />
      </p>
    </Link>
  )
}

export default function OwnerDashboard() {
  const { data, isLoading, isFetching, error } = useGetOwnerDashboardQuery()
  const { data: balances } = useGetOwnerBalancesQuery()
  // Small pages just to populate the two "recent" panels.
  const { data: recentAgreements } = useGetAgreementsQuery({ status: 'ACTIVE', limit: 3 })
  const { data: recentComplaints } = useGetComplaintsQuery({ limit: 3 })

  const totals = data?.totals
  const units = totals?.units
  const complaints = data?.maintenance.complaints
  const openComplaints = (complaints?.OPEN ?? 0) + (complaints?.IN_PROGRESS ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Property Owner Dashboard</h1>
          <p className="text-xs text-slate-500">
            {data
              ? `Portfolio performance for ${formatMonth(data.period.start)}`
              : 'Portfolio performance, rent collection and tenant overview.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/owner/complaints"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <Wrench className="h-4 w-4" /> New request
          </Link>
          <Link
            to="/owner/properties"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" /> Add building
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>{toErrorMessage(error)}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your portfolio…
        </div>
      ) : (
        <>
          {/* Core stats, all straight from GET /dashboard/owner */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="My buildings"
              value={totals?.properties ?? 0}
              hint={`${units?.occupied ?? 0}/${units?.total ?? 0} units occupied (${totals?.occupancyRate ?? 0}%)`}
              hintTone="text-blue-600"
              to="/owner/properties"
              icon={<Building2 className="h-4 w-4" />}
            />

            <StatCard
              label="Rent collected"
              value={formatMoney(totals?.rentCollected ?? 0)}
              hint={`${totals?.collectionRate ?? 0}% of ${formatMoney(totals?.rentExpected ?? 0)}`}
              hintTone="text-emerald-600"
              to="/owner/payments"
              icon={<Wallet className="h-4 w-4" />}
            />

            <StatCard
              label="Active leases"
              value={totals?.activeAgreements ?? 0}
              hint={`${totals?.leasesExpiringSoon ?? 0} expiring within 30 days`}
              hintTone="text-purple-600"
              to="/owner/agreements"
              icon={<FileSignature className="h-4 w-4" />}
            />

            <StatCard
              label="Complaints & reports"
              value={Object.values(complaints ?? {}).reduce((sum, n) => sum + n, 0)}
              hint={`${openComplaints} active · ${data?.maintenance.escalated ?? 0} escalated`}
              hintTone="text-amber-600"
              to="/owner/complaints"
              icon={<Wrench className="h-4 w-4" />}
            />
          </div>

          {/* Collection breakdown + outstanding */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Rent collection this month</h2>
                {isFetching && <span className="text-[10px] text-slate-400">refreshing…</span>}
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-600">Collected</span>
                  <span className="text-lg font-black text-emerald-600">
                    {formatMoney(totals?.rentCollected ?? 0)}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, totals?.collectionRate ?? 0)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {totals?.collectionRate ?? 0}% of {formatMoney(totals?.rentExpected ?? 0)} expected
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                {(['TELEBIRR', 'BANK_TRANSFER', 'CASH'] as const).map((method) => (
                  <div key={method}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {method.replace('_', ' ')}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {formatMoney(totals?.collectedByMethod[method] ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
                Outstanding
              </h2>

              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total owed to you
                </p>
                <p className="mt-0.5 text-2xl font-black text-rose-600">
                  {formatMoney(totals?.outstanding ?? 0)}
                </p>
              </div>

              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Overdue invoices</dt>
                  <dd className="font-bold text-slate-800">{totals?.overdueInvoices ?? 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Active tenants</dt>
                  <dd className="font-bold text-slate-800">{totals?.activeTenants ?? 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Pending rental requests</dt>
                  <dd className="font-bold text-slate-800">{totals?.pendingRentalRequests ?? 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Tenants in arrears</dt>
                  <dd className="font-bold text-slate-800">{balances?.tenants.length ?? 0}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Recent activity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Active leases</h2>
                <Link to="/owner/agreements" className="text-xs font-semibold text-blue-600 hover:underline">
                  View all
                </Link>
              </div>

              {(recentAgreements?.docs.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No active leases yet.
                </p>
              ) : (
                <div className="mt-1 divide-y divide-slate-100 text-xs">
                  {recentAgreements?.docs.map((lease) => (
                    <div key={lease.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">{lease.referenceNo}</span>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {lease.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-semibold text-slate-900">
                          {lease.tenant.fullName} · Unit {lease.unit.unitNumber}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {lease.property.name} · {formatMoney(lease.rentAmount)}/mo
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        until {formatDate(lease.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Recent complaints</h2>
                <Link to="/owner/complaints" className="text-xs font-semibold text-blue-600 hover:underline">
                  View all
                </Link>
              </div>

              {(recentComplaints?.docs.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Nothing reported yet.</p>
              ) : (
                <div className="mt-1 divide-y divide-slate-100 text-xs">
                  {recentComplaints?.docs.map((complaint) => (
                    <div key={complaint.id} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{complaint.referenceNo}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${PRIORITY_BADGE[complaint.priority]}`}
                        >
                          {complaint.priority}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {complaint.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-slate-900">{complaint.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {complaint.property.name}
                        {complaint.unit ? ` · Unit ${complaint.unit.unitNumber}` : ''}
                        {complaint.tenant ? ` · ${complaint.tenant.fullName}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
