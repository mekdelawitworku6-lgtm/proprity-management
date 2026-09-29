import type { UserRole } from '../types/api'

/** Landing page per backend role. */
export const HOME_FOR: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  TELECOM: '/admin/dashboard',
  OWNER: '/owner/dashboard',
  MANAGER: '/owner/dashboard',
  TENANT: '/tenant/dashboard',
}
