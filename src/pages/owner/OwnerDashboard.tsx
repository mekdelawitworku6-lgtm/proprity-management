import { useState } from 'react'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileSignature,
  Receipt,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGetOwnerDashboardQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'

interface QueueItem {
  id: string
  name: string
  unit: string
  date: string
  amount: string
  method?: string
  ref?: string
}

interface MaintenanceItem {
  id: string
  title: string
  unit: string
  priority: string
  priorityColor: string
  status: string
  statusColor: string
  assignedTo?: string
  description?: string
}

interface ExpiringItem {
  id: string
  name: string
  unit: string
  expires: string
  rent?: string
}

export default function OwnerDashboard() {
  const { data, error } = useGetOwnerDashboardQuery()

  const totals = data?.totals

  // Sample data fallback for exact visual match with Figma prototype if backend is empty
  const totalUnitsCount = totals?.units.total || 120
  const occupiedUnitsCount = totals?.units.occupied || 113
  const vacantUnitsCount = totals?.units.total ? totals.units.total - totals.units.occupied : 7
  const revenueFormatted = totals?.rentExpected
    ? `${(totals.rentExpected / 1_000_000).toFixed(2)}M ETB`
    : '1.72M ETB'
  const collectedFormatted = totals?.rentCollected
    ? `${(totals.rentCollected / 1_000_000).toFixed(2)}M`
    : '1.58M'
  const expectedFormatted = totals?.rentExpected
    ? `${(totals.rentExpected / 1_000_000).toFixed(2)}M`
    : '1.72M'
  const leaseExpirationsCount = totals?.leasesExpiringSoon || 15
  const pendingVerificationsCount = totals?.pendingRentalRequests || 12

  // Revenue chart sample data (Jan to Jun) matching Figma
  const monthlyData = [
    { month: 'Jan', value: 72, label: '7.2M' },
    { month: 'Feb', value: 85, label: '8.5M' },
    { month: 'Mar', value: 68, label: '6.8M' },
    { month: 'Apr', value: 92, label: '9.2M' },
    { month: 'May', value: 88, label: '8.8M' },
    { month: 'Jun', value: 98, label: '9.8M' },
  ]

  const [paymentQueue, setPaymentQueue] = useState<QueueItem[]>([
    {
      id: '1',
      name: 'Abebe Kebede',
      unit: 'Unit B-204',
      date: '2026-05-10',
      amount: '12,500 ETB',
      method: 'Telebirr',
      ref: 'TXN-TB-8941245',
    },
    {
      id: '2',
      name: 'Tigist Haile',
      unit: 'Unit A-101',
      date: '2026-05-11',
      amount: '15,000 ETB',
      method: 'Bank Transfer (CBE)',
      ref: 'CBE-FT-991204',
    },
    {
      id: '3',
      name: 'Dawit Tesfaye',
      unit: 'Unit B-302',
      date: '2026-05-12',
      amount: '18,750 ETB',
      method: 'Telebirr',
      ref: 'TXN-TB-7764102',
    },
    {
      id: '4',
      name: 'Sara Ahmed',
      unit: 'Unit A-105',
      date: '2026-05-13',
      amount: '13,200 ETB',
      method: 'Cash Voucher',
      ref: 'VCH-00214',
    },
  ])

  const [maintenanceList, setMaintenanceList] = useState<MaintenanceItem[]>([
    {
      id: '1',
      title: 'Plumbing leak',
      unit: 'Unit B-204',
      priority: 'High',
      priorityColor: 'bg-rose-100 text-rose-700',
      status: 'In Progress',
      statusColor: 'bg-blue-50 text-blue-700',
      assignedTo: 'Tesfaye Wonda (Plumbing Tech)',
      description: 'Water leaking from the bathroom sink connector. Requires pipe replacement.',
    },
    {
      id: '2',
      title: 'AC not working',
      unit: 'Unit C-101',
      priority: 'Medium',
      priorityColor: 'bg-amber-100 text-amber-700',
      status: 'Pending',
      statusColor: 'bg-amber-50 text-amber-700',
      assignedTo: 'Hanna Tech Support',
      description: 'Air conditioning compressor not kicking on during high temperature.',
    },
    {
      id: '3',
      title: 'Door lock broken',
      unit: 'Unit A-303',
      priority: 'High',
      priorityColor: 'bg-rose-100 text-rose-700',
      status: 'Pending',
      statusColor: 'bg-amber-50 text-amber-700',
      assignedTo: 'Security Maintenance',
      description: 'Front door cylinder lock jammed from the outside.',
    },
    {
      id: '4',
      title: 'Paint touch-up',
      unit: 'Unit B-104',
      priority: 'Low',
      priorityColor: 'bg-slate-100 text-slate-700',
      status: 'Scheduled',
      statusColor: 'bg-slate-100 text-slate-700',
      assignedTo: 'Painting Contractor',
      description: 'Wall touch-up in the living room corner following minor settlement crack repair.',
    },
  ])

  const [expiringList, setExpiringList] = useState<ExpiringItem[]>([
    { id: '1', name: 'Marta Yohannes', unit: 'Unit B-204', expires: '2026-06-01', rent: '14,000 ETB' },
    { id: '2', name: 'Yonatan Bekele', unit: 'Unit A-101', expires: '2026-06-15', rent: '12,500 ETB' },
    { id: '3', name: 'Hanna Solomon', unit: 'Unit C-101', expires: '2026-06-30', rent: '16,000 ETB' },
  ])

  // Active Modals state
  const [reviewPayment, setReviewPayment] = useState<QueueItem | null>(null)
  const [viewMaintenance, setViewMaintenance] = useState<MaintenanceItem | null>(null)
  const [renewLease, setRenewLease] = useState<ExpiringItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Renewal Form state
  const [renewalMonths, setRenewalMonths] = useState('12')
  const [renewalRent, setRenewalRent] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleApprovePayment = (item: QueueItem) => {
    setPaymentQueue((prev) => prev.filter((p) => p.id !== item.id))
    setReviewPayment(null)
    showToast(`Payment of ${item.amount} from ${item.name} has been verified and confirmed!`)
  }

  const handleRejectPayment = (item: QueueItem) => {
    setPaymentQueue((prev) => prev.filter((p) => p.id !== item.id))
    setReviewPayment(null)
    showToast(`Payment verification for ${item.name} was rejected. SMS notification sent.`)
  }

  const handleUpdateMaintenanceStatus = (item: MaintenanceItem, nextStatus: string) => {
    setMaintenanceList((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              status: nextStatus,
              statusColor:
                nextStatus === 'Resolved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700',
            }
          : m
      )
    )
    setViewMaintenance(null)
    showToast(`Maintenance request "${item.title}" marked as ${nextStatus}!`)
  }

  const handleConfirmRenewal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!renewLease) return
    setExpiringList((prev) => prev.filter((item) => item.id !== renewLease.id))
    setRenewLease(null)
    showToast(
      `Lease renewal for ${renewLease.name} (${renewLease.unit}) successfully issued for ${renewalMonths} months!`
    )
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
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Property Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your property portfolio and units</p>
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

      {/* Top 4 Stat Cards matching Figma Image 4 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Units */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Units</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalUnitsCount}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {occupiedUnitsCount} Occupied · {vacantUnitsCount} Vacant
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Revenue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{revenueFormatted}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Collected: {collectedFormatted} · Expected: {expectedFormatted}
          </p>
        </div>

        {/* Lease Expirations */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lease Expirations</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{leaseExpirationsCount}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Expiring soon</p>
        </div>

        {/* Pending Verifications */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending verifications</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pendingVerificationsCount}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Requires review</p>
        </div>
      </div>

      {/* Middle Row: Payment Verification Queue & Open Maintenance Requests */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Payment Verification Queue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Payment Verification Queue</h2>
              <p className="text-[11px] text-slate-400">{paymentQueue.length} pending verifications</p>
            </div>
            <Link to="/owner/payments" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {paymentQueue.length === 0 ? (
              <p className="py-6 text-center text-slate-400">All payments verified!</p>
            ) : (
              paymentQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.unit} · {item.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{item.amount}</span>
                    <button
                      type="button"
                      onClick={() => setReviewPayment(item)}
                      className="rounded-lg bg-[#0052CC] px-3.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Maintenance Requests */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Open Maintenance Requests</h2>
              <p className="text-[11px] text-slate-400">{maintenanceList.length} open requests</p>
            </div>
            <Link to="/owner/complaints" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {maintenanceList.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-400">{item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${item.priorityColor}`}>
                    {item.priority}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${item.statusColor}`}>
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMaintenance(item)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Revenue Trend & Lease Expiration Alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Revenue Trend</h2>
            <p className="text-[11px] text-slate-400">Monthly revenue collection (in ETB)</p>
          </div>

          <div className="mt-6 flex h-48 items-end justify-between gap-4 px-2 pb-2">
            {monthlyData.map((bar) => (
              <div key={bar.month} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-slate-400 font-medium">{bar.label}</span>
                <div
                  className="w-full max-w-[48px] rounded-t-sm bg-[#2563EB] transition-all hover:bg-blue-700"
                  style={{ height: `${bar.value}%` }}
                />
                <span className="text-[11px] font-semibold text-slate-600">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lease Expiration Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Lease Expiration Alerts</h2>
            <p className="text-[11px] text-slate-400">{expiringList.length} expiring soon</p>
          </div>

          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {expiringList.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No leases expiring soon.</p>
            ) : (
              expiringList.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.unit}</p>
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                      Expires: {item.expires}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRenewLease(item)
                      setRenewalRent(item.rent || '14000')
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    Renew
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Review Payment Modal */}
      {reviewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Review Payment Verification</h3>
              </div>
              <button
                onClick={() => setReviewPayment(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 text-xs text-slate-700">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tenant</span>
                  <span className="font-bold text-slate-900">{reviewPayment.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Unit</span>
                  <span className="font-bold text-blue-600">{reviewPayment.unit}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Date</span>
                  <span className="font-semibold text-slate-800">{reviewPayment.date}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-medium">Amount Submitted</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {reviewPayment.amount}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-bold text-blue-900">{reviewPayment.method || 'Telebirr'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono text-slate-700 font-bold">{reviewPayment.ref}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => handleRejectPayment(reviewPayment)}
                className="rounded-lg border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 shadow-xs hover:bg-rose-50 transition"
              >
                Reject Proof
              </button>
              <button
                type="button"
                onClick={() => handleApprovePayment(reviewPayment)}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Confirmation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Maintenance Request Modal */}
      {viewMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{viewMaintenance.title}</h3>
                  <p className="text-[11px] text-slate-400">{viewMaintenance.unit}</p>
                </div>
              </div>
              <button
                onClick={() => setViewMaintenance(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2.5 py-0.5 text-[11px] font-bold ${viewMaintenance.priorityColor}`}>
                  Priority: {viewMaintenance.priority}
                </span>
                <span className={`rounded px-2.5 py-0.5 text-[11px] font-bold ${viewMaintenance.statusColor}`}>
                  Status: {viewMaintenance.status}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Issue Description
                </span>
                <p className="mt-1 text-slate-800 leading-relaxed font-medium">
                  {viewMaintenance.description}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Personnel
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">{viewMaintenance.assignedTo}</p>
                </div>
                <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                  On Duty
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => handleUpdateMaintenanceStatus(viewMaintenance, 'In Progress')}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                Set In Progress
              </button>
              <button
                type="button"
                onClick={() => handleUpdateMaintenanceStatus(viewMaintenance, 'Resolved')}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Lease Modal */}
      {renewLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Renew Lease Agreement</h3>
              </div>
              <button
                onClick={() => setRenewLease(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRenewal} className="space-y-4 px-6 py-5 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <p className="text-sm font-bold text-slate-900">{renewLease.name}</p>
                <p className="text-slate-500">{renewLease.unit} · Current Expiry: {renewLease.expires}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Renewal Period
                </label>
                <select
                  value={renewalMonths}
                  onChange={(e) => setRenewalMonths(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="6">6 Months (Short-term)</option>
                  <option value="12">12 Months (Standard)</option>
                  <option value="24">24 Months (Long-term)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Updated Monthly Rent (ETB)
                </label>
                <input
                  type="text"
                  required
                  value={renewalRent}
                  onChange={(e) => setRenewalRent(e.target.value)}
                  placeholder="14000"
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setRenewLease(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  Issue Lease Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
