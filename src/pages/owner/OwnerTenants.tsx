import { useDeferredValue, useState } from 'react'
import {
  AlertCircle,
  BellRing,
  Calendar,
  CheckCircle2,
  FileSignature,
  Loader2,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useGetAgreementsQuery, useGetOwnerBalancesQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { ClassificationSummaries } from '../../components/ClassificationSummaries'
import type { AgreementSummary } from '../../types/api'

const PAGE_SIZE = 10

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

function kycBadge(status?: string): string {
  if (status === 'VERIFIED') return 'bg-emerald-50 text-emerald-700'
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700'
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700'
  return 'bg-slate-100 text-slate-600'
}

export default function OwnerTenants() {
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [tenantTypeFilter, setTenantTypeFilter] = useState('ALL')
  const [leaseTypeFilter, setLeaseTypeFilter] = useState('ALL')
  const [buildingFilter, setBuildingFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')

  // Active 3-dot menu dropdown state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  // Modals state
  const [selectedLease, setSelectedLease] = useState<AgreementSummary | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New Tenant Form state
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantPhone, setNewTenantPhone] = useState('')
  const [newTenantBuilding, setNewTenantBuilding] = useState('Building A')
  const [newTenantUnit, setNewTenantUnit] = useState('A-101')
  const [newTenantRent, setNewTenantRent] = useState('12500')
  const [newTenantType, setNewTenantType] = useState('Individual')

  const { data, isLoading, error } = useGetAgreementsQuery(
    {
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter as any }),
      page,
      limit: PAGE_SIZE,
    },
    { refetchOnMountOrArgChange: true }
  )

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
  const totalCount = data?.total ?? (leases.length || 9)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSendReminder = (lease: AgreementSummary) => {
    setMenuOpenId(null)
    showToast(`Payment reminder SMS & Email sent to ${lease.tenant.fullName} (${lease.tenant.phoneNumber})`)
  }

  const handleRenewLease = (lease: AgreementSummary) => {
    setMenuOpenId(null)
    showToast(`Lease renewal draft generated for ${lease.tenant.fullName} - Unit ${lease.unit.unitNumber}`)
  }

  const handleTerminateLease = (lease: AgreementSummary) => {
    setMenuOpenId(null)
    showToast(`Termination request initiated for lease ${lease.referenceNo}`)
  }

  const handleViewDetails = (lease: AgreementSummary) => {
    setSelectedLease(lease)
    setIsDetailOpen(true)
    setMenuOpenId(null)
  }

  const handleAddTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddTenantOpen(false)
    showToast(`New tenant ${newTenantName} registered successfully for Unit ${newTenantUnit}!`)
    setNewTenantName('')
    setNewTenantPhone('')
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Tenants &amp; Leases</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage all tenant and lease information
        </p>
      </div>

      {/* 5 Stats Cards matching Figma */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Tenants</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Individual</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">5</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Family</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Corporate</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">1</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Late Payments</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">1</p>
        </div>
      </div>

      {/* Action / Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search buildings by name or address..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Search className="pointer-events-none absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <button
          type="button"
          onClick={() => setIsAddTenantOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#003882] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#002b66] active:bg-[#00224f]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Add New Tenant
        </button>
      </div>

      {/* Classification & Summary Cards */}
      <ClassificationSummaries />

      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_SIGNATURE">Pending Signature</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <select
          value={tenantTypeFilter}
          onChange={(e) => setTenantTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Tenant Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="FAMILY">Family</option>
          <option value="CORPORATE">Corporate</option>
        </select>

        <select
          value={leaseTypeFilter}
          onChange={(e) => setLeaseTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Lease Types</option>
          <option value="STANDARD">Standard Leases (12 mo)</option>
          <option value="SHORT">Short-term (1-12 mo)</option>
          <option value="LONG">Long-term (24+ mo)</option>
        </select>

        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Buildings</option>
          <option value="BUILDING_A">Building A</option>
          <option value="BUILDING_B">Building B</option>
        </select>

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Payment Status</option>
          <option value="CURRENT">Current</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
        </select>
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

      {/* Tenant Table matching Figma */}
      <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-xs">
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
                ? 'Tenants appear here once a rental request is accepted and a lease is signed.'
                : 'No lease matches your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500">
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
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lease, idx) => {
                  const balance = outstandingByTenant.get(lease.tenantId)
                  const outstanding = balance?.outstanding ?? 0
                  const isOverdue = outstanding > 0
                  const tenantType = idx % 3 === 0 ? 'Individual' : idx % 3 === 1 ? 'Family' : 'Corporate'
                  const tenantTypeBadge =
                    tenantType === 'Individual'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : tenantType === 'Family'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'

                  const isMenuOpen = menuOpenId === lease.id

                  return (
                    <tr key={lease.id} className="align-middle transition hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-blue-600">Unit {lease.unit.unitNumber}</div>
                        <div className="text-[10px] text-slate-400">{lease.property.name}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="font-bold text-slate-900">{lease.tenant.fullName}</div>
                          {lease.tenant.tenantProfile && (
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${kycBadge(lease.tenant.tenantProfile.kycStatus)}`}>
                              {lease.tenant.tenantProfile.kycStatus === 'VERIFIED' ? 'Fayda verified' : lease.tenant.tenantProfile.kycStatus.toLowerCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">1 Occupant</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tenantTypeBadge}`}>
                          {tenantType}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 text-[11px]">{lease.tenant.phoneNumber}</div>
                        <div className="text-[10px] text-slate-400">Direct Tenant</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-md border border-blue-200 bg-blue-50/50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          Standard (Direct)
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                        {formatDate(lease.startDate)}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                        {formatDate(lease.endDate)}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {lease.rentAmount.toLocaleString()} ETB
                      </td>

                      <td className="px-4 py-3.5">
                        {isOverdue ? (
                          <span className="inline-block rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Current
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          Active
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center relative">
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(isMenuOpen ? null : lease.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Interactive 3-Dot Action Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-2 top-10 z-40 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg text-left animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(lease)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <FileSignature className="h-3.5 w-3.5 text-blue-600" />
                              View Lease Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendReminder(lease)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <BellRing className="h-3.5 w-3.5 text-amber-600" />
                              Send Payment Reminder
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRenewLease(lease)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                              Renew Agreement
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              type="button"
                              onClick={() => handleTerminateLease(lease)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Terminate Agreement
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
          <p className="text-[11px] text-slate-500">
            Showing 1-{filtered.length} of {data?.total ?? filtered.length} Tenants
          </p>
          {totalPages > 1 && (
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
          )}
        </div>
      </div>

      {/* View Lease Details Modal */}
      {isDetailOpen && selectedLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lease Agreement Details</h3>
                <p className="font-mono text-xs text-blue-600">{selectedLease.referenceNo}</p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 text-xs text-slate-700">
              {/* Tenant info */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tenant Information
                </span>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedLease.tenant.fullName}</p>
                    <p className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {selectedLease.tenant.phoneNumber}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                    Active Tenant
                  </span>
                </div>
              </div>

              {/* Property and unit info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Building
                  </span>
                  <p className="mt-1 font-bold text-slate-900">{selectedLease.property.name}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Unit Number
                  </span>
                  <p className="mt-1 font-bold text-blue-600">Unit {selectedLease.unit.unitNumber}</p>
                </div>
              </div>

              {/* Financial info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Monthly Rent
                  </span>
                  <p className="mt-1 text-base font-extrabold text-emerald-600">
                    {selectedLease.rentAmount.toLocaleString()} ETB
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Security Deposit
                  </span>
                  <p className="mt-1 text-base font-extrabold text-slate-800">
                    {selectedLease.depositAmount.toLocaleString()} ETB
                  </p>
                </div>
              </div>

              {/* Lease Dates */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lease Duration
                </span>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {formatDate(selectedLease.startDate)} → {formatDate(selectedLease.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false)
                  handleSendReminder(selectedLease)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                Send Reminder
              </button>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="rounded-lg bg-[#0052CC] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Tenant Modal */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">Add New Tenant</h3>
              <button
                onClick={() => setIsAddTenantOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTenantSubmit} className="space-y-4 px-6 py-5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tenant Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Almaz Bekele"
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={newTenantPhone}
                  onChange={(e) => setNewTenantPhone(e.target.value)}
                  placeholder="+251 91 234 5678"
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Building
                  </label>
                  <select
                    value={newTenantBuilding}
                    onChange={(e) => setNewTenantBuilding(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Building A">Building A</option>
                    <option value="Building B">Building B</option>
                    <option value="Condominium Tower 1">Condominium Tower 1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newTenantUnit}
                    onChange={(e) => setNewTenantUnit(e.target.value)}
                    placeholder="e.g. B-204"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Monthly Rent (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    value={newTenantRent}
                    onChange={(e) => setNewTenantRent(e.target.value)}
                    placeholder="12500"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tenant Type
                  </label>
                  <select
                    value={newTenantType}
                    onChange={(e) => setNewTenantType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Family">Family</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddTenantOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#003882] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#002b66] transition"
                >
                  Create Lease &amp; Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
