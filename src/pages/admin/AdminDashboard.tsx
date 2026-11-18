import { useState } from 'react'
import {
  Building2,
  Receipt,
  Users,
  AlertTriangle,
  Percent,
  CheckCircle2,
  ShieldAlert,
  MapPin,
  Wrench,
  X,
  FileCheck,
} from 'lucide-react'
import { useGetAdminDashboardQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { formatMoney } from '../../components/payments/paymentDisplay'
import { downloadReport } from '../../api/reports'
import type { AdminDashboard as AdminDashboardData } from '../../types/api'

interface GeographicItem {
  region: string
  buildings: string
  rate: string
  status: 'high' | 'medium'
  activeTenants: string
  disputes: number
}

const GEOGRAPHIC_DATA: GeographicItem[] = [
  { region: 'Addis Ababa', buildings: '15,200 buildings', rate: '94.2% collection rate', status: 'high', activeTenants: '42,500', disputes: 12 },
  { region: 'Oromia', buildings: '11,500 buildings', rate: '86.8% collection rate', status: 'medium', activeTenants: '28,300', disputes: 8 },
  { region: 'Amhara', buildings: '7,800 buildings', rate: '82.5% collection rate', status: 'medium', activeTenants: '19,100', disputes: 5 },
  { region: 'Tigray', buildings: '4,200 buildings', rate: '79.3% collection rate', status: 'medium', activeTenants: '9,800', disputes: 4 },
  { region: 'Southern Nations', buildings: '5,600 buildings', rate: '81.1% collection rate', status: 'medium', activeTenants: '14,200', disputes: 6 },
  { region: 'Somali', buildings: '2,100 buildings', rate: '76.4% collection rate', status: 'medium', activeTenants: '5,400', disputes: 2 },
  { region: 'Dire Dawa', buildings: '1,145 buildings', rate: '85.2% collection rate', status: 'high', activeTenants: '3,100', disputes: 1 },
]

export default function AdminDashboard() {
  const [month] = useState('2026-05')
  const { data, error, refetch } = useGetAdminDashboardQuery({ month })

  // Active Modals state
  const [activeReviewModal, setActiveReviewModal] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<GeographicItem | null>(null)
  const [maintenanceFilterModal, setMaintenanceFilterModal] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Compliance queue state
  const [criticalIssues, setCriticalIssues] = useState([
    { id: '1', building: 'Bole Olympia Tower', issue: 'Fire safety certificate renewal overdue (30 days)', severity: 'Critical', woreda: 'Bole Woreda 03' },
    { id: '2', building: 'Kazanchis Business Plaza', issue: 'Unverified tenant digital contracts detected (5 units)', severity: 'Critical', woreda: 'Kirkos Woreda 08' },
    { id: '3', building: 'Mexico Commercial Hub', issue: 'Digital tax withholding mismatch on rental revenue', severity: 'High', woreda: 'Lideta Woreda 02' },
  ])

  const [auditFlags, setAuditFlags] = useState([
    { id: '1', ref: 'AUD-2026-091', title: 'Sudden rent fee deviation flagged (+45% above index)', building: 'Piassa Condominium B' },
    { id: '2', ref: 'AUD-2026-092', title: 'Double registration attempt on unit 304', building: 'Sarbet Heights' },
    { id: '3', ref: 'AUD-2026-093', title: 'Payment settlement channel delayed > 72 hours', building: 'Gotera Residence' },
  ])

  const [complianceReviews, setComplianceReviews] = useState([
    { id: '1', owner: 'Addis Property Management LLC', type: 'Owner License Verification', submitted: '2026-05-12' },
    { id: '2', owner: 'Ethio Sky Real Estate', type: 'Condominium Portfolio Audit', submitted: '2026-05-13' },
    { id: '3', owner: 'Nile Commercial Properties', type: 'Telecom Payment Gateway Connect', submitted: '2026-05-14' },
  ])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleResolveCritical = (id: string, name: string) => {
    setCriticalIssues((prev) => prev.filter((i) => i.id !== id))
    showToast(`Critical issue for "${name}" has been marked as reviewed & resolved.`)
  }

  const handleAcknowledgeAudit = (id: string, ref: string) => {
    setAuditFlags((prev) => prev.filter((i) => i.id !== id))
    showToast(`Audit flag ${ref} acknowledged and dispatched to regional inspection team.`)
  }

  const handleApproveCompliance = (id: string, owner: string) => {
    setComplianceReviews((prev) => prev.filter((i) => i.id !== id))
    showToast(`Compliance approval granted for ${owner}.`)
  }

  const d: AdminDashboardData | undefined = data

  const totalBuildings = d?.properties ? d.properties.toLocaleString() : '47,545'
  const collectionRate = d?.units.occupancyRate ? `${d.units.occupancyRate.toFixed(1)}%` : '88.4%'
  const digitalTransactions = d?.payments.telebirrVolume ? formatMoney(d.payments.telebirrVolume) : '95,000 ETB'
  const activeUsersCount = d?.users ? (d.users.owners + d.users.tenants + d.users.managers).toLocaleString() : '12,847'

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
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Government Administration Portal
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          National Digital Building &amp; Condominium Platform Sample Proto
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Could not load the dashboard</p>
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

      {/* Top 4 Stat Cards matching Figma Image 3 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registered Buildings */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Registered Buildings</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalBuildings}</p>
        </div>

        {/* Payment Collection Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Payment Collection Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{collectionRate}</p>
        </div>

        {/* Monthly Digital Transactions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Digital Transactions</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{digitalTransactions}</p>
        </div>

        {/* Active Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Users</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeUsersCount}</p>
        </div>
      </div>

      {/* Middle Row (3 cards): Geographic Distribution, Compliance & Alerts, Maintenance Resolution Rate */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Geographic Distribution (5 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">
              Geographic Distribution
            </h2>
            <span className="text-[10px] font-medium text-slate-400">Click region to review</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            {GEOGRAPHIC_DATA.map((item) => (
              <button
                key={item.region}
                type="button"
                onClick={() => setSelectedRegion(item)}
                className="group text-left border-b border-slate-100 pb-2 transition hover:bg-slate-50/80 p-1.5 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {item.region}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.status === 'high' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.buildings}</p>
                <p className="text-[10px] text-slate-500 font-medium">{item.rate}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Compliance & Alerts (4 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">
              Compliance &amp; Alerts
            </h2>
            <span className="text-[10px] font-medium text-slate-400">Review Queue</span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveReviewModal('critical')}
              className="w-full rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex items-center justify-between text-left hover:bg-rose-100/60 transition"
            >
              <div>
                <span className="font-bold text-rose-900">Buildings with Critical Issues</span>
                <p className="text-[10px] text-rose-700/80 mt-0.5">Click to view &amp; resolve</p>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500 text-[11px] font-bold text-white shadow-xs">
                {criticalIssues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReviewModal('audit')}
              className="w-full rounded-xl border border-amber-100 bg-amber-50/50 p-3 flex items-center justify-between text-left hover:bg-amber-100/60 transition"
            >
              <div>
                <span className="font-bold text-amber-900">New Audit Flags</span>
                <p className="text-[10px] text-amber-700/80 mt-0.5">Click to review flags</p>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-[11px] font-bold text-white shadow-xs">
                {auditFlags.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReviewModal('compliance')}
              className="w-full rounded-xl border border-amber-100 bg-amber-50/50 p-3 flex items-center justify-between text-left hover:bg-amber-100/60 transition"
            >
              <div>
                <span className="font-bold text-amber-900">Pending Compliance Reviews</span>
                <p className="text-[10px] text-amber-700/80 mt-0.5">Click to process reviews</p>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-[11px] font-bold text-white shadow-xs">
                {complianceReviews.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReviewModal('sanctions')}
              className="w-full rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex items-center justify-between text-left hover:bg-blue-100/60 transition"
            >
              <div>
                <span className="font-bold text-blue-900">Sanctioned Inspections</span>
                <p className="text-[10px] text-blue-700/80 mt-0.5">View active sanctions</p>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500 text-[11px] font-bold text-white shadow-xs">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Maintenance Resolution Rate Gauge (3 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">
              Maintenance Resolution Rate
            </h2>
            <button
              type="button"
              onClick={() => setMaintenanceFilterModal('all')}
              className="text-[10px] font-semibold text-blue-600 hover:underline"
            >
              View breakdown
            </button>
          </div>

          <div
            onClick={() => setMaintenanceFilterModal('all')}
            className="my-4 flex flex-col items-center justify-center cursor-pointer group"
          >
            {/* Circular Gauge */}
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-50/30 group-hover:scale-105 transition">
              <span className="text-xl font-black text-slate-900">87.5%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Click to view resolution logs</p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
            <button
              type="button"
              onClick={() => setMaintenanceFilterModal('resolved')}
              className="rounded-lg p-1 hover:bg-slate-50 transition"
            >
              <p className="text-sm font-bold text-emerald-600">245</p>
              <p className="text-[10px] text-slate-400">Resolved</p>
            </button>
            <button
              type="button"
              onClick={() => setMaintenanceFilterModal('pending')}
              className="rounded-lg p-1 hover:bg-slate-50 transition"
            >
              <p className="text-sm font-bold text-amber-600">28</p>
              <p className="text-[10px] text-slate-400">Pending</p>
            </button>
            <button
              type="button"
              onClick={() => setMaintenanceFilterModal('escalated')}
              className="rounded-lg p-1 hover:bg-slate-50 transition"
            >
              <p className="text-sm font-bold text-rose-600">8</p>
              <p className="text-[10px] text-slate-400">Escalated</p>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Card: Transaction Volume Trend */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Transaction Volume Trend</h2>
            <p className="text-[11px] text-slate-400">Monthly overview across regions</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Revenue</p>
              <p className="text-sm font-black text-slate-900">95,000 ETB</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Growth</p>
              <p className="text-sm font-black text-emerald-600">+6.7%</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex h-40 items-end justify-between gap-3 px-4 pb-2">
          {[
            { month: 'Nov', val: 40 },
            { month: 'Dec', val: 48 },
            { month: 'Jan', val: 55 },
            { month: 'Feb', val: 62 },
            { month: 'Mar', val: 70 },
            { month: 'Apr', val: 78 },
            { month: 'May', val: 86 },
            { month: 'Jun', val: 95 },
          ].map((pt) => (
            <div key={pt.month} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full max-w-[36px] rounded-t-sm bg-[#0052CC] hover:bg-blue-700 transition"
                style={{ height: `${pt.val}%` }}
              />
              <span className="text-[10px] font-semibold text-slate-500">{pt.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Issues Review Modal */}
      {activeReviewModal === 'critical' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Buildings with Critical Issues</h3>
              </div>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6 text-xs">
              {criticalIssues.length === 0 ? (
                <p className="text-center py-6 text-slate-400">All critical issues have been resolved.</p>
              ) : (
                criticalIssues.map((item) => (
                  <div key={item.id} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{item.building}</span>
                      <span className="rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">{item.issue}</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>{item.woreda}</span>
                      <button
                        type="button"
                        onClick={() => handleResolveCritical(item.id, item.building)}
                        className="rounded-lg bg-[#0052CC] px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                      >
                        Review &amp; Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setActiveReviewModal(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Flags Review Modal */}
      {activeReviewModal === 'audit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">New Audit Flags</h3>
              </div>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6 text-xs">
              {auditFlags.length === 0 ? (
                <p className="text-center py-6 text-slate-400">All audit flags acknowledged.</p>
              ) : (
                auditFlags.map((item) => (
                  <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-800">{item.ref}</span>
                      <span className="text-slate-500 font-semibold">{item.building}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{item.title}</p>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeAudit(item.id, item.ref)}
                        className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition"
                      >
                        Acknowledge &amp; Audit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setActiveReviewModal(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Review Modal */}
      {activeReviewModal === 'compliance' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Pending Compliance Reviews</h3>
              </div>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6 text-xs">
              {complianceReviews.length === 0 ? (
                <p className="text-center py-6 text-slate-400">All compliance requests approved.</p>
              ) : (
                complianceReviews.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.owner}</span>
                      <span className="text-[10px] text-slate-400">{item.submitted}</span>
                    </div>
                    <p className="text-blue-700 font-semibold">{item.type}</p>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleApproveCompliance(item.id, item.owner)}
                        className="rounded-lg bg-emerald-600 px-3.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Grant Compliance Approval
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setActiveReviewModal(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regional Review Modal */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">{selectedRegion.region} Region Review</h3>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Buildings</span>
                  <p className="mt-1 text-base font-extrabold text-slate-900">{selectedRegion.buildings}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Collection Rate</span>
                  <p className="mt-1 text-base font-extrabold text-emerald-600">{selectedRegion.rate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Active Tenants</span>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selectedRegion.activeTenants}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Open Disputes</span>
                  <p className="mt-1 text-sm font-bold text-amber-600">{selectedRegion.disputes} Active</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion(null)
                  downloadReport({ path: '/reports/payments', query: { format: 'xlsx' } })
                    .then(() => showToast('Payments report downloaded.'))
                    .catch((cause: unknown) =>
                      showToast(cause instanceof Error ? cause.message : 'Could not export the report.'),
                    )
                }}
                className="rounded-lg bg-[#0052CC] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                Export Regional Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Performance Breakdown Modal */}
      {maintenanceFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Maintenance Resolution Breakdown</h3>
              </div>
              <button
                onClick={() => setMaintenanceFilterModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6 text-xs">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-900">245 Resolved Requests</p>
                  <p className="text-[10px] text-emerald-700">Average resolution turnaround: 4.2 hours</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-900">28 Pending Requests</p>
                  <p className="text-[10px] text-amber-700">Technicians assigned and on site</p>
                </div>
                <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">28</span>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-900">8 Escalated Disputes</p>
                  <p className="text-[10px] text-rose-700">Requires government tribunal arbitration</p>
                </div>
                <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">8</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setMaintenanceFilterModal(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}