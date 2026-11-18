import { useState } from 'react'
import { Download, Lock, Search, Loader2, AlertCircle, ScrollText } from 'lucide-react'
import { useGetPlatformAuditLogsQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { downloadReport } from '../../api/reports'

const ENTITY_TYPES = ['All', 'Agreement', 'Payment', 'Invoice', 'Property', 'User', 'Complaint'] as const

const ACTION_BADGE: Record<string, string> = {
  CREATED: 'bg-emerald-50 text-emerald-700',
  UPDATED: 'bg-blue-50 text-blue-700',
  DELETED: 'bg-rose-50 text-rose-700',
  SIGNED: 'bg-violet-50 text-violet-700',
  PAYMENT_CONFIRMED: 'bg-emerald-50 text-emerald-700',
  PAYMENT_REJECTED: 'bg-rose-50 text-rose-700',
  RECORD_VIEWED: 'bg-slate-100 text-slate-600',
  USER_SUSPENDED: 'bg-rose-50 text-rose-700',
}

export default function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [entityType, setEntityType] = useState<(typeof ENTITY_TYPES)[number]>('All')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useGetPlatformAuditLogsQuery({
    page,
    limit: 25,
    entityType: entityType === 'All' ? undefined : entityType,
  })

  async function exportAuditTrail() {
    setExportError(null)
    setExporting(true)
    try {
      await downloadReport({
        path: '/reports/audit-logs',
        query: { format: 'xlsx', entityType: entityType === 'All' ? undefined : entityType },
      })
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : 'Could not export the audit trail.')
    } finally {
      setExporting(false)
    }
  }

  const logs = data?.docs ?? []
  const needle = searchQuery.trim().toLowerCase()
  const filtered = needle
    ? logs.filter((log) =>
        [log.action, log.entityType, log.entityId ?? '', log.actor?.fullName ?? '', log.ipAddress ?? ''].some(
          (field) => field.toLowerCase().includes(needle),
        ),
      )
    : logs
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Immutable Audit Trail &amp; Logs</h1>
          <p className="text-xs text-slate-500">
            Append-only logging of every state change, for legal, fraud and financial audits (FR-ADM-04)
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <button
            onClick={exportAuditTrail}
            disabled={exporting || !data?.total}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : <Download className="h-4 w-4 text-slate-500" />}
            {exporting ? 'Exporting…' : 'Export Certified Log File'}
          </button>
          {exportError && <p className="mt-1 max-w-xs text-[11px] text-rose-600">{exportError}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold">Append-Only Compliance Audit Trail</p>
            <p className="text-[11px] text-slate-400">
              {data?.total ?? 0} recorded events · entries cannot be edited or removed
            </p>
          </div>
        </div>
        <span className="rounded-md border border-emerald-800 bg-emerald-950/80 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-400">
          {isFetching ? 'SYNCING…' : 'LIVE'}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search this page by action, actor, entity ID or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ENTITY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setEntityType(type)
                setPage(1)
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                entityType === type
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Could not load the audit trail</p>
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading audit trail…
          </div>
        ) : !logs.length ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ScrollText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">No audit events yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Every agreement signature, payment, invoice change and account action is written here as it
              happens. Nothing has been recorded for this filter.
            </p>
          </div>
        ) : !filtered.length ? (
          <div className="px-6 py-14 text-center text-xs font-medium text-slate-500">
            No event on this page matches your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Entity</th>
                  <th className="px-4 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{log.actor?.fullName ?? 'System'}</div>
                      <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ACTION_BADGE[log.action] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-semibold text-slate-800">{log.entityType}</div>
                      {log.entityId && <div className="max-w-[16rem] truncate font-mono text-[10px] text-slate-400">{log.entityId}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <strong className="text-slate-800">{data?.page ?? 1}</strong> of {totalPages} · {data?.total ?? 0} events
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}