import { useState } from 'react'
import { Search, Download, ShieldCheck, CheckCircle2, Eye, X } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { RentalAgreement } from '../../types'

export default function OwnerAgreements() {
  const { agreements } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgreement, setSelectedAgreement] = useState<RentalAgreement | null>(null)

  const filteredAgreements = agreements.filter(
    (a) =>
      a.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.unitNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Digital Rental Agreements</h1>
          <p className="text-xs text-slate-500">
            Immutable, digitally signed agreements generated upon tenant onboarding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-4 w-4" /> Legally Verified Records
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by agreement code, tenant name, or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Agreements List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAgreements.map((agr) => (
          <div
            key={agr.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {agr.agreementNumber}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="h-3 w-3" /> {agr.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">{agr.tenantName}</h3>
                <p className="text-xs text-slate-500">{agr.propertyName} · {agr.unitNo}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="font-bold text-slate-900">{agr.monthlyRent.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-semibold text-slate-700">{agr.securityDeposit.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Term:</span>
                  <span className="font-medium text-slate-700">{agr.leaseStart} to {agr.leaseEnd}</span>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  SHA-256 Hash: {agr.digitalSignatureHash}
                </p>
                <p className="text-[10px] text-slate-400">
                  Signed: {agr.signedByTenantAt}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedAgreement(agr)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-3.5 w-3.5" /> View Agreement
              </button>

              <button
                onClick={() => alert(`Downloading signed copy of ${agr.agreementNumber} (PDF)`)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement View Modal */}
      {selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {selectedAgreement.agreementNumber}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Residential Tenancy Agreement
                </h2>
                <p className="text-xs text-slate-500">
                  Digitally executed under Federal Democratic Republic of Ethiopia Property Directives
                </p>
              </div>
              <button
                onClick={() => setSelectedAgreement(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Property & Unit</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedAgreement.propertyName}</p>
                  <p className="text-slate-600">{selectedAgreement.unitNo}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Landlord / Owner</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedAgreement.ownerName}</p>
                  <p className="text-slate-600">Bole Plaza Real Estate LLC</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Tenant</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedAgreement.tenantName}</p>
                  <p className="text-slate-600">{selectedAgreement.tenantPhone}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Financial Terms</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedAgreement.monthlyRent.toLocaleString()} ETB / month</p>
                  <p className="text-slate-600">Deposit: {selectedAgreement.securityDeposit.toLocaleString()} ETB</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Standard Tenancy Clauses</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedAgreement.terms} Both parties agree to utilize the official Telebirr & CBE digital payment gateways for all recurring rental payments. Maintenance requests shall be filed directly through the tenant portal.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Digital Signature Verification
                </div>
                <p className="font-mono text-[11px] text-slate-600">
                  Immutable Cryptographic Hash: {selectedAgreement.digitalSignatureHash}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tenant Signed Timestamp: {selectedAgreement.signedByTenantAt}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedAgreement(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Exporting certified agreement PDF...')
                  setSelectedAgreement(null)
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Download Official Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
