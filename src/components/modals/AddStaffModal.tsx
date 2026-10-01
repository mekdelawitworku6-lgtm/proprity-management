import { useMemo, useState } from 'react'
import { X, Loader2, AlertCircle, UserPlus } from 'lucide-react'
import { toErrorMessage } from '../../store/api'
import { useLogger } from '../../utils/logger'
import {
  MANAGER_PERMISSIONS,
  MANAGER_PERMISSION_GROUPS,
  type CreateStaffPayload,
  type ManagerPermission,
} from '../../types/api'

export interface StaffOwnerOption {
  id: string
  label: string
}

/** `ownerId` is only present when the caller manages more than one portfolio. */
export type AddStaffRequest = CreateStaffPayload & { ownerId?: string }

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: AddStaffRequest) => Promise<void>
  /**
   * When provided, the caller manages more than one portfolio, so the owner has
   * to be named and is sent back as `ownerId` on the payload.
   */
  owners?: StaffOwnerOption[]
}

/**
 * Adds a staff account and chooses exactly what it may do. Grants are always sent
 * explicitly, because the server treats a missing list as "allow everything".
 */
export function AddStaffModal({ isOpen, onClose, onSubmit, owners }: Props) {
  const log = useLogger('modals', 'AddStaffModal')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permissions, setPermissions] = useState<ManagerPermission[]>([...MANAGER_PERMISSIONS])
  const [ownerId, setOwnerId] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const needsOwner = Boolean(owners?.length)
  const grantedCount = permissions.length
  const hasEveryGrant = grantedCount === MANAGER_PERMISSIONS.length

  /** Read-only presets, because "everything" and "nothing" are the two common intents. */
  const PRESETS: { label: string; value: ManagerPermission[] }[] = useMemo(
    () => [
      { label: 'Full access', value: [...MANAGER_PERMISSIONS] },
      { label: 'Read only', value: MANAGER_PERMISSION_GROUPS.flatMap((g) => g.permissions).filter((p) => p.endsWith('_VIEW')) },
      { label: 'None', value: [] },
    ],
    []
  )

  if (!isOpen) return null

  const toggle = (permission: ManagerPermission) =>
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission]
    )

  const handleClose = () => {
    setSubmitError(null)
    setFullName('')
    setPhoneNumber('')
    setEmail('')
    setPassword('')
    setOwnerId('')
    setPermissions([...MANAGER_PERMISSIONS])
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    setIsSaving(true)
    try {
      await onSubmit({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        password,
        permissions,
        ...(needsOwner ? { ownerId } : {}),
      })
      handleClose()
    } catch (error) {
      const message = toErrorMessage(error)
      log.error('Could not add the staff account', message)
      setSubmitError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="mt-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">Add staff</h2>
              <p className="text-xs text-slate-500">
                Staff act on your portfolio. You decide what each person may do.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {needsOwner && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Works for owner</span>
              <select
                required
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Choose an owner…</option>
                {owners?.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">
                The account is attributed to this owner and appears in their activity trail.
              </p>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</span>
              <input
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sara Alemu"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Phone number</span>
              <input
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0922334455"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Email <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sara@company.et"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Temporary password</span>
              <input
                required
                minLength={8}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters, with a letter and a digit"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Permissions</span>
              <div className="flex items-center gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPermissions(preset.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-3 text-[11px] text-slate-500">
              {hasEveryGrant
                ? 'Full access to everything you can do.'
                : `${grantedCount} of ${MANAGER_PERMISSIONS.length} granted — anything not ticked is refused by the server.`}
            </p>

            <div className="space-y-3">
              {MANAGER_PERMISSION_GROUPS.map((group) => (
                <fieldset key={group.area} className="rounded-xl border border-slate-200 p-3">
                  <legend className="px-1.5 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    {group.area}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(permission)}
                          onChange={() => toggle(permission)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs">
                          <span className="block font-semibold text-slate-700">
                            {permission.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !fullName.trim() || !phoneNumber.trim() || password.length < 8 || (needsOwner && !ownerId)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add staff
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
