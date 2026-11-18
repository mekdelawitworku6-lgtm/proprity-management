import { useState } from 'react'
import { Download, Loader2, ShieldCheck } from 'lucide-react'
import { useGetAgreementsQuery } from '../../store/propertyApi'
import { AgreementList } from '../../components/agreements/AgreementList'
import { downloadReport } from '../../api/reports'
import type { AgreementStatus } from '../../types/api'

const PAGE_SIZE = 12

export default function AdminAgreements() {
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  // GET /agreements returns every agreement platform-wide for an admin (FR-ADM-01).
  const { data, isLoading, isFetching, error, refetch } = useGetAgreementsQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  async function exportArchive() {
    setExportError(null)
    setExporting(true)
    try {
      await downloadReport({ path: '/reports/agreements', query: { format: 'xlsx' } })
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : 'Could not export the agreement archive.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            National Digital Agreement Audit Registry
          </h1>
          <p className="text-xs text-slate-500">
            Every digitally executed tenancy agreement on the platform (FR-ADM-04)
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <button
            onClick={exportArchive}
            disabled={exporting || !data?.total}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : <Download className="h-4 w-4 text-slate-500" />}
            {exporting ? 'Exporting…' : 'Export Audit Archive'}
          </button>
          {exportError && <p className="mt-1 max-w-xs text-[11px] text-rose-600">{exportError}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        Each agreement stores the SHA-256 hash of its signed text, so any later edit is detectable.
      </div>

      <AgreementList
        agreements={data?.docs ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        counterpartyLabel="Tenant"
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status)
          setPage(1)
        }}
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        isFetching={isFetching}
        onPageChange={setPage}
        emptyTitle="No agreements on the platform"
        emptyBody="Agreements appear here as owners approve rental requests and tenants sign. Nothing has been registered yet."
      />
    </div>
  )
}