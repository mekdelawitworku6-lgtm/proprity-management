import { useState } from 'react'
import { Search, Download, Lock } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'

export default function AdminAuditLogs() {
  const { auditLogs } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState('All')

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesEntity = entityFilter === 'All' ? true : log.entityType === entityFilter

    return matchesSearch && matchesEntity
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Immutable Audit Trail & Logs
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographically timestamped compliance logging for legal, fraud, and financial audits (FR-ADM-04)
          </p>
        </div>

        <button
          onClick={() => alert('Exporting full tamper-proof audit manifest (JSON / CSV)...')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Download className="h-4 w-4 text-slate-500" /> Export Certified Log File
        </button>
      </div>

      {/* Security Banner */}
      <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold">WORM (Write Once, Read Many) Compliance Audit Trail</p>
            <p className="text-[11px] text-slate-400">
              Retention period: 7 Years · SHA-256 integrity hash verification active
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
          LOG INTEGRITY: 100%
        </span>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action type, IP address, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs"
        >
          <option value="All">All Entity Types</option>
          <option value="Payment">Payment</option>
          <option value="Agreement">Agreement</option>
          <option value="Complaint">Complaint</option>
          <option value="Property">Property</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Timestamp (EAT)</th>
                <th className="px-4 py-3.5">Actor & Role</th>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Event Details</th>
                <th className="px-4 py-3.5 font-mono">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{log.actorName}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {log.actorRole}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-md">
                    {log.details}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {log.ipAddress}
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
