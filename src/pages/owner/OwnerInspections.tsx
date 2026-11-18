import { useState } from 'react'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Plus,
  Receipt,
  Search,
  X,
} from 'lucide-react'
import {
  useApproveDepositRefundMutation,
  useCancelInspectionMutation,
  useCompleteInspectionMutation,
  useCreateDepositRefundMutation,
  useCreateInspectionMutation,
  useGetAgreementsQuery,
  useGetDepositRefundsQuery,
  useGetInspectionsQuery,
  usePayDepositRefundMutation,
  useRejectDepositRefundMutation,
  useUploadInspectionPhotosMutation,
} from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import type {
  AgreementSummary,
  CompleteInspectionPayload,
  DepositRefundRecord,
  DepositRefundStatus,
  InspectionItem,
  InspectionStatus,
  InspectionSummary,
  InspectionType,
} from '../../types/api'

const PAGE_SIZE = 100
const CHECKLIST_LABELS = ['Walls and ceiling', 'Doors and windows', 'Appliances and fixtures', 'Cleanliness']

type InspectionModal =
  | { mode: 'create' }
  | { mode: 'complete'; inspection: InspectionSummary }
  | null

type RefundModal =
  | { mode: 'create' }
  | { mode: 'decide'; refund: DepositRefundRecord; action: 'approve' | 'pay' | 'reject' }
  | null

const INSPECTION_BADGE: Record<InspectionStatus, string> = {
  SCHEDULED: 'bg-amber-50 text-amber-700 font-bold',
  COMPLETED: 'bg-emerald-50 text-emerald-700 font-bold',
  CANCELLED: 'bg-slate-100 text-slate-500 font-bold',
}

const REFUND_BADGE: Record<DepositRefundStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 font-bold',
  APPROVED: 'bg-blue-50 text-blue-700 font-bold',
  PAID: 'bg-emerald-50 text-emerald-700 font-bold',
  REJECTED: 'bg-rose-50 text-rose-700 font-bold',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoney(value: number) {
  return `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })} ETB`
}

function agreementLabel(agreement: AgreementSummary) {
  return `${agreement.property.name} / ${agreement.unit.unitNumber} — ${agreement.tenant.fullName}`
}

function inspectionUnit(inspection: InspectionSummary) {
  return `${inspection.agreement.property.name} / ${inspection.agreement.unit.unitNumber}`
}

