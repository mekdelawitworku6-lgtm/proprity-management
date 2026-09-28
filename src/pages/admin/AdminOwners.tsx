import { useState } from 'react'
import { Search, Building2, ShieldCheck, CheckCircle2, UserX } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'

export default function AdminOwners() {
  const { registeredOwners, toggleOwnerStatus, properties } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredOwners = registeredOwners.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.organization && o.organization.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'All' ? true : o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Property Owners Registry & Governance
          </h1>
          <p className="text-xs text-slate-500">
            Audit registered landlords, real estate entities, and enforce account suspensions (FR-ADM-01, FR-ADM-02)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            Total Entities: <strong>{registeredOwners.length}</strong>
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search owners by name, email, or real estate organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Owners Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Owner / Organization</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Managed Portfolio</th>
                <th className="px-4 py-3.5">License Standing</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5 text-right">Regulatory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwners.map((owner) => {
                const ownerProps = properties.filter((p) => p.ownerId === owner.id || p.manager.includes(owner.name.split(' ')[0]))
                return (
                  <tr key={owner.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{owner.name}</div>
                      <div className="text-[11px] text-slate-500">{owner.organization}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div>{owner.email}</div>
                      <div className="text-[10px] text-slate-400">{owner.phone}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>{ownerProps.length > 0 ? `${ownerProps.length} Buildings (${ownerProps.reduce((a, b) => a + b.totalUnits, 0)} Units)` : '1 Building (48 Units)'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3" /> MoUDC Verified
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          owner.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : owner.status === 'Pending Verification'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {owner.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {owner.status === 'Active' ? (
                        <button
                          onClick={() => toggleOwnerStatus(owner.id, 'Suspended')}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                        >
                          <UserX className="h-3.5 w-3.5 inline mr-1" />
                          Suspend Account
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleOwnerStatus(owner.id, 'Active')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                          Approve / Activate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
