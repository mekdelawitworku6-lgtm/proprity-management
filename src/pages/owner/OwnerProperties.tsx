import { useDeferredValue, useMemo, useState } from 'react'
import { Plus, Search, Building2, DollarSign, MapPin, AlertCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCreatePropertyMutation,
  useGetOwnerDashboardQuery,
  useGetPropertiesQuery,
  useUpdatePropertyMutation,
} from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { ApiError } from '../../api/client'
import { useAuth } from '../../store/hooks'
import { EditPropertyModal } from '../../components/modals/EditPropertyModal'
import type { CreatePropertyPayload, OwnerDashboardProperty, Property } from '../../types/api'

const PAGE_SIZE = 12

interface SaveError {
  message: string
  fieldErrors: Record<string, string>
}

const formatETB = (amount: number): string =>
  new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(amount)

const shortETB = (amount: number): string =>
  amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : `${Math.round(amount / 1000)}K`

const STATUS_LABEL: Record<string, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
}

export default function OwnerProperties() {
  const { hasRole } = useAuth()
  const canEdit = hasRole('OWNER')

  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [saveError, setSaveError] = useState<SaveError | null>(null)

  // The endpoint supports `search`, so filtering happens server-side. Deferring
  // the value keeps typing from firing a request per keystroke.
  const deferredSearch = useDeferredValue(searchQuery)

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPropertiesQuery({
    page,
    limit: PAGE_SIZE,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
  })
  const { data: dashboard } = useGetOwnerDashboardQuery()
  const [createProperty, { isLoading: isCreating }] = useCreatePropertyMutation()
  const [updateProperty, { isLoading: isUpdating }] = useUpdatePropertyMutation()

  const properties = useMemo(() => data?.docs ?? [], [data])

  /** The properties endpoint has no revenue column, so it is joined from the dashboard. */
  const revenueByProperty = useMemo(() => {
    const map = new Map<string, OwnerDashboardProperty>()
    for (const entry of dashboard?.properties ?? []) map.set(entry.propertyId, entry)
    return map
  }, [dashboard])

  const totals = dashboard?.totals

  const handleOpenAdd = () => {
    setEditingProperty(null)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (property: Property) => {
    setEditingProperty(property)
    setSaveError(null)
    setIsModalOpen(true)
  }

  const handleSave = async (payload: CreatePropertyPayload) => {
    setSaveError(null)
    try {
      if (editingProperty) {
        await updateProperty({ id: editingProperty.id, changes: payload }).unwrap()
      } else {
        await createProperty(payload).unwrap()
      }
      setIsModalOpen(false)
      setEditingProperty(null)
    } catch (thrown) {
      setSaveError({
        message: toErrorMessage(thrown),
        fieldErrors: thrown instanceof ApiError ? thrown.fieldErrors : {},
      })
    }
  }

  const statsCards = [
    {
      label: 'Total Buildings',
      value: totals ? String(totals.properties) : String(data?.total ?? 0),
      icon: <Building2 className="h-4 w-4 text-blue-600" />,
    },
    {
      label: 'Monthly Rent Expected',
      value: totals ? `${shortETB(totals.rentExpected)} ETB` : '—',
      icon: (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <DollarSign className="h-3.5 w-3.5" />
        </span>
      ),
    },
    {
      label: 'Occupancy',
      value: totals ? `${Math.round(totals.occupancyRate)}%` : '—',
      icon: (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <Building2 className="h-3.5 w-3.5" />
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header & Main Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">My Building</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your property portfolio and units</p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#003882] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#002b66] active:bg-[#00224f] transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Add New Building
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              {card.icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search buildings by name or address..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800"
        >
          <span className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            {toErrorMessage(error)}
          </span>
          <button
            onClick={() => refetch()}
            className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200/90 bg-white" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && properties.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {searchQuery ? 'No buildings match your search' : 'No buildings yet'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery
              ? 'Try a different name or address.'
              : 'Add your first building to start managing units and rent.'}
          </p>
          {canEdit && !searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F2744] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1A365D] transition"
            >
              <Plus className="h-4 w-4" />
              + Add New Building
            </button>
          )}
        </div>
      )}

      {/* Property Cards Grid */}
      <div
        className={`grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 ${
          isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {properties.map((property) => {
          const summary = property.unitSummary
          const occupiedPct = summary.total > 0 ? (summary.occupied / summary.total) * 100 : 0
          const revenue = revenueByProperty.get(property.id)
          const location = [property.subCity, property.city].filter(Boolean).join(', ')

          return (
            <div
              key={property.id}
              onClick={() => canEdit && handleOpenEdit(property)}
              className={`group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition ${
                canEdit ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : ''
              }`}
            >
              {/* Header band — the API has no cover image on this endpoint */}
              <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                <Building2 className="h-9 w-9 text-white/70" />
                <span className="absolute right-3 top-3 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                  {property.isActive ? 'Active' : 'Inactive'}
                </span>
                {property.type && (
                  <span className="absolute left-3 top-3 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                    {STATUS_LABEL[property.type] ?? property.type}
                  </span>
                )}
              </div>

              {/* Property Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {property.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{location || property.address}</span>
                  </p>
                </div>

                {/* Occupancy */}
                <div className="rounded-lg bg-slate-50 p-2 text-xs">
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Occupancy</span>
                    <span className="font-semibold text-slate-800">
                      {summary.occupied}/{summary.total} units ({Math.round(occupiedPct)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${occupiedPct}%` }}
                    />
                  </div>
                  {summary.vacant > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-500">
                      {summary.vacant} vacant
                      {summary.reserved > 0 ? ` · ${summary.reserved} reserved` : ''}
                      {summary.underMaintenance > 0 ? ` · ${summary.underMaintenance} under maintenance` : ''}
                    </p>
                  )}
                </div>

                {/* Location & area */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                  <div>
                    <span className="text-slate-400">Woreda</span>
                    <p className="font-medium text-slate-800">{property.woreda || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Area</span>
                    <p className="font-medium text-slate-800">
                      {property.totalArea != null ? `${formatETB(property.totalArea)} m²` : '—'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Monthly rent expected:</span>
                  <span className="font-bold text-slate-900">
                    {revenue ? `${formatETB(revenue.rentExpected)} ETB` : '—'}
                  </span>
                </div>

                {/* Amenities tags */}
                {property.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {property.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 4 && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        +{property.amenities.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/90 pt-4">
          <p className="text-xs text-slate-500">
            Page {data.page} of {data.totalPages} · {data.total} buildings
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!data || data.page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={!data || data.page >= data.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <EditPropertyModal
        isOpen={isModalOpen}
        property={editingProperty}
        isSubmitting={isCreating || isUpdating}
        serverError={saveError?.message ?? null}
        serverErrors={saveError?.fieldErrors ?? {}}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProperty(null)
          setSaveError(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
