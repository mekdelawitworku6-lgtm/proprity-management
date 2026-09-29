import React, { useState } from 'react'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import { PROPERTY_TYPES, type CreatePropertyPayload, type Property } from '../../types/api'
import { useLogger, type ChannelLogger } from '../../utils/logger'

const SUB_CITIES = [
  'Bole',
  'Kirkos',
  'Lideta',
  'Yeka',
  'Nifas Silk-Lafto',
  'Arada',
  'Gulele',
  'Kolfe Keranio',
  'Akaky Kaliti',
  'Addis Ketema',
  'Shiro Meda',
  'Tate',
]

const TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
}

interface Props {
  isOpen: boolean
  property?: Property | null
  isSubmitting?: boolean
  serverError?: string | null
  serverErrors?: Record<string, string>
  onClose: () => void
  onSave: (payload: CreatePropertyPayload) => void
}

const EMPTY_FORM = {
  name: '',
  type: 'RESIDENTIAL' as (typeof PROPERTY_TYPES)[number],
  city: 'Addis Ababa',
  subCity: 'Bole',
  woreda: '',
  address: '',
  totalArea: '',
  ownershipType: '',
  titleDeedNo: '',
  description: '',
  amenities: [] as string[],
}

function initialForm(property: Property | null | undefined) {
  if (!property) return EMPTY_FORM
  return {
    name: property.name,
    type: property.type,
    city: property.city,
    subCity: property.subCity ?? '',
    woreda: property.woreda ?? '',
    address: property.address,
    totalArea: property.totalArea != null ? String(property.totalArea) : '',
    ownershipType: property.ownershipType ?? '',
    titleDeedNo: property.titleDeedNo ?? '',
    description: property.description ?? '',
    amenities: property.amenities ?? [],
  }
}

type FormState = ReturnType<typeof initialForm>

export function EditPropertyModal({
  isOpen,
  property,
  isSubmitting = false,
  serverError = null,
  serverErrors = {},
  onClose,
  onSave,
}: Props) {
  const log = useLogger('modals', 'EditPropertyModal')
  // Keyed on the open state and target property, so a fresh form is built on
  // open instead of syncing props into state from an effect.
  return isOpen ? (
    <PropertyForm
      key={`${property?.id ?? 'new'}`}
      property={property}
      isSubmitting={isSubmitting}
      serverError={serverError}
      serverErrors={serverErrors}
      onClose={onClose}
      onSave={onSave}
      log={log}
    />
  ) : null
}

interface FormProps {
  property: Property | null | undefined
  isSubmitting: boolean
  serverError: string | null
  serverErrors: Record<string, string>
  onClose: () => void
  onSave: (payload: CreatePropertyPayload) => void
  log: ChannelLogger
}

