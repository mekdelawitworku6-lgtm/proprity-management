import { useState } from 'react'
import { Plus, Search, MoreVertical } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { Tenant } from '../../types'
import { ClassificationSummaries } from '../../components/ClassificationSummaries'
import { AddTenantModal } from '../../components/modals/AddTenantModal'

export default function OwnerTenants() {
  const { tenants } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [tenantTypeFilter, setTenantTypeFilter] = useState('All Tenant Types')
  const [buildingFilter, setBuildingFilter] = useState('All Buildings')
  const [paymentFilter, setPaymentFilter] = useState('All Payment Status')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Counts
  const totalCount = tenants.length
  const individualCount = tenants.filter((t) => t.tenantType === 'Individual').length
  const familyCount = tenants.filter((t) => t.tenantType === 'Family').length
  const corporateCount = tenants.filter((t) => t.tenantType === 'Corporate').length
  const latePaymentCount = tenants.filter((t) => t.paymentStatus === 'Late').length

  // Filter logic
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unitNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactPhone.includes(searchQuery)

    const matchesStatus =
      statusFilter === 'All Status' ? true : t.status === statusFilter

    const matchesTenantType =
      tenantTypeFilter === 'All Tenant Types' ? true : t.tenantType === tenantTypeFilter

    const matchesBuilding =
      buildingFilter === 'All Buildings' ? true : t.buildingName === buildingFilter

    const matchesPayment =
      paymentFilter === 'All Payment Status' ? true : t.paymentStatus === paymentFilter

    return matchesSearch && matchesStatus && matchesTenantType && matchesBuilding && matchesPayment
  })

  const getTenantTypeBadge = (type: Tenant['tenantType']) => {
    switch (type) {
      case 'Individual':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'Family':
        return 'bg-purple-50 text-purple-700 border border-purple-200'
      case 'Corporate':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tenants & Leases</h1>
          <p className="text-xs text-slate-500">Manage tenant profiles, lease durations, and occupancy</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2744] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1A365D] transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          + Add New Tenant
        </button>
      </div>

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Tenants</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Individual</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{individualCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Family</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{familyCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Corporate</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{corporateCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Late Payments</span>
          <p className="mt-1.5 text-2xl font-bold text-rose-600">{latePaymentCount}</p>
        </div>
      </div>

      {/* 3 Classification Summaries */}
      <ClassificationSummaries />

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search buildings by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Terminated">Terminated</option>
        </select>

        <select
          value={tenantTypeFilter}
          onChange={(e) => setTenantTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="All Tenant Types">All Tenant Types</option>
          <option value="Individual">Individual</option>
          <option value="Family">Family</option>
          <option value="Corporate">Corporate</option>
        </select>

        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="All Buildings">All Buildings</option>
          <option value="Building A - Bole Plaza">Building A - Bole Plaza</option>
          <option value="Building B - Kazanchis Heights">Building B - Kazanchis Heights</option>
          <option value="Building C - CMC Towers">Building C - CMC Towers</option>
          <option value="Building D - Sarbet View">Building D - Sarbet View</option>
          <option value="Building E - Lideta Residences">Building E - Lideta Residences</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="All Payment Status">All Payment Status</option>
          <option value="Current">Current</option>
          <option value="Late">Late</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Unit No.</th>
                <th className="px-4 py-3.5">Tenant Name</th>
                <th className="px-4 py-3.5">Tenant Type</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Lease Type</th>
                <th className="px-4 py-3.5">Lease Start</th>
                <th className="px-4 py-3.5">Lease End</th>
                <th className="px-4 py-3.5">Monthly Rent</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-semibold text-blue-600">{t.unitNo}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{t.tenantName}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {t.buildingName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${getTenantTypeBadge(t.tenantType)}`}>
                      {t.tenantType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{t.contactPhone}</div>
                    <div className="text-[10px] text-slate-400">{t.contactEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{t.leaseType}</td>
                  <td className="px-4 py-3 text-slate-500">{t.leaseStart}</td>
                  <td className="px-4 py-3 text-slate-500">{t.leaseEnd}</td>
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
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                      aria-label="Tenant actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tenant Modal */}
      <AddTenantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
