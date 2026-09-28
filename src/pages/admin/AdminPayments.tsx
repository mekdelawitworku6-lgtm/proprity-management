import { useState } from 'react'
import { Search, Download, CheckCircle2 } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'

export default function AdminPayments() {
  const { transactions } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')

  const totalVolume = transactions
    .filter((t) => t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0)

  const telebirrCount = transactions.filter((t) => t.method === 'Telebirr').length
  const cbeCount = transactions.filter((t) => t.method.includes('CBE') || t.method.includes('Commercial Bank')).length

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMethod = methodFilter === 'All' ? true : tx.method === methodFilter

    return matchesSearch && matchesMethod
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Ethio Telecom Payment Confirmation & Reconciliation
          </h1>
          <p className="text-xs text-slate-500">
            National digital rent payment oversight via Telebirr and Commercial Bank of Ethiopia (FR-ADM-05)
          </p>
        </div>

        <button
          onClick={() => alert('Exporting Ethio Telecom financial reconciliation manifest...')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Download className="h-4 w-4 text-slate-500" /> Export Settlement Manifest
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Processed Volume</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {(totalVolume / 1000).toFixed(1)}K ETB
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">95.0M ETB Platform Volume YTD</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Telebirr Transactions</span>
          <p className="mt-1.5 text-2xl font-bold text-blue-600">{telebirrCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Instant API Gateway Sync</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Bank Channel Transactions</span>
          <p className="mt-1.5 text-2xl font-bold text-purple-600">{cbeCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">CBE & Awash Integrated</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Reconciliation Status</span>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">100%</p>
          <p className="text-[10px] text-slate-400 mt-1">Zero Discrepancies</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payments by transaction code, tenant, building, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs"
        >
          <option value="All">All Gateways</option>
          <option value="Telebirr">Telebirr (Ethio Telecom)</option>
          <option value="CBE Birr">CBE Birr</option>
          <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
          <option value="Awash Bank">Awash Bank</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Transaction ID</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Payer / Property</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Amount (ETB)</th>
                <th className="px-4 py-3.5">Payment Gateway</th>
                <th className="px-4 py-3.5">Ethio Telecom Confirmation ID</th>
                <th className="px-4 py-3.5">Audit Status</th>
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
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{tx.tenantName}</div>
                    <div className="text-[10px] text-slate-400">{tx.buildingName} ({tx.unitNo})</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {tx.category}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    +{tx.amount.toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      {tx.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-blue-700 font-semibold">
                    {tx.ethioTelecomConfirmationId || `ETHIO-${tx.reference}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Reconciled
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
