import { useState } from 'react'
import { Search, UserX, CheckCircle2, Smartphone } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'

export default function AdminTenants() {
  const { tenants, toggleTenantStatus } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTenants = tenants.filter(
    (t) =>
      t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unitNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactPhone.includes(searchQuery)
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            National Tenant Registry & Mobile Accounts
          </h1>
          <p className="text-xs text-slate-500">
            Platform-wide observation and verification of all tenant mobile app accounts (FR-ADM-01, FR-ADM-02)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            Registered Tenants: <strong>{tenants.length}</strong>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenants by name, unit, property, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Tenants Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Tenant Name</th>
                <th className="px-4 py-3.5">Rented Property & Unit</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Monthly Rent</th>
                <th className="px-4 py-3.5">Payment Standing</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5 text-right">Regulatory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                      {t.tenantName}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    <div className="font-semibold text-slate-800">{t.buildingName}</div>
                    <div className="text-[10px] text-blue-600 font-mono">{t.unitNo}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    <div>{t.contactPhone}</div>
                    <div className="text-[10px] text-slate-400">{t.contactEmail}</div>
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-900">
                    {t.monthlyRent.toLocaleString()} ETB
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        t.paymentStatus === 'Current'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {t.paymentStatus}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        t.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {t.status === 'Active' ? (
                      <button
                        onClick={() => toggleTenantStatus(t.id, 'Suspended')}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <UserX className="h-3 w-3 inline mr-1" />
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleTenantStatus(t.id, 'Active')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
