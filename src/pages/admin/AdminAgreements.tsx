import { useState } from 'react'
import { Search, Download, Eye, X, CheckCircle2 } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { RentalAgreement } from '../../types'

export default function AdminAgreements() {
  const { agreements } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgr, setSelectedAgr] = useState<RentalAgreement | null>(null)

  const filteredAgreements = agreements.filter(
    (a) =>
      a.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            National Digital Agreement Audit Registry
          </h1>
          <p className="text-xs text-slate-500">
            Immutable blockchain-grade record of all digitally executed tenancy agreements (FR-ADM-04)
          </p>
        </div>

        <button
          onClick={() => alert('Exporting full national agreement audit manifest (CSV)...')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Download className="h-4 w-4 text-slate-500" /> Export Audit Archive
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by agreement code, landlord, tenant, property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Agreement ID</th>
                <th className="px-4 py-3.5">Property & Unit</th>
                <th className="px-4 py-3.5">Landlord (Owner)</th>
                <th className="px-4 py-3.5">Tenant (Customer)</th>
                <th className="px-4 py-3.5">Rent (ETB)</th>
                <th className="px-4 py-3.5">Digital Signature & Timestamp</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgreements.map((agr) => (
                <tr key={agr.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {agr.agreementNumber}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{agr.propertyName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{agr.unitNo}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {agr.ownerName}
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div>{agr.tenantName}</div>
                    <div className="text-[10px] text-slate-400">{agr.tenantPhone}</div>
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-900">
                    {agr.monthlyRent.toLocaleString()} ETB
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    <div className="font-mono text-[10px] text-slate-600 truncate max-w-[140px]">
                      {agr.digitalSignatureHash}
                    </div>
                    <div className="text-[10px] text-slate-400">{agr.signedByTenantAt}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {agr.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedAgr(agr)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
                    >
                      <Eye className="h-3 w-3" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View */}
      {selectedAgr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">{selectedAgr.agreementNumber}</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Audited Tenancy Agreement
                </h2>
              </div>
              <button
                onClick={() => setSelectedAgr(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                <p><strong>Property:</strong> {selectedAgr.propertyName} ({selectedAgr.unitNo})</p>
                <p><strong>Owner:</strong> {selectedAgr.ownerName}</p>
                <p><strong>Tenant:</strong> {selectedAgr.tenantName} ({selectedAgr.tenantPhone})</p>
                <p><strong>Monthly Rent:</strong> {selectedAgr.monthlyRent.toLocaleString()} ETB</p>
                <p><strong>Period:</strong> {selectedAgr.leaseStart} to {selectedAgr.leaseEnd}</p>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Digital Certificate Valid
                </div>
                <p className="font-mono text-[10px] text-slate-600">
                  Hash: {selectedAgr.digitalSignatureHash}
                </p>
                <p className="text-[10px] text-slate-500">
                  Timestamp: {selectedAgr.signedByTenantAt}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedAgr(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
