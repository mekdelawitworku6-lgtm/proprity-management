import { useState } from 'react'
import { Scale, CheckCircle2, Clock, X, Loader2, AlertCircle, Inbox } from 'lucide-react'
import { useGetComplaintsQuery, useAdminResolveComplaintMutation } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import type { ComplaintListItem, ComplaintStatus } from '../../types/api'

const STATUS_BADGE: Record<ComplaintStatus, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}

const PRIORITY_BADGE = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-orange-50 text-orange-700',
  URGENT: 'bg-rose-50 text-rose-700',
} as const

export default function AdminDisputes() {
  // The server returns escalated disputes (plus anything past SLA) for an admin.
  const { data, isLoading, error, refetch } = useGetComplaintsQuery({ limit: 50 })
  const [resolve, { isLoading: isResolving }] = useAdminResolveComplaintMutation()
  const [selected, setSelected] = useState<ComplaintListItem | null>(null)

  const complaints = data?.docs ?? []
  // Escalation is tracked separately from the workflow status.
  const pending = complaints.filter((c) => c.escalationStatus === 'ESCALATED').length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">National Dispute Resolution Board</h1>
          <p className="text-xs text-slate-500">
            Official regulatory resolution for disputes escalated beyond the owner level (FR-ADM-03)
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 sm:self-auto">
          <Clock className="h-3.5 w-3.5" /> {pending} Awaiting Ruling
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Could not load disputes</p>
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-16 text-xs font-medium text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Loading disputes…
        </div>
      ) : !complaints.length ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800">No disputes need your ruling</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            A tenant or owner escalates a complaint here when it cannot be settled directly. Nothing has been
            escalated.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-blue-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-700">
                    {complaint.referenceNo}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      STATUS_BADGE[complaint.status] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {complaint.status}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      PRIORITY_BADGE[complaint.priority] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {complaint.priority}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {complaint.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {complaint.escalatedAt
                    ? `Escalated ${new Date(complaint.escalatedAt).toLocaleDateString()}`
                    : `Raised ${new Date(complaint.createdAt).toLocaleDateString()}`}
                </span>
              </div>

              <h3 className="mt-2 text-sm font-bold text-slate-900">{complaint.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{complaint.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span>
                  Raised by: <strong className="text-slate-800">{complaint.raisedBy.fullName}</strong>
                </span>
                <span>
                  Property: <strong className="text-slate-800">{complaint.property.name}</strong>
                  {complaint.unit && ` · ${complaint.unit.unitNumber}`}
                </span>
                {complaint.escalationReason && (
                  <span>
                    Reason: <strong className="text-slate-700">{complaint.escalationReason}</strong>
                  </span>
                )}
                {complaint._count.responses > 0 && <span>{complaint._count.responses} replies</span>}
              </div>

              {complaint.adminResolution && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
                  <span className="font-bold text-emerald-800">Official ruling:</span>{' '}
                  <span className="text-slate-700">{complaint.adminResolution}</span>
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setSelected(complaint)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                >
                  <Scale className="h-3.5 w-3.5" />
                  {complaint.adminResolution ? 'View ruling' : 'Issue ruling'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <RulingDialog
          complaint={selected}
          isResolving={isResolving}
          onClose={() => setSelected(null)}
          onSubmit={async (resolution, status) => {
            try {
              await resolve({ id: selected.id, resolution, status }).unwrap()
              setSelected(null)
            } catch {
              /* the RTK error surfaces through the button state and this dialog stays open */
            }
          }}
        />
      )}
    </div>
  )
}

function RulingDialog({
  complaint,
  isResolving,
  onClose,
  onSubmit,
}: {
  complaint: ComplaintListItem
  isResolving: boolean
  onClose: () => void
  onSubmit: (resolution: string, status: ComplaintStatus) => void
}) {
  const [resolution, setResolution] = useState(complaint.adminResolution ?? '')
  const [status, setStatus] = useState<ComplaintStatus>('RESOLVED')
  const alreadyRuled = Boolean(complaint.adminResolution)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-700">
              {complaint.referenceNo}
            </span>
            <h2 className="mt-1 text-base font-black text-slate-900">Official Ruling</h2>
            <p className="text-xs text-slate-500">{complaint.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-700">
          <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/70 p-3 leading-relaxed text-slate-600">
            {complaint.description}
          </p>

          {complaint.escalationReason && (
            <p className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <span className="font-bold text-amber-900">Escalation reason:</span>{' '}
              <span className="text-slate-700">{complaint.escalationReason}</span>
            </p>
          )}

          {alreadyRuled ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <span className="font-bold text-emerald-800">Ruled:</span> {complaint.adminResolution}
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Ruling text</label>
                <textarea
                  rows={5}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="State the decision both parties must follow…"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Both the tenant and the owner are notified by SMS when you issue the ruling.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Close as</label>
                <div className="flex gap-2">
                  {(['RESOLVED', 'CLOSED'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setStatus(option)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        status === option
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          {!alreadyRuled && (
            <button
              onClick={() => onSubmit(resolution.trim(), status)}
              disabled={isResolving || resolution.trim().length < 3}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isResolving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Issuing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Issue Ruling
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}