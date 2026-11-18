import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useGetAgreementsQuery } from '../../store/propertyApi'
import { AgreementList } from '../../components/agreements/AgreementList'
import type { AgreementStatus } from '../../types/api'

const PAGE_SIZE = 12

export default function OwnerAgreements() {
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, refetch } = useGetAgreementsQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Digital Rental Agreements</h1>
          <p className="text-xs text-slate-500">
            Immutable, digitally signed agreements for your units
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:self-auto">
          <ShieldCheck className="h-4 w-4" /> SHA-256 Verified Records
        </span>
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
        emptyTitle="No agreements yet"
        emptyBody="Once you approve a rental request or add a tenant to one of your units, the agreement is generated here automatically."
      />
    </div>
  )
}