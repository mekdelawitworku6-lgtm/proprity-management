import { useMemo, useState } from 'react'
import { X, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { useGetPropertiesQuery, useGetPropertyQuery } from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import type { ComplaintCategory, CreateComplaintPayload, Priority } from '../../types/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateComplaintPayload) => Promise<void>
}

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'NOISE', label: 'Noise' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'DISPUTE', label: 'Dispute' },
  { value: 'OTHER', label: 'Other' },
]

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

/**
 * Raises a complaint on behalf of the owner. The property and unit are picked
 * from the owner's real portfolio, and the server resolves the tenant from the
 * active agreement on that unit — so nobody has to be named by hand.
 */
export function CreateComplaintModal({ isOpen, onClose, onSubmit }: Props) {
  const log = useLogger('modals', 'CreateComplaintModal')
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [category, setCategory] = useState<ComplaintCategory>('MAINTENANCE')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Only fetch the portfolio while the modal is open.
  const { data: properties, isLoading: isLoadingProperties } = useGetPropertiesQuery(
    { limit: 100, isActive: true },
    { skip: !isOpen }
  )

  // Units live on the property detail, so the second request waits for a pick.
  const { data: property, isFetching: isLoadingUnits } = useGetPropertyQuery(propertyId, {
    skip: !isOpen || !propertyId,
  })

  const units = useMemo(() => property?.units ?? [], [property])

  if (!isOpen) return null

  /** Closing always clears the form, so reopening never shows a stale draft or error. */
  const handleClose = () => {
    setSubmitError(null)
    setPropertyId('')
    setUnitId('')
    setCategory('MAINTENANCE')
    setPriority('MEDIUM')
    setTitle('')
    setDescription('')
    onClose()
  }

  const portfolio = properties?.docs ?? []
  const disabled = isSaving || !propertyId || !title.trim() || !description.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return

    setIsSaving(true)
    setSubmitError(null)
    try {
      await onSubmit({
        propertyId,
        ...(unitId ? { unitId } : {}),
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
      })
      log.info('complaint created', { propertyId, unitId: unitId || null, category, priority })
      handleClose()
    } catch (caught) {
      const message = toErrorMessage(caught)
      log.error('complaint create failed', { message })
      setSubmitError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Raise a Complaint</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pick the unit and the tenant is resolved from its active lease
            </p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {portfolio.length === 0 && !isLoadingProperties && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
              You have no active properties yet, so there is nothing to report against.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="complaint-property" className="mb-1 block text-xs font-semibold text-slate-700">
                Property
              </label>
              <select
                id="complaint-property"
                value={propertyId}
                onChange={(e) => {
                  // The previous unit belongs to the old property, so drop it here.
                  setPropertyId(e.target.value)
                  setUnitId('')
                }}
                disabled={isLoadingProperties}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{isLoadingProperties ? 'Loading…' : 'Select a property'}</option>
                {portfolio.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} — {entry.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="complaint-unit" className="mb-1 block text-xs font-semibold text-slate-700">
                Unit
              </label>
              <select
                id="complaint-unit"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={!propertyId || isLoadingUnits}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">
                  {!propertyId
                    ? 'Choose a property first'
                    : isLoadingUnits
                      ? 'Loading units…'
                      : 'Whole property'}
                </option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unit {unit.unitNumber} · {unit.status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {propertyId && (
            <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Building2 className="h-3 w-3 text-blue-600" />
              {unitId
                ? 'The tenant on the active lease for this unit is notified automatically.'
                : 'No unit selected — this is reported against the property as a whole.'}
            </p>
          )}

          <div>
            <label htmlFor="complaint-title" className="mb-1 block text-xs font-semibold text-slate-700">
              Issue Summary
            </label>
            <input
              id="complaint-title"
              type="text"
              placeholder="e.g. Kitchen sink leaking"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="complaint-description" className="mb-1 block text-xs font-semibold text-slate-700">
              Detailed Description
            </label>
            <textarea
              id="complaint-description"
              rows={3}
              required
              placeholder="What happened, and what needs doing?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="complaint-category" className="mb-1 block text-xs font-semibold text-slate-700">
                Category
              </label>
              <select
                id="complaint-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="complaint-priority" className="mb-1 block text-xs font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="complaint-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                {PRIORITIES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {submitError && (
            <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {submitError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