function refundUnit(refund: DepositRefundRecord) {
  return `${refund.agreement.property.name} / ${refund.agreement.unit.unitNumber}`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadPhotos] = useUploadInspectionPhotosMutation()

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadPhotos(files).unwrap()
      onChange([...photos, ...uploaded.map((file) => file.url)])
    } catch (caught) {
      setError(toErrorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div key={photo} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img src={photo} alt="Inspection evidence" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((item) => item !== photo))}
              aria-label="Remove photo"
              className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-slate-600 opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          <span className="mt-1 text-[10px] font-semibold">{uploading ? 'Uploading' : 'Add photo'}</span>
          <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export function OwnerInspections() {
  const log = useLogger('owner', 'OwnerInspections')
  const [tab, setTab] = useState<'inspections' | 'refunds'>('inspections')
  const [search, setSearch] = useState('')
  const [inspectionModal, setInspectionModal] = useState<InspectionModal>(null)
  const [refundModal, setRefundModal] = useState<RefundModal>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [agreementId, setAgreementId] = useState('')
  const [inspectionType, setInspectionType] = useState<InspectionType>('MOVE_OUT')
  const [scheduledAt, setScheduledAt] = useState('')
  const [newPhotos, setNewPhotos] = useState<string[]>([])
  const [newNotes, setNewNotes] = useState('')
  const [checklist, setChecklist] = useState<InspectionItem[]>(
    CHECKLIST_LABELS.map((label) => ({ label, ok: true, note: '' })),
  )
  const [completePhotos, setCompletePhotos] = useState<string[]>([])
  const [completeNotes, setCompleteNotes] = useState('')
  const [refundAgreementId, setRefundAgreementId] = useState('')
  const [refundInspectionId, setRefundInspectionId] = useState('')
  const [deductions, setDeductions] = useState('0')
  const [refundNotes, setRefundNotes] = useState('')
  const [providerReference, setProviderReference] = useState('')

  const { data: agreementsData } = useGetAgreementsQuery({ limit: PAGE_SIZE })
  const { data: inspectionsData, isLoading: loadingInspections } = useGetInspectionsQuery({ limit: PAGE_SIZE })
  const { data: refundsData, isLoading: loadingRefunds } = useGetDepositRefundsQuery({ limit: PAGE_SIZE })

  const [createInspection] = useCreateInspectionMutation()
  const [completeInspection] = useCompleteInspectionMutation()
  const [cancelInspection] = useCancelInspectionMutation()
  const [createRefund] = useCreateDepositRefundMutation()
  const [approveRefund] = useApproveDepositRefundMutation()
  const [payRefund] = usePayDepositRefundMutation()
  const [rejectRefund] = useRejectDepositRefundMutation()

  const agreements = agreementsData?.docs ?? []
  const inspections = inspectionsData?.docs ?? []
  const refunds = refundsData?.docs ?? []

  const searchTerm = search.trim().toLowerCase()
  const filteredInspections = searchTerm
    ? inspections.filter((item) =>
        [item.referenceNo, inspectionUnit(item), item.type, item.status].some((value) =>
          value.toLowerCase().includes(searchTerm),
        ),
      )
    : inspections

  const filteredRefunds = searchTerm
    ? refunds.filter((item) =>
        [item.referenceNo, refundUnit(item), item.status].some((value) => value.toLowerCase().includes(searchTerm)),
      )
    : refunds

  const resetForms = () => {
    setFormError(null)
    setAgreementId('')
    setInspectionType('MOVE_OUT')
    setScheduledAt('')
    setNewPhotos([])
    setNewNotes('')
    setChecklist(CHECKLIST_LABELS.map((label) => ({ label, ok: true, note: '' })))
    setCompletePhotos([])
    setCompleteNotes('')
    setRefundAgreementId('')
    setRefundInspectionId('')
    setDeductions('0')
    setRefundNotes('')
    setProviderReference('')
  }

  const closeModals = () => {
    setInspectionModal(null)
    setRefundModal(null)
    resetForms()
  }

  const openCreateInspection = () => {
    resetForms()
    setAgreementId(agreements[0]?.id ?? '')
    setInspectionModal({ mode: 'create' })
  }

  const openCompleteInspection = (inspection: InspectionSummary) => {
    resetForms()
    const labels = [...CHECKLIST_LABELS, ...(inspection.items ?? []).map((item) => item.label).filter((label) => !CHECKLIST_LABELS.includes(label))]
    setChecklist(labels.map((label) => {
      const existing = inspection.items?.find((item) => item.label === label)
      return { label, ok: existing?.ok ?? true, note: existing?.note ?? '' }
    }))
    setCompletePhotos(inspection.photos)
    setCompleteNotes(inspection.notes ?? '')
    setInspectionModal({ mode: 'complete', inspection })
  }

  const openCreateRefund = () => {
    resetForms()
    setRefundAgreementId(agreements[0]?.id ?? '')
    setRefundModal({ mode: 'create' })
  }

  const handleCreateInspection = async () => {
    if (!agreementId) return
    setSaving(true)
    setFormError(null)
    try {
      await createInspection({
        agreementId,
        type: inspectionType,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        photos: newPhotos,
        notes: newNotes.trim() || undefined,
      }).unwrap()
      log.info('inspection scheduled', { agreementId, type: inspectionType })
      closeModals()
    } catch (caught) {
      setFormError(toErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteInspection = async (inspection: InspectionSummary) => {
    setSaving(true)
    setFormError(null)
    try {
      const body: CompleteInspectionPayload = {
        items: checklist,
        photos: completePhotos,
        notes: completeNotes.trim(),
      }
      await completeInspection({ id: inspection.id, body }).unwrap()
      log.info('inspection completed', { inspectionId: inspection.id })
      closeModals()
    } catch (caught) {
      setFormError(toErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRefund = async () => {
    if (!refundAgreementId) return
    setSaving(true)
    setFormError(null)
    try {
      await createRefund({
        agreementId: refundAgreementId,
        ...(refundInspectionId ? { inspectionId: refundInspectionId } : {}),
        deductions: Number(deductions) || 0,
        notes: refundNotes.trim() || undefined,
      }).unwrap()
      log.info('deposit refund prepared', { agreementId: refundAgreementId })
      closeModals()
    } catch (caught) {
      setFormError(toErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleDecideRefund = async (refund: DepositRefundRecord, action: 'approve' | 'pay' | 'reject') => {
    setSaving(true)
    setFormError(null)
    try {
      if (action === 'approve') {
        await approveRefund({ id: refund.id, body: { notes: refundNotes.trim() || undefined } }).unwrap()
      } else if (action === 'pay') {
        await payRefund({
          id: refund.id,
          body: { providerReference: providerReference.trim() || undefined, notes: refundNotes.trim() || undefined },
        }).unwrap()
      } else {
        await rejectRefund({ id: refund.id, body: { notes: refundNotes.trim() || undefined } }).unwrap()
      }
      log.info('deposit refund updated', { refundId: refund.id, action })
      closeModals()
    } catch (caught) {
      setFormError(toErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const openRefundDecision = (refund: DepositRefundRecord, action: 'approve' | 'pay' | 'reject') => {
    resetForms()
    setRefundNotes(refund.notes ?? '')
    setRefundModal({ mode: 'decide', refund, action })
  }

  const availableRefundInspections = inspections.filter(
    (inspection) =>
      inspection.agreementId === refundAgreementId &&
      inspection.type === 'MOVE_OUT' &&
      inspection.status === 'COMPLETED',
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspections & Deposits</h1>
          <p className="mt-1 text-sm text-slate-500">
            Move-in/out checklists with photo evidence and the security-deposit refund trail.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateInspection}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Schedule inspection
          </button>
          <button
            type="button"
            onClick={openCreateRefund}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Receipt className="h-4 w-4" /> Prepare refund
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['inspections', 'refunds'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setTab(item); setSearch('') }}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
                tab === item ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === 'inspections' ? 'Search reference or unit' : 'Search refund or unit'}
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {tab === 'inspections' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Unit / Agreement</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{inspection.referenceNo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {inspectionUnit(inspection)}
                      <span className="block text-xs text-slate-400">{inspection.tenant.fullName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inspection.type === 'MOVE_IN' ? 'Move-in' : 'Move-out'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${INSPECTION_BADGE[inspection.status]}`}>
                        {inspection.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inspection.scheduledAt ?? inspection.completedAt)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="inline-flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> {inspection.photos.length}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inspection.status === 'SCHEDULED' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openCompleteInspection(inspection)}
                            className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await cancelInspection(inspection.id).unwrap()
                              } catch (caught) {
                                log.error('inspection cancel failed', { message: toErrorMessage(caught) })
                              }
                            }}
                            className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loadingInspections && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading inspections…
            </div>
          )}
          {!loadingInspections && filteredInspections.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No inspections match this view.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Unit / Tenant</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Deductions</th>
                  <th className="px-4 py-3">Refund</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{refund.referenceNo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {refundUnit(refund)}
                      <span className="block text-xs text-slate-400">{refund.tenant.fullName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(refund.depositAmount)}</td>
                    <td className="px-4 py-3 text-amber-700">{formatMoney(refund.deductions)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{formatMoney(refund.refundAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${REFUND_BADGE[refund.status]}`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {refund.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => openRefundDecision(refund, 'approve')}
                            className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Approve
                          </button>
                        )}
                        {refund.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => openRefundDecision(refund, 'pay')}
                            className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Mark paid
                          </button>
                        )}
                        {['PENDING', 'APPROVED'].includes(refund.status) && (
                          <button
                            type="button"
                            onClick={() => openRefundDecision(refund, 'reject')}
                            className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loadingRefunds && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading refunds…
            </div>
          )}
          {!loadingRefunds && filteredRefunds.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No deposit refunds match this view.</p>
          )}
        </div>
      )}

      {inspectionModal?.mode === 'create' && (
        <ModalShell
          title="Schedule inspection"
          subtitle="Pick a lease; the tenant is resolved from the agreement."
          onClose={closeModals}
        >
          <div className="space-y-4">
            <Field label="Agreement">
              <select value={agreementId} onChange={(event) => setAgreementId(event.target.value)} className={inputClass}>
                <option value="">Select an agreement</option>
                {agreements.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>{agreementLabel(agreement)}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Inspection type">
                <select
                  value={inspectionType}
                  onChange={(event) => setInspectionType(event.target.value as InspectionType)}
                  className={inputClass}
                >
                  <option value="MOVE_OUT">Move-out</option>
                  <option value="MOVE_IN">Move-in</option>
                </select>
              </Field>
              <Field label="Scheduled date">
                <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={newNotes} onChange={(event) => setNewNotes(event.target.value)} rows={2} className={inputClass} />
            </Field>
            <Field label="Before photos">
              <PhotoUploader photos={newPhotos} onChange={setNewPhotos} />
            </Field>
            {formError && (
              <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4" /> {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeModals} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateInspection}
                disabled={saving || !agreementId}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Schedule
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {inspectionModal?.mode === 'complete' && (
        <ModalShell
          title={`Complete ${inspectionModal.inspection.referenceNo}`}
          subtitle="Record each checklist result and attach after photos."
          onClose={closeModals}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              {checklist.map((item, index) => (
                <div key={item.label} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setChecklist(checklist.map((entry, i) => i === index ? { ...entry, ok: !entry.ok } : entry))}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                        item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> {item.ok ? 'Passed' : 'Issue'}
                    </button>
                  </div>
                  <input
                    value={item.note ?? ''}
                    onChange={(event) => setChecklist(checklist.map((entry, i) => i === index ? { ...entry, note: event.target.value } : entry))}
                    placeholder="Optional note"
                    className={`${inputClass} mt-2`}
                  />
                </div>
              ))}
            </div>
            <Field label="Completion notes">
              <textarea value={completeNotes} onChange={(event) => setCompleteNotes(event.target.value)} rows={2} className={inputClass} />
            </Field>
            <Field label="After photos">
              <PhotoUploader photos={completePhotos} onChange={setCompletePhotos} />
            </Field>
            {formError && (
              <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4" /> {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeModals} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCompleteInspection(inspectionModal.inspection)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Complete inspection
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {refundModal?.mode === 'create' && (
        <ModalShell
          title="Prepare deposit refund"
          subtitle="Deductions must be backed by a completed move-out inspection."
          onClose={closeModals}
        >
          <div className="space-y-4">
            <Field label="Agreement">
              <select
                value={refundAgreementId}
                onChange={(event) => { setRefundAgreementId(event.target.value); setRefundInspectionId('') }}
                className={inputClass}
              >
                <option value="">Select an agreement</option>
                {agreements.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>{agreementLabel(agreement)}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deductions (ETB)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deductions}
                  onChange={(event) => setDeductions(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Evidence inspection">
                <select value={refundInspectionId} onChange={(event) => setRefundInspectionId(event.target.value)} className={inputClass}>
                  <option value="">None</option>
                  {availableRefundInspections.map((inspection) => (
                    <option key={inspection.id} value={inspection.id}>
                      {inspection.referenceNo} — {formatDate(inspection.completedAt)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={refundNotes} onChange={(event) => setRefundNotes(event.target.value)} rows={2} className={inputClass} />
            </Field>
            {formError && (
              <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4" /> {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeModals} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRefund}
                disabled={saving || !refundAgreementId}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Prepare refund
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {refundModal?.mode === 'decide' && (
        <ModalShell
          title={`${refundModal.action === 'pay' ? 'Mark paid' : refundModal.action === 'approve' ? 'Approve' : 'Reject'} ${refundModal.refund.referenceNo}`}
          subtitle={`Refund amount: ${formatMoney(refundModal.refund.refundAmount)}`}
          onClose={closeModals}
        >
          <div className="space-y-4">
            {refundModal.action === 'pay' && (
              <Field label="Provider reference">
                <input
                  value={providerReference}
                  onChange={(event) => setProviderReference(event.target.value)}
                  placeholder="TELEBIRR-ABC123"
                  className={inputClass}
                />
              </Field>
            )}
            <Field label={refundModal.action === 'reject' ? 'Reason' : 'Notes'}>
              <textarea value={refundNotes} onChange={(event) => setRefundNotes(event.target.value)} rows={3} className={inputClass} />
            </Field>
            {formError && (
              <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4" /> {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeModals} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecideRefund(refundModal.refund, refundModal.action)}
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  refundModal.action === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default OwnerInspections
