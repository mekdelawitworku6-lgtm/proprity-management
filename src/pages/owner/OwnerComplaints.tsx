import { useDeferredValue, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Search,
  User,
  Wrench,
  X,
} from 'lucide-react'
import {
  useCreateComplaintMutation,
  useEscalateComplaintMutation,
  useGetComplaintQuery,
  useGetComplaintsQuery,
  useRespondToComplaintMutation,
  useUpdateComplaintStatusMutation,
} from '../../store/propertyApi'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import { CreateComplaintModal } from '../../components/modals/CreateComplaintModal'
import { ClassificationSummaries } from '../../components/ClassificationSummaries'
import type {
  ComplaintCategory,
  ComplaintListItem,
  ComplaintStatus,
  EscalationStatus,
  UserRole,
} from '../../types/api'

const PAGE_SIZE = 10

type StatusTab = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'SCHEDULED' | ComplaintStatus

const STATUS_TABS: { key: StatusTab; label: string; count: number }[] = [
  { key: 'ALL', label: 'All', count: 8 },
  { key: 'PENDING', label: 'Pending', count: 3 },
  { key: 'IN_PROGRESS', label: 'In Progress', count: 3 },
  { key: 'SCHEDULED', label: 'Scheduled', count: 2 },
]

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-rose-100 text-rose-700',
  HIGH: 'bg-rose-100 text-rose-700 font-bold',
  MEDIUM: 'bg-amber-100 text-amber-700 font-bold',
  LOW: 'bg-slate-100 text-slate-700 font-bold',
}

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 font-bold',
  PENDING: 'bg-amber-50 text-amber-700 font-bold',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 font-bold',
  SCHEDULED: 'bg-purple-50 text-purple-700 font-bold',
  RESOLVED: 'bg-emerald-50 text-emerald-700 font-bold',
  CLOSED: 'bg-slate-100 text-slate-500 font-bold',
}

const ESCALATION_BADGE: Record<EscalationStatus, string> = {
  NONE: '',
  ESCALATED: 'bg-purple-50 text-purple-700',
  ADMIN_RESOLVED: 'bg-emerald-50 text-emerald-700',
}

