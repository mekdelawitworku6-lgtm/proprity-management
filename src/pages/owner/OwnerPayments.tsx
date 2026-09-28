import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { Transaction } from '../../types'

export default function OwnerPayments() {
  const { transactions } = usePlatform()
  const [activeTab, setActiveTab] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [methodFilter, setMethodFilter] = useState('All Methods')

  // Calculations
  const totalRevETB = transactions
    .filter((t) => t.status === 'Completed' && t.type !== 'Refund')
    .reduce((acc, t) => acc + t.amount, 0)

  const completedCount = transactions.filter((t) => t.status === 'Completed').length
  const pendingCount = transactions.filter((t) => t.status === 'Pending').length
  const depositsTotalETB = transactions
    .filter((t) => t.type === 'Deposit')
    .reduce((acc, t) => acc + t.amount, 0)

  const filteredTransactions = transactions.filter((t) => {
    let matchesTab = true
    if (activeTab === 'Rent Payments') matchesTab = t.type === 'Rent'
    else if (activeTab === 'Deposits') matchesTab = t.type === 'Deposit'
    else if (activeTab === 'Fees & Utilities') matchesTab = t.type === 'Utility' || t.type === 'Fee'
    else if (activeTab === 'Refunds') matchesTab = t.type === 'Refund'

    const matchesSearch =
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unitNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'All Status' ? true : t.status === statusFilter
    const matchesMethod = methodFilter === 'All Methods' ? true : t.method === methodFilter

    return matchesTab && matchesSearch && matchesStatus && matchesMethod
  })

  const getTypeBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'Rent':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'Utility':
        return 'bg-purple-50 text-purple-700 border border-purple-200'
      case 'Deposit':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'Fee':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'Refund':
        return 'bg-rose-50 text-rose-700 border border-rose-200'
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payment History & Rent Ledger</h1>
          <p className="text-xs text-slate-500">
            Track rent collections, utility reimbursements, and Telebirr digital payment confirmations
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => alert('Exporting rent statement CSV...')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export Statement
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Rent Collected</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {(totalRevETB / 1000).toFixed(1)}K ETB
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Completed Payments</span>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">{completedCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Pending Clearances</span>
          <p className="mt-1.5 text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Security Deposits Held</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {(depositsTotalETB / 1000).toFixed(1)}K ETB
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payments by tenant, unit, reference code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
          >
            <option value="All Status">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
          >
            <option value="All Methods">All Methods</option>
            <option value="Telebirr">Telebirr</option>
            <option value="CBE Birr">CBE Birr</option>
            <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
            <option value="Awash Bank">Awash Bank</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-semibold">
        {['All', 'Rent Payments', 'Deposits', 'Fees & Utilities', 'Refunds'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab} {tab === 'All' ? `(${transactions.length})` : ''}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Transaction ID</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Tenant</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Ethio Telecom Ref</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {tx.code}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {tx.dateTime}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{tx.tenantName}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {tx.unitNo} • {tx.buildingName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${getTypeBadge(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {tx.category}
                  </td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap">
                    <span
                      className={
                        tx.type === 'Refund'
                          ? 'text-rose-600'
                          : tx.status === 'Pending'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }
                    >
                      {tx.type === 'Refund' ? '-' : '+'}
                      {tx.amount.toLocaleString()} ETB
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {tx.method}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {tx.ethioTelecomConfirmationId || tx.reference}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : tx.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
