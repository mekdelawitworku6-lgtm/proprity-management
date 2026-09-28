import { useState } from 'react'
import { Plus, Search, CheckCircle, ArrowUpRight } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { ComplaintReport } from '../../types'
import { ClassificationSummaries } from '../../components/ClassificationSummaries'
import { CreateMaintenanceModal } from '../../components/modals/CreateMaintenanceModal'

export default function OwnerComplaints() {
  const { complaints, resolveComplaint, escalateComplaint, submitComplaint } = usePlatform()
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'In Progress' | 'Resolved' | 'Escalated'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintReport | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [escalationReason, setEscalationReason] = useState('')

  const totalCount = complaints.length
  const openCount = complaints.filter((c) => c.status === 'Open').length
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length
  const escalatedCount = complaints.filter((c) => c.status === 'Escalated to Admin').length

  const filteredComplaints = complaints.filter((c) => {
    let matchesTab = true
    if (activeTab === 'Open') matchesTab = c.status === 'Open'
    else if (activeTab === 'In Progress') matchesTab = c.status === 'In Progress'
    else if (activeTab === 'Resolved') matchesTab = c.status === 'Resolved'
    else if (activeTab === 'Escalated') matchesTab = c.status === 'Escalated to Admin'

    const matchesCategory =
      selectedCategory === 'All Categories' ? true : c.category === selectedCategory

    const matchesSearch =
      c.issueSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesCategory && matchesSearch
  })

  const getPriorityBadge = (priority: ComplaintReport['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-700 font-semibold'
      case 'High':
        return 'bg-amber-100 text-amber-700 font-semibold'
      case 'Medium':
        return 'bg-orange-100 text-orange-700 font-semibold'
      case 'Low':
        return 'bg-slate-100 text-slate-700 font-semibold'
    }
  }

  const getStatusBadge = (status: ComplaintReport['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-slate-100 text-slate-700 border border-slate-200'
      case 'In Progress':
        return 'bg-blue-50 text-blue-600 border border-blue-200'
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
      case 'Escalated to Admin':
        return 'bg-rose-50 text-rose-600 border border-rose-200 font-bold'
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Maintenance & Complaints Management
          </h1>
          <p className="text-xs text-slate-500">
            Handle tenant issues, assign repairs, or escalate unresolved disputes to Admin
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E40AF] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Request
        </button>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Reports</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Open & In Progress</span>
          <p className="mt-1.5 text-2xl font-bold text-blue-600">{openCount + inProgressCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Resolved</span>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">{resolvedCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Escalated to Admin</span>
          <p className="mt-1.5 text-2xl font-bold text-rose-600">{escalatedCount}</p>
        </div>
      </div>

      {/* 3 Classification Summaries */}
      <ClassificationSummaries />

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search complaints by unit, tenant, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="All Categories">All Categories</option>
          <option value="Plumbing">Plumbing</option>
          <option value="HVAC">HVAC</option>
          <option value="Electrical">Electrical</option>
          <option value="Security">Security</option>
          <option value="Carpentry">Carpentry</option>
          <option value="Lease Dispute">Lease Dispute</option>
          <option value="General">General</option>
        </select>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {['All', 'Open', 'In Progress', 'Resolved', 'Escalated'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            No complaints found matching current criteria.
          </div>
        ) : (
          filteredComplaints.map((cmp) => (
            <div
              key={cmp.id}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{cmp.code}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] ${getPriorityBadge(cmp.priority)}`}>
                      {cmp.priority}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(cmp.status)}`}>
                      {cmp.status}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {cmp.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{cmp.issueSummary}</h3>
                  <p className="text-xs text-slate-500">{cmp.description}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span>
                      {cmp.propertyName} • {cmp.unitNumber} • {cmp.tenantName}
                    </span>
                    <span>•</span>
                    <span>Submitted: {cmp.submittedAt}</span>
                    {cmp.assignedTechnician && (
                      <>
                        <span>•</span>
                        <span>
                          Assigned to: <strong className="text-blue-600">{cmp.assignedTechnician}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {cmp.ownerNotes && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100">
                      <strong>Owner Note:</strong> {cmp.ownerNotes}
                    </div>
                  )}

                  {cmp.adminRuling && (
                    <div className="mt-2 rounded-lg bg-purple-50 p-2 text-xs text-purple-800 border border-purple-100">
                      <strong>Admin Formal Ruling:</strong> {cmp.adminRuling}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {cmp.status !== 'Resolved' && (
                    <button
                      onClick={() => setSelectedComplaint(cmp)}
                      className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal (Resolve or Escalate) */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div>
              <span className="font-mono text-xs font-bold text-blue-700">{selectedComplaint.code}</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Resolve or Escalate Complaint
              </h2>
              <p className="text-xs text-slate-500">{selectedComplaint.issueSummary}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes (if resolving)
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of fix, technician work order, or completion notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Escalation Reason (if escalating to Possible Tech Admin)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this dispute or structural issue requires regulatory arbitration"
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    escalateComplaint(selectedComplaint.id, escalationReason)
                    setSelectedComplaint(null)
                  }}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 inline mr-1" />
                  Escalate to Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resolveComplaint(selectedComplaint.id, resolutionNotes)
                    setSelectedComplaint(null)
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      <CreateMaintenanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
