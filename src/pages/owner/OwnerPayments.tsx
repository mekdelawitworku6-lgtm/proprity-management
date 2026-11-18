import { useMemo, useState } from 'react'
import { Search, Receipt, AlertCircle, Loader2 } from 'lucide-react'
import { useGetPaymentsQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import {
  formatCompactMoney,
  formatDateTime,
  matchesPaymentSearch,
  providerReference,
} from '../../components/payments/paymentDisplay'
import { Pagination } from '../../components/Pagination'
import type { PaymentMethod, PaymentStatus } from '../../types/api'

const PAGE_SIZE = 25

const CATEGORY_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Rent Payments', value: 'RENT' },
  { label: 'Deposits', value: 'DEPOSIT' },
  { label: 'Fees & Utilities', value: 'UTILITIES' },
  { label: 'Refunds', value: 'REFUNDS' },
]

export default function OwnerPayments() {
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error, refetch } = useGetPaymentsQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as PaymentStatus),
    method: methodFilter === 'ALL' ? undefined : (methodFilter as PaymentMethod),
  })

  const payments = useMemo(() => data?.docs ?? [], [data])

  const filtered = useMemo(
    () => payments.filter((payment) => matchesPaymentSearch(payment, searchQuery)),
    [payments, searchQuery],
  )

  const totalConfirmed = data?.totalConfirmed ?? 0
  const completedCount = payments.filter((payment) => payment.status === 'CONFIRMED').length
  const pendingCount = payments.filter((payment) => payment.status === 'PENDING').length
  const depositCount = payments.filter(
    (payment) => payment.invoice?.type === 'DEPOSIT' && payment.status === 'CONFIRMED',
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Transactions</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track all financial transactions and payment history
        </p>
      </div>

      {/* 4 Stat Cards matching Figma */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Revenue</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCompactMoney(totalConfirmed)} ETB</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Completed</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Pending</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Confirmed Deposits (this page)</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{depositCount}</p>
        </div>
      </div>

      {/* Search & Dropdown Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by tenant, building, invoice or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Search className="pointer-events-none absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="CONFIRMED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Failed</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Methods</option>
          <option value="TELEBIRR">Telebirr</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      {/* Category Tabs Row matching Figma */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategoryTab(tab.value)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeCategoryTab === tab.value
                ? 'bg-blue-50 text-blue-700 shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
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

      {/* Transactions Table matching Figma */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading transactions…
          </div>
        ) : !payments.length ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Receipt className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">No transactions yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Transactions will appear here once rent or deposits are settled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500">
                  <th className="px-4 py-3.5">Transaction ID</th>
                  <th className="px-4 py-3.5">Date &amp; Time</th>
                  <th className="px-4 py-3.5">Tenant</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((payment) => {
                  const invoiceType = payment.invoice?.type
                  const isDeposit = invoiceType === 'DEPOSIT'
                  const typeLabel = isDeposit ? 'Deposit' : invoiceType === 'PENALTY' ? 'Penalty' : 'Rent'
                  const typeBadgeClass = isDeposit
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                  const isPending = payment.status === 'PENDING'

                  return (
                    <tr key={payment.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-600">
                        {payment.referenceNo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{payment.tenant.fullName}</div>
                        <div className="text-[10px] text-slate-400">{payment.property.name}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 text-[11px] font-medium">
                        {isDeposit ? 'Security Deposit' : invoiceType === 'PENALTY' ? 'Late Fee' : 'Rent Payment'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-bold text-emerald-600">
                        +{payment.amount.toLocaleString()} ETB
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 text-[11px]">
                        {payment.method === 'TELEBIRR' ? 'Telebirr' : payment.method === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                        {providerReference(payment) || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {isPending ? (
                          <span className="inline-block rounded-md bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          isFetching={isFetching}
          onChange={setPage}
        />
      </div>
    </div>
  )
}