const OWNER_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  MAINTENANCE: 'Maintenance',
  NOISE: 'Noise',
  SAFETY: 'Safety',
  PAYMENT: 'Payment',
  DISPUTE: 'Dispute',
  OTHER: 'Other',
}

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  TELECOM: 'Telecom',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  TENANT: 'Tenant',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime()
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export default function OwnerComplaints() {
  const [tab, setTab] = useState<StatusTab>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const search = useDeferredValue(searchInput)
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, error } = useGetComplaintsQuery(
    { ...(tab === 'ALL' ? {} : { status: tab as any }), page, limit: PAGE_SIZE },
    { refetchOnMountOrArgChange: true }
  )

  const [createComplaint] = useCreateComplaintMutation()

  const complaints = data?.docs ?? []
  const term = search.trim().toLowerCase()
  const filtered = term
    ? complaints.filter((complaint) =>
        [
          complaint.referenceNo,
          complaint.title,
          complaint.tenant?.fullName,
          complaint.tenant?.phoneNumber,
          complaint.property.name,
          complaint.unit?.unitNumber,
        ].some((value) => value?.toLowerCase().includes(term))
      )
    : complaints

  // Mock list matching Figma sample prototype if empty
  const sampleTickets = [
    {
      id: 'MR-001',
      referenceNo: 'MR-001',
      title: 'Plumbing leak in bathroom',
      description: 'Water leaking from bathroom sink pipe. Needs immediate attention.',
      unit: 'Unit B-204',
      tenant: 'Yonatan Bekele',
      date: '2026-05-10',
      priority: 'High',
      status: 'In Progress',
      category: 'Plumbing',
      assignedTo: 'Tesfaye Wonda',
    },
    {
      id: 'MR-002',
      referenceNo: 'MR-002',
      title: 'AC not cooling properly',
      description: 'Air conditioning unit is running but not cooling the room effectively.',
      unit: 'Unit C-101',
      tenant: 'Hanna Solomon',
      date: '2026-05-11',
      priority: 'Medium',
      status: 'Pending',
      category: 'HVAC',
      assignedTo: 'Tesfaye Wonda',
    },
    {
      id: 'MR-003',
      referenceNo: 'MR-003',
      title: 'Door lock malfunction',
      description: 'Front door lock is jammed and difficult to open.',
      unit: 'Unit A-303',
      tenant: 'Redwan Ahmed',
      date: '2026-05-12',
      priority: 'High',
      status: 'Pending',
      category: 'Security',
      assignedTo: 'Tesfaye Wonda',
    },
    {
      id: 'MR-004',
      referenceNo: 'MR-004',
      title: 'Paint peeling on walls',
      description: 'Paint is peeling in the living room. Needs repainting.',
      unit: 'Unit B-104',
      tenant: 'Ahmed Seid',
      date: '2026-05-09',
      priority: 'Low',
      status: 'Scheduled',
      category: 'General',
      assignedTo: 'Tesfaye Wonda',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Maintenance Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track and manage all maintenance requests
        </p>
      </div>

      {/* 4 Stat Cards matching Figma Image 5 */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Requests</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">8</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Pending</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">In Progress</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">3</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Scheduled</span>
          <p className="mt-2 text-2xl font-bold text-slate-900">2</p>
        </div>
      </div>

      {/* Filter Row: Search & Category */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search buildings by name or address..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-10 text-xs text-slate-800 shadow-xs outline-none transition placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Search className="pointer-events-none absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none shadow-xs transition focus:border-blue-500"
        >
          <option value="ALL">All Categories</option>
          <option value="PLUMBING">Plumbing</option>
          <option value="HVAC">HVAC</option>
          <option value="SECURITY">Security</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      {/* 3 Summary Classification Cards matching Figma */}
      <ClassificationSummaries />

      {/* Status Tabs matching Figma */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {STATUS_TABS.map((entry) => {
          const active = tab === entry.key
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                setTab(entry.key)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                active
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {entry.label} ({entry.count})
            </button>
          )
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>{toErrorMessage(error)}</p>
        </div>
      )}

      {/* Maintenance Request Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading maintenance requests…
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onOpen={() => setSelectedId(complaint.id)}
            />
          ))
        ) : (
          sampleTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{ticket.referenceNo}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${PRIORITY_BADGE[ticket.priority.toUpperCase()] || 'bg-rose-100 text-rose-700'}`}>
                    {ticket.priority}
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {ticket.status}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {ticket.category}
                  </span>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mt-2 text-sm font-bold text-slate-900">{ticket.title}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{ticket.description}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>
                  {ticket.unit} · {ticket.tenant} · {ticket.date}
                </span>
                <span>
                  Assigned to: <strong className="font-semibold text-slate-700">{ticket.assignedTo}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateComplaintModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => {
          await createComplaint(payload).unwrap()
        }}
      />

      {selectedId && (
        <ComplaintDetailModal complaintId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

function ComplaintCard({
  complaint,
  onOpen,
}: {
  complaint: ComplaintListItem
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition hover:border-slate-300"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold text-slate-900">{complaint.referenceNo}</span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[complaint.priority]}`}>
          {complaint.priority}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[complaint.status]}`}>
          {complaint.status.replace(/_/g, ' ')}
        </span>
        {complaint.escalationStatus !== 'NONE' && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${ESCALATION_BADGE[complaint.escalationStatus]}`}
          >
            {complaint.escalationStatus === 'ESCALATED' ? 'Escalated' : 'Admin ruled'}
          </span>
        )}
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {CATEGORY_LABEL[complaint.category]}
        </span>
      </div>

      <h3 className="mt-2 text-sm font-bold text-slate-900">{complaint.title}</h3>
      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{complaint.description}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-blue-600" />
          {complaint.property.name}
          {complaint.unit ? ` · Unit ${complaint.unit.unitNumber}` : ' · Whole property'}
        </span>

        {/* The tenant the report is about — resolved server-side from the active lease. */}
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          {complaint.tenant ? (
            <>
              <strong className="font-semibold text-slate-700">{complaint.tenant.fullName}</strong>
              <span className="font-mono text-[10px] text-slate-400">{complaint.tenant.phoneNumber}</span>
            </>
          ) : (
            <span className="italic text-slate-400">no tenant on file</span>
          )}
        </span>

        {/* Who actually filed it — differs from the tenant when staff raise it for them. */}
        <span className="text-slate-400">
          Filed by{' '}
          <strong className="font-semibold text-slate-600">{complaint.raisedBy.fullName}</strong>{' '}
          <span className="text-[10px] uppercase">({ROLE_LABEL[complaint.raisedBy.role]})</span>
        </span>

        <span className="text-slate-400">Reported {formatWhen(complaint.createdAt)}</span>

        {complaint._count.responses > 0 && (
          <span className="text-slate-400">{complaint._count.responses} replies</span>
        )}
        {complaint._count.workOrders > 0 && (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Wrench className="h-3 w-3" />
            {complaint._count.workOrders} work order
            {complaint._count.workOrders === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {complaint.escalationReason && complaint.escalationStatus === 'ESCALATED' && (
        <p className="mt-2 rounded-lg border border-purple-100 bg-purple-50 p-2 text-xs text-purple-800">
          <strong>Escalation reason:</strong> {complaint.escalationReason}
          {complaint.escalatedBy && (
            <span className="mt-0.5 block text-[11px] text-purple-600">
              Escalated by {complaint.escalatedBy.fullName} (
              {ROLE_LABEL[complaint.escalatedBy.role]}) on {formatDate(complaint.escalatedAt ?? complaint.updatedAt)}
            </span>
          )}
        </p>
      )}

      {complaint.adminResolution && (
        <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs text-emerald-800">
          <strong>Admin ruling:</strong> {complaint.adminResolution}
        </p>
      )}
    </button>
  )
}

function ComplaintDetailModal({ complaintId, onClose }: { complaintId: string; onClose: () => void }) {
  const log = useLogger('owner', 'ComplaintDetail')
  const { data, isLoading, error } = useGetComplaintQuery(complaintId)
  const [reply, setReply] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const [updateStatus, { isLoading: isUpdating }] = useUpdateComplaintStatusMutation()
  const [respond, { isLoading: isReplying }] = useRespondToComplaintMutation()
  const [escalate, { isLoading: isEscalating }] = useEscalateComplaintMutation()

  const busy = isUpdating || isReplying || isEscalating
  const allowed = data ? OWNER_TRANSITIONS[data.status] : []
  const canEscalate = data?.escalationStatus === 'NONE' && data.status !== 'CLOSED'
  const canReply = data?.status !== 'CLOSED'

  const run = async (label: string, action: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await action()
      log.info(label, { complaintId })
      setStatusNote('')
      setReply('')
      setEscalationReason('')
    } catch (caught) {
      const message = toErrorMessage(caught)
      log.error(`${label} failed`, { complaintId, message })
      setActionError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            {isLoading ? (
              <p className="text-xs text-slate-400">Loading…</p>
            ) : data ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700">{data.referenceNo}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[data.priority]}`}>
                    {data.priority}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[data.status]}`}>
                    {data.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="mt-1 text-base font-bold text-slate-900">{data.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {data.property.name}
                  {data.unit ? ` · Unit ${data.unit.unitNumber}` : ' · Whole property'} ·{' '}
                  {CATEGORY_LABEL[data.category]} · raised {formatDate(data.createdAt)}
                </p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {toErrorMessage(error)}
            </p>
          )}

          {data && (
            <>
              {/* Who this is about, straight from the lease the server resolved. */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tenant</h3>
                {data.tenant ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-bold text-slate-900">{data.tenant.fullName}</span>
                    <span className="font-mono text-[11px] text-slate-500">{data.tenant.phoneNumber}</span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs italic text-slate-400">
                    No tenant attached — this report is against the property as a whole.
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Filed by{' '}
                  <strong className="font-semibold text-slate-700">{data.raisedBy.fullName}</strong>{' '}
                  <span className="uppercase">({ROLE_LABEL[data.raisedBy.role]})</span>
                  {' · '}
                  {formatDate(data.createdAt)}
                </p>
                <p className="mt-1.5 text-xs text-slate-600">{data.description}</p>
              </section>

              {data.photos.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Photos</h3>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {data.photos.map((photo) => (
                      <img
                        key={photo}
                        src={photo}
                        alt="Complaint attachment"
                        className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Work orders — who the owner hired to fix it. */}
              {data.workOrders.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Work orders
                  </h3>
                  <div className="mt-1.5 space-y-2">
                    {data.workOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-700">
                            {order.referenceNo}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-800">{order.title}</p>
                        {order.vendor ? (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Vendor: <strong className="font-semibold text-blue-700">{order.vendor.name}</strong>{' '}
                            <span className="font-mono text-slate-400">{order.vendor.phoneNumber}</span>
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] italic text-slate-400">No vendor assigned</p>
                        )}
                        {order.completionNotes && (
                          <p className="mt-1 text-[11px] text-slate-600">{order.completionNotes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* The thread: every message carries its real author and role. */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conversation ({data.responses.length})
                </h3>
                {data.responses.length === 0 ? (
                  <p className="mt-1.5 text-xs italic text-slate-400">
                    No replies yet. Replying moves an open complaint to in progress.
                  </p>
                ) : (
                  <div className="mt-1.5 space-y-2">
                    {data.responses.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{entry.author.fullName}</span>
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700">
                            {ROLE_LABEL[entry.author.role]}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatWhen(entry.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{entry.message}</p>
                        {entry.attachments.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {entry.attachments.map((file) => (
                              <a
                                key={file}
                                href={file}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-semibold text-blue-700 underline"
                              >
                                attachment
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {canReply && (
                <section>
                  <label htmlFor="complaint-reply" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Reply
                  </label>
                  <textarea
                    id="complaint-reply"
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Answer the tenant — they are notified by SMS."
                    className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={!reply.trim() || busy}
                    onClick={() => run('replied', () => respond({ id: complaintId, message: reply.trim() }).unwrap())}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                  >
                    {isReplying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Send reply
                  </button>
                </section>
              )}

              {allowed.length > 0 && (
                <section className="border-t border-slate-100 pt-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Change status
                  </h3>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional note added to the conversation"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {allowed.map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run('status changed', () =>
                            updateStatus({
                              id: complaintId,
                              status: next,
                              ...(statusNote.trim() ? { note: statusNote.trim() } : {}),
                            }).unwrap()
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {next === 'RESOLVED' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        Mark {next.replace(/_/g, ' ').toLowerCase()}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {canEscalate && (
                <section className="border-t border-slate-100 pt-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Escalate to admin
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Hands this dispute to Possible Tech. It can only be done once.
                  </p>
                  <textarea
                    rows={2}
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Why does this need platform arbitration?"
                    className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={escalationReason.trim().length < 3 || busy}
                    onClick={() =>
                      run('escalated', () =>
                        escalate({ id: complaintId, reason: escalationReason.trim() }).unwrap()
                      )
                    }
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    {isEscalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    Escalate dispute
                  </button>
                </section>
              )}

              {actionError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                  {actionError}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
