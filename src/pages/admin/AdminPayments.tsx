import { useMemo, useState } from 'react'
import { Search, Download, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useGetPaymentsQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import {
  formatCompactMoney,
  formatDateTime,
  formatMoney,
  formatPeriod,
  isPrepaid,
  matchesPaymentSearch,
  methodBadgeClass,
  methodLabel,
  prepaidSummary,
  providerReference,
  statusBadgeClass,
  statusLabel,
} from '../../components/payments/paymentDisplay'
import { Pagination } from '../../components/Pagination'
import { downloadReport } from '../../api/reports'
import type { PaymentMethod } from '../../types/api'

const PAGE_SIZE = 25

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useGetPaymentsQuery({
    page,
    limit: PAGE_SIZE,
    method: methodFilter === 'ALL' ? undefined : (methodFilter as PaymentMethod),
  })

  const payments = useMemo(() => data?.docs ?? [], [data])

  const filtered = useMemo(
    () => payments.filter((payment) => matchesPaymentSearch(payment, searchQuery)),
    [payments, searchQuery],
  )

  async function exportSettlement() {
    setExportError(null)
    setExporting(true)
    try {
      await downloadReport({ path: '/reports/payments', query: { format: 'xlsx' } })
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : 'Could not export the settlement manifest.')
    } finally {
      setExporting(false)
    }
  }

  const totalVolume = data?.totalConfirmed ?? 0
  const telebirrCount = payments.filter((payment) => payment.method === 'TELEBIRR').length
  const bankCount = payments.filter((payment) => payment.method === 'BANK_TRANSFER').length
  const pendingCount = payments.filter((payment) => payment.status === 'PENDING').length
  const confirmedCount = payments.filter((payment) => payment.status === 'CONFIRMED').length
  const total = data?.total || 1
  const reconciliationRate = Math.round((confirmedCount / total) * 1000) / 10

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Ethio Telecom Payment Confirmation &amp; Reconciliation
          </h1>
          <p className="text-xs text-slate-500">
            Platform-wide oversight of Telebirr and bank rent payments (FR-ADM-05)
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <button
            onClick={exportSettlement}
            disabled={exporting || !data?.total}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : <Download className="h-4 w-4 text-slate-500" />}
            {exporting ? 'Exporting…' : 'Export Settlement Manifest'}
          </button>
          {exportError && <p className="mt-1 max-w-xs text-[11px] text-rose-600">{exportError}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Confirmed Volume</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{formatCompactMoney(totalVolume)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-400">{data?.total ?? 0} payments in scope</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Telebirr Transactions</span>
          <p className="mt-1.5 text-2xl font-bold text-blue-600">{telebirrCount}</p>
          <p className="mt-1 text-[10px] text-slate-400">Instant API gateway sync</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Bank Channel</span>
          <p className="mt-1.5 text-2xl font-bold text-purple-600">{bankCount}</p>
          <p className="mt-1 text-[10px] text-slate-400">Manual confirmation</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Reconciliation</span>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">
            {reconciliationRate}%
            {pendingCount > 0 && (
              <span className="ml-1.5 text-xs font-bold text-amber-600">{pendingCount} pending</span>
            )}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">Confirmed vs total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by transaction reference, tenant, building, or invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs"
        >
          <option value="ALL">All Gateways</option>
          <option value="TELEBIRR">Telebirr (Ethio Telecom)</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Could not load payments</p>
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading payments…
          </div>
        ) : !payments.length ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">No payments on the platform yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Telebirr and bank rent payments will be listed here as owners approve agreements and
              tenants start paying.
            </p>
          </div>
        ) : !filtered.length ? (
          <div className="px-6 py-14 text-center text-xs font-medium text-slate-500">
            No payment matches the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Date &amp; Time</th>
                  <th className="px-4 py-3.5">Payer / Property</th>
                  <th className="px-4 py-3.5">Period</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Gateway</th>
                  <th className="px-4 py-3.5">Provider Ref</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((payment) => {
                  const prepaid = prepaidSummary(payment)
                  return (
                    <tr key={payment.id} className="transition hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{payment.referenceNo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{payment.tenant.fullName}</div>
                        <div className="text-[10px] text-slate-400">{payment.property.name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {payment.invoice ? formatPeriod(payment.invoice.periodStart) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-emerald-600">
                        {formatMoney(payment.amount)}
                        {prepaid && (
                          <div className="mt-0.5 text-[10px] font-semibold text-blue-600">{prepaid}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={methodBadgeClass(payment.method)}>{methodLabel(payment.method)}</span>
                        {isPrepaid(payment) && (
                          <div className="mt-0.5 text-[10px] font-semibold text-blue-600">Prepaid</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-blue-700">
                        {providerReference(payment)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusBadgeClass(payment.status)}>{statusLabel(payment.status)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        isFetching={isFetching}
        onChange={setPage}
      />

      {isFetching && !isLoading && (
        <p className="text-[11px] font-medium text-slate-400">Refreshing payment data…</p>
      )}
    </div>
  )
}