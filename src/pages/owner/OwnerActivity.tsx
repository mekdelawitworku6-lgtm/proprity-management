import { useState } from 'react'
import { Activity, AlertCircle, Eye, Loader2, ScrollText } from 'lucide-react'
import { useGetMyActivityQuery, useGetStaffQuery } from '../../store/propertyApi'
import type { AuditLogEntry } from '../../types/api'

const PAGE_SIZE = 20

/** Read actions are greyed out and can be hidden, so real changes stand out. */
const VIEW_ACTIONS = new Set(['RECORD_VIEWED'])

const ACTION_LABEL: Record<string, string> = {
  MANAGER_CREATED: 'Added a staff account',
  MANAGER_PERMISSIONS_UPDATED: 'Changed staff permissions',
  MANAGER_DEACTIVATED: 'Deactivated a staff account',
  MANAGER_REACTIVATED: 'Reactivated a staff account',
  PROPERTY_CREATED: 'Added a property',
  PROPERTY_UPDATED: 'Edited a property',
  PROPERTY_DEACTIVATED: 'Deactivated a property',
  UNIT_CREATED: 'Added a unit',
  UNIT_UPDATED: 'Edited a unit',
  COMPLAINT_CREATED: 'Filed a complaint',
  COMPLAINT_STATUS_CHANGED: 'Changed a complaint status',
  COMPLAINT_RESPONDED: 'Replied on a complaint',
  COMPLAINT_ESCALATED: 'Escalated a complaint',
  PAYMENT_RECORDED: 'Recorded a payment',
  PAYMENT_CONFIRMED: 'Confirmed a payment',
  PAYMENT_REJECTED: 'Rejected a payment',
  INVOICE_CANCELLED: 'Cancelled an invoice',
  AGREEMENT_CREATED: 'Created an agreement',
  AGREEMENT_SIGNED: 'Signed an agreement',
  AGREEMENT_TERMINATED: 'Terminated an agreement',
  AGREEMENT_RENEWED: 'Offered a renewal',
  TENANT_CREATED_BY_OWNER: 'Registered a tenant',
  WORK_ORDER_CREATED: 'Created a work order',
  WORK_ORDER_COMPLETED: 'Completed a work order',
  VENDOR_CREATED: 'Added a vendor',
  RECORD_VIEWED: 'Viewed a record',
}

const ENTITY_LABEL: Record<string, string> = {
  Property: 'property',
  Unit: 'unit',
  Tenant: 'tenant',
  Agreement: 'agreement',
  Invoice: 'invoice',
  Payment: 'payment',
  Complaint: 'complaint',
  WorkOrder: 'work order',
  Vendor: 'vendor',
  User: 'staff account',
  Expense: 'expense',
  Report: 'report',
}

const formatWhen = (value: string) => {
  const date = new Date(value)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EntryRow({ entry }: { entry: AuditLogEntry }) {
  const isView = VIEW_ACTIONS.has(entry.action)
  const actorName = entry.actor?.fullName ?? 'System'
  const entity = entry.entityType ? (ENTITY_LABEL[entry.entityType] ?? entry.entityType.toLowerCase()) : null

  return (
    <li className={`flex items-start gap-3 px-4 py-3 ${isView ? 'bg-slate-50/60' : ''}`}>
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isView ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
        }`}
      >
        {isView ? <Eye className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-800">
          <span className="font-bold">{actorName}</span>{' '}
          <span className={isView ? 'text-slate-500' : 'text-slate-700'}>
            {ACTION_LABEL[entry.action] ?? entry.action.replace(/_/g, ' ').toLowerCase()}
          </span>
          {entity && <span className="text-slate-500">{` ${entity}`}</span>}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {formatWhen(entry.createdAt)}
          {entry.actor?.role === 'MANAGER' && ' · staff'}
          {entry.ipAddress && ` · ${entry.ipAddress}`}
        </p>
      </div>
    </li>
  )
}

export function OwnerActivity() {
  const [page, setPage] = useState(1)
  const [actorId, setActorId] = useState('')
  const [includeViews, setIncludeViews] = useState(true)

  const { data: staff } = useGetStaffQuery()
  const { data, isLoading, isFetching, isError, refetch } = useGetMyActivityQuery(
    { page, limit: PAGE_SIZE, includeViews, ...(actorId ? { actorId } : {}) },
    { pollingInterval: 30_000 }
  )

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Activity</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Everything you and your staff have changed, and the records they have opened.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span className="text-slate-500">Staff member</span>
          <select
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="">Everyone (me and staff)</option>
            {staff?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={includeViews}
            onChange={(e) => {
              setIncludeViews(e.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Include records they viewed
        </label>

        {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        <span className="ml-auto text-[11px] text-slate-400">
          {total} {total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading activity…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4" />
          Could not load the activity trail.{' '}
          <button onClick={() => refetch()} className="font-bold underline">Retry</button>
        </div>
      )}

      {!isLoading && !isError && data?.docs.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ScrollText className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-slate-800">Nothing here yet</p>
          <p className="max-w-sm text-xs text-slate-500">
            Once you or your staff make a change, it shows up here with the time and the account that did it.
          </p>
        </div>
      )}

      {data && data.docs.length > 0 && (
        <>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {data.docs.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
