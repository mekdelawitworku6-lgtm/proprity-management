import { useState } from 'react'
import { Search, Download, CheckCircle2, Eye, X, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useGetAgreementQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { formatMoney } from '../payments/paymentDisplay'
import { Pagination } from '../Pagination'
import { downloadReport } from '../../api/reports'
import type { AgreementStatus, AgreementSummary } from '../../types/api'

const STATUS_BADGE: Record<AgreementStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PENDING_SIGNATURE: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
  TERMINATED: 'bg-rose-50 text-rose-700',
  RENEWED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
}

const STATUS_LABEL: Record<AgreementStatus, string> = {
  ACTIVE: 'Active',
  PENDING_SIGNATURE: 'Awaiting signature',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
  RENEWED: 'Renewed',
  CANCELLED: 'Cancelled',
}

const KYC_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  NOT_SUBMITTED: 'bg-slate-100 text-slate-600',
}

/** Owner / property label differs by audience, so the caller supplies it. */
export interface AgreementListProps {
  agreements: AgreementSummary[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  /** Shown in each card, e.g. "Landlord" for owners or the tenant for admins. */
  counterpartyLabel: string
  emptyTitle: string
  emptyBody: string
  /** Extra filter chips rendered above the grid. */
  statusFilter: AgreementStatus | 'ALL'
  onStatusChange: (status: AgreementStatus | 'ALL') => void
  page: number
  totalPages: number
  total: number
  isFetching?: boolean
  onPageChange: (page: number) => void
  onRenew?: (agreement: AgreementSummary) => void
}

const STATUS_TABS: { label: string; value: AgreementStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Awaiting signature', value: 'PENDING_SIGNATURE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Terminated', value: 'TERMINATED' },
]

export function AgreementList({
  agreements,
  isLoading,
  error,
  onRetry,
  counterpartyLabel,
  emptyTitle,
  emptyBody,
  statusFilter,
  onStatusChange,
  page,
  totalPages,
  total,
  isFetching,
  onPageChange,
  onRenew,
}: AgreementListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function downloadPdf(id: string, referenceNo: string) {
    setDownloadError(null)
    setDownloadingId(id)
    try {
      await downloadReport({
        path: `/reports/agreement/${id}`,
        query: { format: 'pdf' },
        fileName: `agreement-${referenceNo}.pdf`,
      })
    } catch (cause) {
      setDownloadError(cause instanceof Error ? cause.message : 'Could not download the agreement PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  const visible = agreements.filter((agreement) => {
    const matchesStatus = statusFilter === 'ALL' || agreement.status === statusFilter
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) return matchesStatus
    return (
      matchesStatus &&
      [agreement.referenceNo, agreement.tenant.fullName, agreement.property.name, agreement.unit.unitNumber].some(
        (field) => field.toLowerCase().includes(needle),
      )
    )
  })

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by agreement code, tenant name, property or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-semibold">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Could not load agreements</p>
            <p className="mt-0.5">{toErrorMessage(error)}</p>
            <button
              onClick={onRetry}
              className="mt-2 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-16 text-xs font-medium text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading agreements…
        </div>
      ) : !agreements.length ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800">{emptyTitle}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">{emptyBody}</p>
        </div>
      ) : !visible.length ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center text-xs font-medium text-slate-500">
          No agreement matches the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((agreement) => (
            <div
              key={agreement.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-blue-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-700">
                    {agreement.referenceNo}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      STATUS_BADGE[agreement.status] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> {STATUS_LABEL[agreement.status] ?? agreement.status}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">{agreement.tenant.fullName}</h3>
                    {agreement.tenant.tenantProfile && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          KYC_BADGE[agreement.tenant.tenantProfile.kycStatus] ?? KYC_BADGE.NOT_SUBMITTED
                        }`}
                        title={agreement.tenant.tenantProfile.faydaId ?? undefined}
                      >
                        {agreement.tenant.tenantProfile.kycStatus === 'VERIFIED' ? 'Fayda verified' : `KYC ${agreement.tenant.tenantProfile.kycStatus.toLowerCase()}`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {agreement.property.name} · {agreement.unit.unitNumber}
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Rent:</span>
                    <span className="font-bold text-slate-900">{formatMoney(agreement.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Deposit:</span>
                    <span className="font-semibold text-slate-700">{formatMoney(agreement.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Term:</span>
                    <span className="font-medium text-slate-700">
                      {agreement.startDate.slice(0, 10)} → {agreement.endDate.slice(0, 10)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rent due day:</span>
                    <span className="font-medium text-slate-700">{agreement.paymentDueDay}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setSelectedId(agreement.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-3.5 w-3.5" /> View Agreement
                </button>
                <div className="flex items-center gap-1.5">
                  {onRenew && agreement.status === 'ACTIVE' && (
                    <button
                      onClick={() => onRenew(agreement)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Renew
                    </button>
                  )}
                  <button
                    onClick={() => downloadPdf(agreement.id, agreement.referenceNo)}
                    disabled={downloadingId === agreement.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {downloadingId === agreement.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-slate-400" />
                    )}{' '}
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {downloadError && <p className="text-[11px] text-rose-600">{downloadError}</p>}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        isFetching={isFetching}
        onChange={onPageChange}
      />

      {selectedId && (
        <AgreementDialog
          id={selectedId}
          onClose={() => setSelectedId(null)}
          counterpartyLabel={counterpartyLabel}
          onDownload={downloadPdf}
          isDownloading={downloadingId === selectedId}
        />
      )}
    </>
  )
}

function AgreementDialog({
  id,
  onClose,
  counterpartyLabel,
  onDownload,
  isDownloading,
}: {
  id: string
  onClose: () => void
  counterpartyLabel: string
  onDownload: (id: string, referenceNo: string) => void
  isDownloading: boolean
}) {
  const { data, isLoading, error } = useGetAgreementQuery(id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-700">
              {data?.referenceNo ?? 'Loading…'}
            </span>
            <h2 className="mt-1 text-lg font-black text-slate-900">Residential Tenancy Agreement</h2>
            <p className="text-xs text-slate-500">
              Digitally executed under Federal Democratic Republic of Ethiopia Property Directives
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading signed copy…
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <p>{toErrorMessage(error)}</p>
          </div>
        )}

        {data && (
          <div className="mt-5 space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Property &amp; Unit</span>
                <p className="mt-0.5 font-bold text-slate-900">{data.property.name}</p>
                <p className="text-slate-600">
                  {data.unit.unitNumber} · {data.property.city}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Owner</span>
                <p className="mt-0.5 font-bold text-slate-900">{data.owner.fullName}</p>
                <p className="text-slate-600">{data.owner.phoneNumber}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">{counterpartyLabel}</span>
                <p className="mt-0.5 font-bold text-slate-900">{data.tenant.fullName}</p>
                <p className="text-slate-600">{data.tenant.phoneNumber}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Financial Terms</span>
                <p className="mt-0.5 font-bold text-slate-900">{formatMoney(data.rentAmount)} / month</p>
                <p className="text-slate-600">Deposit: {formatMoney(data.depositAmount)}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-1 font-bold text-slate-900">Agreement Text (as signed)</h4>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/70 p-3 leading-relaxed text-slate-600">
                {data.content}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                data.integrity.valid ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
              }`}
            >
              <div
                className={`mb-1 flex items-center gap-2 font-bold ${
                  data.integrity.valid ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {data.integrity.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                {data.integrity.valid ? 'Integrity Verified' : 'Integrity Check Failed'}
              </div>
              <p className="font-mono text-[11px] text-slate-600">SHA-256: {data.contentHash}</p>
              {data.integrity.reason && (
                <p className="mt-0.5 text-[11px] text-slate-500">{data.integrity.reason}</p>
              )}
              <p className="mt-0.5 text-[11px] text-slate-500">
                Tenant signed: {data.tenantSignedAt ? new Date(data.tenantSignedAt).toLocaleString() : 'not yet signed'}
              </p>
              <p className="text-[11px] text-slate-500">
                Owner signed: {data.ownerSignedAt ? new Date(data.ownerSignedAt).toLocaleString() : 'not yet signed'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={() => data && onDownload(id, data.referenceNo)}
            disabled={!data || isDownloading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isDownloading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isDownloading ? 'Preparing…' : 'Download Official Certificate'}
          </button>
        </div>
      </div>
    </div>
  )
}