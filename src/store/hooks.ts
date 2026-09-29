import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './index'
import * as auth from './authSlice'
import * as platform from './platformSlice'
import type { PublicUser, UserRole } from '../types/api'
import type {
  RentalAgreement,
  ComplaintReport,
  Tenant,
  Transaction,
  AuditLogEntry,
  UserProfile,
  Property,
} from '../types'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export interface AuthContextType {
  currentUser: PublicUser | null
  isAuthenticated: boolean
  isRestoring: boolean
  isSubmitting: boolean
  error: string | null
  fieldErrors: Record<string, string>
  login: (credentials: { identifier: string; password: string }) => Promise<PublicUser | undefined>
  logout: () => Promise<void>
  clearError: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

export function useAuth(): AuthContextType {
  const dispatch = useAppDispatch()
  const { currentUser, isRestoring, isSubmitting, error, fieldErrors } = useAppSelector(
    (state) => state.auth
  )

  return useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      isRestoring,
      isSubmitting,
      error,
      fieldErrors,
      login: async (credentials) => {
        try {
          return await dispatch(auth.login(credentials)).unwrap()
        } catch {
          return undefined
        }
      },
      logout: async () => {
        await dispatch(auth.logout())
      },
      clearError: () => {
        dispatch(auth.authErrorCleared())
      },
      hasRole: (...roles) => auth.hasRole(currentUser, ...roles),
    }),
    [dispatch, currentUser, isRestoring, isSubmitting, error, fieldErrors]
  )
}

export interface PlatformContextType {
  properties: Property[]
  agreements: RentalAgreement[]
  complaints: ComplaintReport[]
  tenants: Tenant[]
  transactions: Transaction[]
  registeredOwners: UserProfile[]
  auditLogs: AuditLogEntry[]

  addProperty: (property: Partial<Property>) => void
  updateProperty: (id: string, property: Partial<Property>) => void
  createRentalAgreement: (data: platform.NewAgreement) => RentalAgreement
  submitComplaint: (data: platform.NewComplaint) => void
  resolveComplaint: (id: string, notes?: string) => void
  escalateComplaint: (id: string, reason?: string) => void
  ruleOnDispute: (id: string, ruling: string) => void
  recordPayment: (payment: platform.NewPayment) => void
  toggleOwnerStatus: (ownerId: string, status: UserProfile['status']) => void
  toggleTenantStatus: (tenantId: string, status: Tenant['status']) => void
}

export function usePlatform(): PlatformContextType {
  const dispatch = useAppDispatch()
  const properties = useAppSelector((state) => state.platform.properties)
  const agreements = useAppSelector((state) => state.platform.agreements)
  const complaints = useAppSelector((state) => state.platform.complaints)
  const tenants = useAppSelector((state) => state.platform.tenants)
  const transactions = useAppSelector((state) => state.platform.transactions)
  const registeredOwners = useAppSelector((state) => state.platform.registeredOwners)
  const auditLogs = useAppSelector((state) => state.platform.auditLogs)

  return useMemo(
    () => ({
      properties,
      agreements,
      complaints,
      tenants,
      transactions,
      registeredOwners,
      auditLogs,
      addProperty: (property: Partial<Property>) => {
        dispatch(platform.addProperty(property))
      },
      updateProperty: (id: string, property: Partial<Property>) => {
        dispatch(platform.updateProperty(id, property))
      },
      createRentalAgreement: (data: platform.NewAgreement) =>
        dispatch(platform.createRentalAgreement(data)),
      submitComplaint: (data: platform.NewComplaint) => {
        dispatch(platform.submitComplaint(data))
      },
      resolveComplaint: (id: string, notes?: string) => {
        dispatch(platform.resolveComplaint(id, notes))
      },
      escalateComplaint: (id: string, reason?: string) => {
        dispatch(platform.escalateComplaint(id, reason))
      },
      ruleOnDispute: (id: string, ruling: string) => {
        dispatch(platform.ruleOnDispute(id, ruling))
      },
      recordPayment: (payment: platform.NewPayment) => {
        dispatch(platform.recordPayment(payment))
      },
      toggleOwnerStatus: (ownerId: string, status: UserProfile['status']) => {
        dispatch(platform.toggleOwnerStatus(ownerId, status))
      },
      toggleTenantStatus: (tenantId: string, status: Tenant['status']) => {
        dispatch(platform.toggleTenantStatus(tenantId, status))
      },
    }),
    [
      dispatch,
      properties,
      agreements,
      complaints,
      tenants,
      transactions,
      registeredOwners,
      auditLogs,
    ]
  )
}
