import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react'
import { useGetAgreementsQuery, useRenewAgreementMutation } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { AgreementList } from '../../components/agreements/AgreementList'
import type { AgreementStatus, AgreementSummary } from '../../types/api'

const PAGE_SIZE = 12

export default function OwnerAgreements() {
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [renewTarget, setRenewTarget] = useState<AgreementSummary | null>(null)
  const [renewMonths, setRenewMonths] = useState('12')
  const [renewRent, setRenewRent] = useState('')
  const [renewError, setRenewError] = useState<string | null>(null)
  const [renewSuccess, setRenewSuccess] = useState<string | null>(null)
  const [renewAgreement, { isLoading: renewing }] = useRenewAgreementMutation()
  const { data, isLoading, isFetching, error, refetch } = useGetAgreementsQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  function openRenew(agreement: AgreementSummary) {
    setRenewTarget(agreement)
    setRenewMonths('12')
    setRenewRent(String(agreement.rentAmount))
    setRenewError(null)
    setRenewSuccess(null)
  }

  async function submitRenew() {
    if (!renewTarget) return
    setRenewError(null)
    setRenewSuccess(null)
    try {
      const created = await renewAgreement({
        id: renewTarget.id,
        body: {
          durationMonths: Number(renewMonths),
          rentAmount: Number(renewRent),
        },
      }).unwrap()
      setRenewSuccess(`${created.referenceNo} is ready for the tenant's e-signature.`)
    } catch (cause) {
      setRenewError(toErrorMessage(cause))
    }
  }

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
        onRenew={openRenew}
        emptyTitle="No agreements yet"
        emptyBody="Once you approve a rental request or add a tenant to one of your units, the agreement is generated here automatically."
      />

      {renewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Renew agreement</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {renewTarget.referenceNo} · {renewTarget.tenant.fullName}
                </p>
              </div>
              <button
                onClick={() => setRenewTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Term length (months)</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={renewMonths}
                  onChange={(event) => setRenewMonths(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Monthly rent (ETB)</span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={renewRent}
                  onChange={(event) => setRenewRent(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                The new agreement starts the day after this one ends. The tenant signs it in their app
                before it becomes active.
              </p>
            </div>

            {renewError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {renewError}
              </div>
            )}
            {renewSuccess && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {renewSuccess}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setRenewTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={submitRenew}
                disabled={renewing || !Number(renewMonths) || !Number(renewRent)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {renewing && <Loader2 className="h-4 w-4 animate-spin" />}
                Create renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
