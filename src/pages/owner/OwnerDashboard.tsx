import { useState } from 'react'
import {
  Building2,
  Wrench,
  ArrowUpRight,
  Plus,
  FileSignature,
  DollarSign,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlatform } from '../../context/PlatformContext'
import { ClassificationSummaries } from '../../components/ClassificationSummaries'
import { CreateMaintenanceModal } from '../../components/modals/CreateMaintenanceModal'
import { EditPropertyModal } from '../../components/modals/EditPropertyModal'

export default function OwnerDashboard() {
  const { properties, complaints, transactions, agreements, addProperty, submitComplaint } = usePlatform()
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false)
  const [isPropModalOpen, setIsPropModalOpen] = useState(false)

  // Calculations
  const totalOccupied = properties.reduce((acc, p) => acc + p.occupiedUnits, 0)
  const totalUnitsCount = properties.reduce((acc, p) => acc + p.totalUnits, 0)
  const occupancyRate = Math.round((totalOccupied / (totalUnitsCount || 1)) * 100)

  const totalExpectedRev = properties.reduce((acc, p) => acc + p.monthlyRevenue, 0)
  const totalCollectedRev = transactions
    .filter((t) => t.status === 'Completed' && t.type === 'Rent')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Property Owner Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Portfolio performance, rent collection, and tenant management overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPropModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus className="h-4 w-4" /> Add Building
          </button>
          <button
            onClick={() => setIsMaintModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2744] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1A365D] transition"
          >
            <Plus className="h-4 w-4" /> New Request
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Buildings Card */}
        <Link
          to="/owner/properties"
          className="group rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">My Buildings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{properties.length}</p>
          <p className="mt-1 flex items-center text-[11px] text-blue-600 font-medium">
            {totalOccupied}/{totalUnitsCount} Units Occupied ({occupancyRate}%) <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </p>
        </Link>

        {/* Rent Collected vs Expected */}
        <Link
          to="/owner/payments"
          className="group rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rent Collected (Mo)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {(totalCollectedRev / 1000).toFixed(1)}K ETB
          </p>
          <p className="mt-1 flex items-center text-[11px] text-emerald-600 font-medium">
            Expected: {(totalExpectedRev / 1000).toFixed(1)}K ETB <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </p>
        </Link>

        {/* Active Agreements */}
        <Link
          to="/owner/agreements"
          className="group rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Digital Agreements</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FileSignature className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{agreements.length}</p>
          <p className="mt-1 flex items-center text-[11px] text-purple-600 font-medium">
            100% Digitally Signed <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </p>
        </Link>

        {/* Complaints / Maintenance */}
        <Link
          to="/owner/complaints"
          className="group rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Complaints & Reports</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{complaints.length}</p>
          <p className="mt-1 flex items-center text-[11px] text-amber-600 font-medium">
            {complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress').length} Active <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </p>
        </Link>
      </div>

      {/* 3 Classification Summaries */}
      <ClassificationSummaries />

      {/* Grid: Recent Agreements & Maintenance Reports */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Recent Agreements (6 cols) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Recent Signed Agreements</h2>
            <Link to="/owner/agreements" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {agreements.slice(0, 3).map((agr) => (
              <div key={agr.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{agr.agreementNumber}</span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {agr.status}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-1">{agr.tenantName} · {agr.unitNo}</p>
                  <p className="text-[11px] text-slate-400">{agr.propertyName} · {agr.monthlyRent.toLocaleString()} ETB/mo</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{agr.signedByTenantAt.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints / Maintenance (6 cols) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Tenant Complaints & Maintenance</h2>
            <Link to="/owner/complaints" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {complaints.slice(0, 3).map((cmp) => (
              <div key={cmp.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{cmp.code}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        cmp.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : cmp.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cmp.priority}
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {cmp.status}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-1">{cmp.issueSummary}</p>
                  <p className="text-[11px] text-slate-400">{cmp.propertyName} · {cmp.unitNumber} ({cmp.tenantName})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateMaintenanceModal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        onSubmit={(req) => {
          submitComplaint({
            propertyId: 'prop-1',
            propertyName: 'Building A - Bole Plaza',
            unitNumber: req.unitNumber,
            tenantId: 'user-tenant-1',
            tenantName: 'Resident Tenant',
            category: req.category,
            issueSummary: req.issueSummary,
            description: req.description,
            priority: req.priority,
            assignedTechnician: req.assignedTechnician,
          })
          setIsMaintModalOpen(false)
        }}
      />
      <EditPropertyModal
        isOpen={isPropModalOpen}
        onClose={() => setIsPropModalOpen(false)}
        onSave={(prop) => {
          addProperty(prop)
          setIsPropModalOpen(false)
        }}
      />
    </div>
  )
}
