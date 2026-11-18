import { useState } from 'react'
import { Search, UserX, CheckCircle2, Smartphone, AlertCircle, Loader2, Users } from 'lucide-react'
import { useGetAdminUsersQuery, useSuspendUserMutation, useUnsuspendUserMutation } from '../../store/adminApi'
import { toErrorMessage } from '../../store/api'

export default function AdminTenants() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, error, refetch } = useGetAdminUsersQuery({ role: 'TENANT', limit: 50 })
  const [suspend, { isLoading: isSuspending }] = useSuspendUserMutation()
  const [unsuspend, { isLoading: isUnsuspending }] = useUnsuspendUserMutation()

  const tenants = data?.docs ?? []

  const filtered = tenants.filter((tenant) => {
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) return true
    return [tenant.fullName, tenant.phoneNumber, tenant.email ?? ''].some((field) =>
      field.toLowerCase().includes(needle),
    )
  })

  const suspendTenant = (id: string, fullName: string) => {
    const reason = window.prompt(`Suspend ${fullName}? They will be signed out and blocked from paying rent.`)
    if (reason) suspend({ id, reason }).unwrap()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            National Tenant Registry &amp; Mobile Accounts
          </h1>
          <p className="text-xs text-slate-500">
            Every tenant account on the platform (FR-ADM-01, FR-ADM-02)
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Registered Tenants: <strong className="text-slate-800">{data?.total ?? 0}</strong>
        </span>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenants by name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Could not load tenants</p>
            <p className="mt-0.5">{toErrorMessage(error)}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading tenants…
          </div>
        ) : !tenants.length ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">No tenant accounts yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Tenants register themselves, or are added by an owner when a lease is signed. Accounts
              appear here once they exist.
            </p>
          </div>
        ) : !filtered.length ? (
          <div className="px-6 py-14 text-center text-xs font-medium text-slate-500">
            No tenant matches your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Tenant</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Leases</th>
                  <th className="px-4 py-3.5">Approval</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5 text-right">Regulatory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                        {tenant.fullName}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div>{tenant.phoneNumber}</div>
                      <div className="text-[10px] text-slate-400">{tenant.email ?? '—'}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-bold text-slate-900">{tenant._count.tenantAgreements}</span> agreement
                      {tenant._count.tenantAgreements === 1 ? '' : 's'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          tenant.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : tenant.approvalStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {tenant.approvalStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          tenant.isSuspended ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {tenant.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                      {tenant.suspendedReason && (
                        <div className="mt-0.5 text-[10px] text-slate-400">{tenant.suspendedReason}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {tenant.isSuspended ? (
                        <button
                          onClick={() => unsuspend(tenant.id).unwrap()}
                          disabled={isUnsuspending}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="mr-1 inline h-3 w-3" />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendTenant(tenant.id, tenant.fullName)}
                          disabled={isSuspending}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          <UserX className="mr-1 inline h-3 w-3" />
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}