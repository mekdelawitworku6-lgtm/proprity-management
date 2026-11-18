import { useState } from 'react'
import {
  AlertCircle,
  Building2,
  Loader2,
  Plus,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react'
import {
  useCreatePlatformStaffMutation,
  useGetPlatformStaffQuery,
  useSetPlatformStaffActiveMutation,
  useSetPlatformStaffPermissionsMutation,
} from '../../store/adminApi'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import { AddStaffModal } from '../../components/modals/AddStaffModal'
import {
  MANAGER_PERMISSION_GROUPS,
  MANAGER_PERMISSIONS,
  type CreateStaffPayload,
  type ManagerPermission,
  type PlatformStaffMember,
} from '../../types/api'

function describeGrants(permissions: ManagerPermission[]): { area: string; granted: number; total: number }[] {
  return MANAGER_PERMISSION_GROUPS.map((group) => {
    const granted = group.permissions.filter((permission) => permissions.includes(permission)).length
    return { area: group.area, granted, total: group.permissions.length }
  }).filter((entry) => entry.granted > 0)
}

/** Staff the platform appointed directly have no employer and work platform-wide. */
function ownerLabel(staff: PlatformStaffMember): string {
  if (!staff.employerId) return 'Possible Technology (all owners)'
  return staff.employer?.ownerProfile?.companyName || staff.employer?.fullName || 'Unknown owner'
}

function StaffRow({
  staff,
  draftPermissions,
  onTogglePermission,
  onToggleActive,
  isSavingActive,
}: {
  staff: PlatformStaffMember
  draftPermissions: ManagerPermission[]
  onTogglePermission: (permission: ManagerPermission) => void
  onToggleActive: () => void
  isSavingActive: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const groups = describeGrants(staff.permissions)
  const hasEveryGrant = staff.permissions.length >= MANAGER_PERMISSIONS.length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">
            {staff.fullName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{staff.fullName}</p>
            <p className="text-xs text-slate-500">
              {staff.phoneNumber}
              {staff.email ? ` · ${staff.email}` : ''}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Building2 className="h-3 w-3" />
              {ownerLabel(staff)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {staff.isSuspended ? (
            <span className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">DEACTIVATED</span>
          ) : staff.permissions.length === 0 ? (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">NO ACCESS</span>
          ) : (
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              {hasEveryGrant ? 'FULL ACCESS' : `${staff.permissions.length} GRANTS`}
            </span>
          )}
          <button
            onClick={onToggleActive}
            disabled={isSavingActive}
            title={staff.isSuspended ? 'Reactivate this account' : 'Deactivate this account'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition disabled:opacity-50 ${
              staff.isSuspended
                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                : 'border-rose-200 text-rose-600 hover:bg-rose-50'
            }`}
          >
            {isSavingActive ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : staff.isSuspended ? (
              <UserRoundCheck className="h-3 w-3" />
            ) : (
              <UserRoundX className="h-3 w-3" />
            )}
            {staff.isSuspended ? 'Reactivate' : 'Deactivate'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
          {MANAGER_PERMISSION_GROUPS.map((group) => (
            <fieldset key={group.area} className="rounded-xl border border-slate-200 p-3">
              <legend className="px-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                {group.area}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={draftPermissions.includes(permission)}
                      onChange={() => onTogglePermission(permission)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {groups.length === 0 ? (
            <p className="text-xs text-slate-400">
              No permissions granted — this account cannot reach anything yet.
            </p>
          ) : (
            groups.map((group) => (
              <span
                key={group.area}
                className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600"
              >
                {group.area} {group.granted}/{group.total}
              </span>
            ))
          )}
        </div>
      )}

      <button
        onClick={() => setIsEditing((value) => !value)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {isEditing ? 'Cancel' : 'Edit permissions'}
      </button>
    </div>
  )
}

/**
 * Platform-wide staff oversight. Staff the platform appoints belong to Possible
 * Technology and work across every owner, so there is no owner to choose here:
 * the account is created unattached and the admin decides exactly what it may do
 * with the permission grants. Accounts an owner created still appear here, each
 * labelled with the owner it belongs to.
 */
export function AdminStaff() {
  const log = useLogger('admin', 'AdminStaff')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<Record<string, ManagerPermission[]>>({})

  const { data, isLoading, isError, refetch } = useGetPlatformStaffQuery({
    page,
    limit: 20,
    search: search.trim() || undefined,
  })
  const [createStaff, { isLoading: isCreating }] = useCreatePlatformStaffMutation()
  const [setPermissions, { isLoading: isSavingPermissions }] = useSetPlatformStaffPermissionsMutation()
  const [setActive, { isLoading: isSavingActive }] = useSetPlatformStaffActiveMutation()

  const handleCreate = async (payload: CreateStaffPayload) => {
    await createStaff(payload).unwrap()
    setNotice(`${payload.fullName.trim()} can now sign in and work across every owner.`)
  }

  const handleTogglePermission = (staffId: string, permission: ManagerPermission) => {
    setDraft((current) => {
      const source =
        current[staffId] ?? data?.docs.find((s) => s.id === staffId)?.permissions ?? []
      const next = source.includes(permission)
        ? source.filter((p) => p !== permission)
        : [...source, permission]
      return { ...current, [staffId]: next }
    })
  }

  const discardDraft = (staffId: string) =>
    setDraft((current) => {
      const { [staffId]: _removed, ...rest } = current
      return rest
    })

  const handleSavePermissions = async (staffId: string) => {
    const next = draft[staffId]
    if (!next) return
    // Revoking everything locks the account out, so make that deliberate.
    if (
      next.length === 0 &&
      !window.confirm(
        'Save with no permissions? This person will be signed in but blocked from every action until you grant access again.'
      )
    ) {
      return
    }
    try {
      await setPermissions({ id: staffId, permissions: next }).unwrap()
      discardDraft(staffId)
      setNotice('Permissions updated. They take effect on the staff member\'s next request.')
    } catch (error) {
      const message = toErrorMessage(error)
      log.error('Could not update staff permissions', message)
      setNotice(message)
    }
  }

  const handleToggleActive = async (member: PlatformStaffMember) => {
    try {
      await setActive({ id: member.id, active: member.isSuspended }).unwrap()
      setNotice(
        member.isSuspended
          ? `${member.fullName} can sign in again (they will need to log in fresh).`
          : `${member.fullName} was deactivated and their session was ended.`
      )
    } catch (error) {
      const message = toErrorMessage(error)
      log.error('Could not change the staff account state', message)
      setNotice(message)
    }
  }

  const staff = data?.docs ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Staff management</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Every staff account on the platform, and exactly what each one may do.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add staff
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Staff you add here belong to Possible Technology and can work across <em>every</em> owner, limited
          only by the permissions you grant. Accounts an owner created for themselves are also listed, each
          labelled with the owner they belong to.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search name, phone or email"
          className="min-w-56 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold text-blue-500 hover:text-blue-700">
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading staff across all owners…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4" />
          Could not load staff. <button onClick={() => refetch()} className="font-bold underline">Retry</button>
        </div>
      )}

      {!isLoading && !isError && staff.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-slate-800">No staff accounts found</p>
          <p className="max-w-sm text-xs text-slate-500">
            {search
              ? 'No account matches the current search.'
              : 'Owners add their own staff from their portal; you can also appoint platform staff here.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {staff.map((member) => (
          <div key={member.id} className="space-y-2">
            <StaffRow
              staff={member}
              draftPermissions={draft[member.id] ?? member.permissions}
              onTogglePermission={(permission) => handleTogglePermission(member.id, permission)}
              onToggleActive={() => handleToggleActive(member)}
              isSavingActive={isSavingActive}
            />
            {draft[member.id] && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => discardDraft(member.id)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleSavePermissions(member.id)}
                  disabled={isSavingPermissions}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingPermissions && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save permissions
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {data?.page ?? page} of {totalPages} · {data?.total ?? 0} staff
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((value) => value + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Changes you make here are recorded with your account as the actor, so the owner sees them in their own
          Activity trail. Grants are enforced by the server on every request, not hidden in the interface.
        </p>
      </div>

      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
      {isCreating && <span className="sr-only">Adding staff…</span>}
    </div>
  )
}
