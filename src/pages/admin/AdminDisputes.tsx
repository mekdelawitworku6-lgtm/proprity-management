import React, { useState } from 'react'
import { Scale, Search, CheckCircle } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { ComplaintReport } from '../../types'

export default function AdminDisputes() {
  const { complaints, ruleOnDispute } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDispute, setSelectedDispute] = useState<ComplaintReport | null>(null)
  const [rulingText, setRulingText] = useState('')

  const escalatedDisputes = complaints.filter(
    (c) => c.status === 'Escalated to Admin' || (c.adminRuling && c.adminRuling.length > 0)
  )

  const filteredDisputes = escalatedDisputes.filter(
    (d) =>
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.propertyName || d.buildingName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.issueSummary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleApplyRuling = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDispute || !rulingText) return
    ruleOnDispute(selectedDispute.id, rulingText)
    setSelectedDispute(null)
    setRulingText('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Escalated Dispute Arbitration & Governance
          </h1>
          <p className="text-xs text-slate-500">
            Official regulatory resolution for disputes and complaints escalated beyond the owner level (FR-ADM-03)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            {complaints.filter((c) => c.status === 'Escalated to Admin').length} Pending Hearing
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search escalated cases by code, tenant, or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Disputes Cards List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
            No escalated disputes currently require admin arbitration.
          </div>
        ) : (
          filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {dispute.code}
                    </span>
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {dispute.status}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {dispute.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{dispute.issueSummary}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{dispute.description}</p>
                </div>

                {dispute.status === 'Escalated to Admin' ? (
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute)
                      setRulingText('')
                    }}
                    className="flex items-center gap-1 rounded-xl bg-[#0F2744] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1A365D] transition"
                  >
                    <Scale className="h-3.5 w-3.5" /> Issue Ruling
                  </button>
                ) : (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Ruled & Closed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                <div className="text-slate-500">
                  <span>Tenant: <strong>{dispute.tenantName}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Unit: <strong>{dispute.unitNumber}</strong> ({dispute.propertyName || dispute.buildingName})</span>
                </div>
                <div className="text-slate-400 sm:text-right">
                  Escalated on: {dispute.submittedAt}
                </div>
              </div>

              {dispute.ownerNotes && (
                <div className="rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-100">
                  <strong>Owner Escalation Justification:</strong> {dispute.ownerNotes}
                </div>
              )}

              {dispute.adminRuling && (
                <div className="rounded-xl bg-purple-50/70 p-3 text-xs text-purple-900 border border-purple-100">
                  <strong>Official Possible Tech / Ethio Telecom Ruling:</strong> {dispute.adminRuling}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ruling Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div>
              <span className="font-mono text-xs font-bold text-blue-700">{selectedDispute.code}</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Issue Formal Administrative Dispute Ruling
              </h2>
              <p className="text-xs text-slate-500">{selectedDispute.issueSummary}</p>
            </div>

            <form onSubmit={handleApplyRuling} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Regulatory Finding & Binding Ruling
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="State the binding decision (e.g., landlord refund amount, required building repair schedule, or mediation directive)..."
                  value={rulingText}
                  onChange={(e) => setRulingText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F2744] px-5 py-2 text-xs font-bold text-white hover:bg-[#1A365D]"
                >
                  Publish Binding Ruling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