function PropertyForm({
  property,
  isSubmitting,
  serverError,
  serverErrors,
  onClose,
  onSave,
  log,
}: FormProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(property))
  const [amenityInput, setAmenityInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const addAmenity = () => {
    const value = amenityInput.trim()
    if (!value || form.amenities.includes(value)) return
    update('amenities', [...form.amenities, value])
    setAmenityInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // name / city / address are the only server-required fields.
    if (!form.name.trim() || !form.city.trim() || !form.address.trim()) {
      setFormError('Name, city and address are required.')
      log.warn('submit blocked — missing required fields')
      return
    }

    const payload: CreatePropertyPayload = {
      name: form.name.trim(),
      type: form.type,
      city: form.city.trim(),
      address: form.address.trim(),
    }
    if (form.subCity.trim()) payload.subCity = form.subCity.trim()
    if (form.woreda.trim()) payload.woreda = form.woreda.trim()
    if (form.description.trim()) payload.description = form.description.trim()
    if (form.ownershipType.trim()) payload.ownershipType = form.ownershipType.trim()
    if (form.titleDeedNo.trim()) payload.titleDeedNo = form.titleDeedNo.trim()
    if (form.totalArea.trim() && Number.isFinite(Number(form.totalArea))) {
      payload.totalArea = Number(form.totalArea)
    }
    if (form.amenities.length) payload.amenities = form.amenities

    log.info(property ? 'saving property edits' : 'creating new property', {
      id: property?.id ?? 'new',
      name: payload.name,
    })
    onSave(payload)
  }

  const fieldError = (key: string) => serverErrors[key]

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500'
  const errorClass = 'border-red-300 focus:border-red-500 focus:ring-red-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prop-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                id="prop-name"
                name="name"
                type="text"
                placeholder="Bole Heights Apartments"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={`${inputClass} ${fieldError('name') ? errorClass : ''}`}
              />
              {fieldError('name') && (
                <p className="mt-1 text-[10px] font-medium text-red-600">{fieldError('name')}</p>
              )}
            </div>

            <div>
              <label htmlFor="prop-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                id="prop-type"
                name="type"
                value={form.type}
                onChange={(e) => update('type', e.target.value as (typeof PROPERTY_TYPES)[number])}
                className={inputClass}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prop-address" className="block text-xs font-semibold text-slate-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              id="prop-address"
              name="address"
              type="text"
              placeholder="Bole Road, near Edna Mall"
              required
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className={`${inputClass} ${fieldError('address') ? errorClass : ''}`}
            />
            {fieldError('address') && (
              <p className="mt-1 text-[10px] font-medium text-red-600">{fieldError('address')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="prop-city" className="block text-xs font-semibold text-slate-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="prop-city"
                name="city"
                type="text"
                required
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className={`${inputClass} ${fieldError('city') ? errorClass : ''}`}
              />
            </div>

            <div>
              <label htmlFor="prop-subcity" className="block text-xs font-semibold text-slate-700 mb-1">
                Sub-city
              </label>
              <select
                id="prop-subcity"
                name="subCity"
                value={form.subCity}
                onChange={(e) => update('subCity', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {SUB_CITIES.map((subCity) => (
                  <option key={subCity} value={subCity}>
                    {subCity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prop-woreda" className="block text-xs font-semibold text-slate-700 mb-1">
                Woreda
              </label>
              <input
                id="prop-woreda"
                name="woreda"
                type="text"
                placeholder="03"
                value={form.woreda}
                onChange={(e) => update('woreda', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="prop-area" className="block text-xs font-semibold text-slate-700 mb-1">
                Total Area (m²)
              </label>
              <input
                id="prop-area"
                name="totalArea"
                type="number"
                min={0}
                step="0.01"
                placeholder="1500"
                value={form.totalArea}
                onChange={(e) => update('totalArea', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="prop-ownership" className="block text-xs font-semibold text-slate-700 mb-1">
                Ownership
              </label>
              <select
                id="prop-ownership"
                name="ownershipType"
                value={form.ownershipType}
                onChange={(e) => update('ownershipType', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="FREEHOLD">Freehold</option>
                <option value="LEASEHOLD">Leasehold</option>
                <option value="COOPERATIVE">Cooperative</option>
              </select>
            </div>

            <div>
              <label htmlFor="prop-deed" className="block text-xs font-semibold text-slate-700 mb-1">
                Title Deed No.
              </label>
              <input
                id="prop-deed"
                name="titleDeedNo"
                type="text"
                value={form.titleDeedNo}
                onChange={(e) => update('titleDeedNo', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="prop-amenities" className="block text-xs font-semibold text-slate-700 mb-1">
              Amenities
            </label>
            <div className="flex gap-2">
              <input
                id="prop-amenities"
                type="text"
                placeholder="Parking"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAmenity()
                  }
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={addAmenity}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {form.amenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {amenity}
                    <button
                      type="button"
                      aria-label={`Remove ${amenity}`}
                      onClick={() =>
                        update(
                          'amenities',
                          form.amenities.filter((item) => item !== amenity)
                        )
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="prop-description" className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="prop-description"
              name="description"
              rows={2}
              placeholder="Provide general property details, building specifications, or notes"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] font-medium text-red-800"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
              <p>{formError}</p>
            </div>
          )}

          {serverError && !formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] font-medium text-red-800"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
              <p>{serverError}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#0F2744] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1A365D] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : 'Save Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
