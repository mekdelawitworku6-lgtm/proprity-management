import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  Property,
  RentalAgreement,
  ComplaintReport,
  Tenant,
  Transaction,
  AuditLogEntry,
  UserProfile,
} from '../types'
import type { AppThunk } from './index'
import {
  initialProperties,
  initialTenants,
  initialTransactions,
  initialAgreements,
  initialComplaints,
  initialRegisteredOwners,
  initialAuditLogs,
} from '../data/mockData'
import { createLogger } from '../utils/logger'

const log = createLogger('data', 'platformSlice')
const audit = createLogger('actions', 'AuditTrail')

export type NewAgreement = Omit<
  RentalAgreement,
  'id' | 'agreementNumber' | 'signedByTenantAt' | 'digitalSignatureHash' | 'status'
>
export type NewComplaint = Omit<ComplaintReport, 'id' | 'code' | 'submittedAt' | 'status'>
export type NewPayment = Omit<Transaction, 'id' | 'code' | 'dateTime' | 'status'>

export interface PlatformState {
  properties: Property[]
  agreements: RentalAgreement[]
  complaints: ComplaintReport[]
  tenants: Tenant[]
  transactions: Transaction[]
  registeredOwners: UserProfile[]
  auditLogs: AuditLogEntry[]
}

const initialState: PlatformState = {
  properties: initialProperties,
  agreements: initialAgreements,
  complaints: initialComplaints,
  tenants: initialTenants,
  transactions: initialTransactions,
  registeredOwners: initialRegisteredOwners,
  auditLogs: initialAuditLogs,
}

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    propertyAdded(state, action: PayloadAction<Property>) {
      state.properties.unshift(action.payload)
    },
    propertyUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<Property> }>
    ) {
      const property = state.properties.find((p) => p.id === action.payload.id)
      if (property) Object.assign(property, action.payload.changes)
    },
    agreementCreated(state, action: PayloadAction<RentalAgreement>) {
      state.agreements.unshift(action.payload)
    },
    tenantAdded(state, action: PayloadAction<Tenant>) {
      state.tenants.unshift(action.payload)
    },
    complaintAdded(state, action: PayloadAction<ComplaintReport>) {
      state.complaints.unshift(action.payload)
    },
    complaintResolved(state, action: PayloadAction<{ id: string; notes?: string }>) {
      const complaint = state.complaints.find((c) => c.id === action.payload.id)
      if (!complaint) return
      complaint.status = 'Resolved'
      if (action.payload.notes) complaint.ownerNotes = action.payload.notes
    },
    complaintEscalated(state, action: PayloadAction<{ id: string; reason?: string }>) {
      const complaint = state.complaints.find((c) => c.id === action.payload.id)
      if (!complaint) return
      complaint.status = 'Escalated to Admin'
      if (action.payload.reason) complaint.ownerNotes = `Escalation note: ${action.payload.reason}`
    },
    disputeRuled(state, action: PayloadAction<{ id: string; ruling: string }>) {
      const complaint = state.complaints.find((c) => c.id === action.payload.id)
      if (!complaint) return
      complaint.status = 'Resolved'
      complaint.adminRuling = action.payload.ruling
    },
    transactionRecorded(state, action: PayloadAction<Transaction>) {
      state.transactions.unshift(action.payload)
    },
    tenantPaymentSettled(state, action: PayloadAction<string>) {
      const tenant = state.tenants.find((t) => t.tenantName === action.payload)
      if (tenant) tenant.paymentStatus = 'Current'
    },
    ownerStatusChanged(
      state,
      action: PayloadAction<{ ownerId: string; status: UserProfile['status'] }>
    ) {
      const owner = state.registeredOwners.find((o) => o.id === action.payload.ownerId)
      if (owner) owner.status = action.payload.status
    },
    tenantStatusChanged(state, action: PayloadAction<{ tenantId: string; status: Tenant['status'] }>) {
      const tenant = state.tenants.find((t) => t.id === action.payload.tenantId)
      if (tenant) tenant.status = action.payload.status
    },
    auditLogAdded(state, action: PayloadAction<AuditLogEntry>) {
      state.auditLogs.unshift(action.payload)
    },
  },
})

export const {
  propertyAdded,
  propertyUpdated,
  agreementCreated,
  tenantAdded,
  complaintAdded,
  complaintResolved,
  complaintEscalated,
  disputeRuled,
  transactionRecorded,
  tenantPaymentSettled,
  ownerStatusChanged,
  tenantStatusChanged,
  auditLogAdded,
} = platformSlice.actions
export default platformSlice.reducer

function now(): string {
  return new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }) + ' EAT'
}

interface AuditInput {
  actorId: string
  actorName: string
  actorRole: AuditLogEntry['actorRole']
  action: string
  entityType: AuditLogEntry['entityType']
  details: string
}

export const addAuditLog = (input: AuditInput): AppThunk => (dispatch) => {
  dispatch(
    auditLogAdded({
      id: `log-${Date.now()}`,
      timestamp: now(),
      ipAddress: '197.156.70.12',
      ...input,
    })
  )
  audit.info(`${input.action} on ${input.entityType}`, {
    actor: input.actorName,
    role: input.actorRole,
    details: input.details,
  })
}

export const addProperty =
  (propData: Partial<Property>): AppThunk =>
  (dispatch) => {
    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      ownerId: 'user-owner-1',
      name: propData.name || 'New Property Compound',
      manager: propData.manager || 'Property Manager',
      address: propData.address || 'Addis Ababa',
      woredaSubCity: propData.woredaSubCity || 'Bole',
      propertyType: propData.propertyType || 'Residential',
      squareMeters: propData.squareMeters || 600,
      leasePrice: propData.leasePrice || 6000,
      totalUnits: propData.totalUnits || 12,
      occupiedUnits: propData.occupiedUnits || 10,
      floors: propData.floors || 8,
      yearBuilt: propData.yearBuilt || 2023,
      monthlyRevenue: (propData.leasePrice || 6000) * (propData.totalUnits || 12),
      status: 'Active',
      description: propData.description || '',
      amenities: propData.amenities || ['Parking', 'Elevator', 'Security'],
      imageUrl:
        propData.imageUrl ||
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    }
    dispatch(propertyAdded(newProperty))
    log.info('property added', {
      id: newProperty.id,
      name: newProperty.name,
      units: newProperty.totalUnits,
    })
    dispatch(
      addAuditLog({
        actorId: 'user-owner-1',
        actorName: 'Abebe Tadesse',
        actorRole: 'owner',
        action: 'PROPERTY_CREATED',
        entityType: 'Property',
        details: `Added new property: ${newProperty.name}`,
      })
    )
  }

export const updateProperty =
  (id: string, propData: Partial<Property>): AppThunk =>
  (dispatch) => {
    dispatch(propertyUpdated({ id, changes: propData }))
    log.info('property updated', { id, changed: Object.keys(propData) })
    dispatch(
      addAuditLog({
        actorId: 'user-owner-1',
        actorName: 'Abebe Tadesse',
        actorRole: 'owner',
        action: 'PROPERTY_UPDATED',
        entityType: 'Property',
        details: `Updated property specs for ${propData.name || id}`,
      })
    )
  }

export const createRentalAgreement =
  (data: NewAgreement): AppThunk<RentalAgreement> =>
  (dispatch, getState) => {
    const nextCode = `AGR-2026-${String(getState().platform.agreements.length + 1).padStart(4, '0')}`
    const signedAt = now()
    const newAgreement: RentalAgreement = {
      ...data,
      id: `agr-${Date.now()}`,
      agreementNumber: nextCode,
      signedByTenantAt: signedAt,
      signedByOwnerAt: signedAt,
      status: 'Active',
      digitalSignatureHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random()
        .toString(16)
        .substring(2, 10)}`,
    }

    dispatch(agreementCreated(newAgreement))
    log.info('agreement digitally signed', {
      code: nextCode,
      property: data.propertyName,
      unit: data.unitNo,
      rent: data.monthlyRent,
    })

    const property = getState().platform.properties.find((p) => p.id === data.propertyId)
    if (property) {
      dispatch(
        propertyUpdated({
          id: property.id,
          changes: { occupiedUnits: Math.min(property.totalUnits, property.occupiedUnits + 1) },
        })
      )
    }

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      unitNo: data.unitNo,
      tenantName: data.tenantName,
      buildingName: data.propertyName,
      propertyId: data.propertyId,
      tenantType: 'Individual',
      contactPhone: data.tenantPhone,
      contactEmail: `${data.tenantName.toLowerCase().replace(/\s+/g, '.')}@ethio.et`,
      leaseType: 'Standard (12 mo)',
      leaseStart: data.leaseStart,
      leaseEnd: data.leaseEnd,
      monthlyRent: data.monthlyRent,
      paymentStatus: 'Current',
      status: 'Active',
    }
    dispatch(tenantAdded(newTenant))

    dispatch(
      addAuditLog({
        actorId: data.tenantId,
        actorName: data.tenantName,
        actorRole: 'tenant',
        action: 'AGREEMENT_DIGITALLY_SIGNED',
        entityType: 'Agreement',
        details: `Signed agreement ${nextCode} for ${data.propertyName} ${data.unitNo} (${data.monthlyRent.toLocaleString()} ETB/mo)`,
      })
    )

    return newAgreement
  }

export const submitComplaint =
  (data: NewComplaint): AppThunk =>
  (dispatch, getState) => {
    const nextCode = `CMP-2026-${String(getState().platform.complaints.length + 1).padStart(3, '0')}`
    dispatch(
      complaintAdded({
        ...data,
        id: `cmp-${Date.now()}`,
        code: nextCode,
        submittedAt: now(),
        status: 'Open',
      })
    )
    log.info('complaint submitted', {
      code: nextCode,
      category: data.category,
      priority: data.priority,
    })
    dispatch(
      addAuditLog({
        actorId: data.tenantId || 'tenant-anon',
        actorName: data.tenantName,
        actorRole: 'tenant',
        action: 'COMPLAINT_SUBMITTED',
        entityType: 'Complaint',
        details: `Submitted complaint ${nextCode}: ${data.issueSummary} (${data.propertyName || data.buildingName || 'Property'})`,
      })
    )
  }

export const resolveComplaint =
  (id: string, notes?: string): AppThunk =>
  (dispatch) => {
    dispatch(complaintResolved({ id, notes }))
    log.info('complaint resolved', { id, notes: notes ?? 'none' })
    dispatch(
      addAuditLog({
        actorId: 'user-owner-1',
        actorName: 'Abebe Tadesse',
        actorRole: 'owner',
        action: 'COMPLAINT_RESOLVED',
        entityType: 'Complaint',
        details: `Marked complaint ${id} as Resolved.`,
      })
    )
  }

export const escalateComplaint =
  (id: string, reason?: string): AppThunk =>
  (dispatch) => {
    dispatch(complaintEscalated({ id, reason }))
    log.warn('complaint escalated to admin', { id, reason: reason ?? 'none' })
    dispatch(
      addAuditLog({
        actorId: 'user-owner-1',
        actorName: 'Abebe Tadesse',
        actorRole: 'owner',
        action: 'COMPLAINT_ESCALATED_TO_ADMIN',
        entityType: 'Complaint',
        details: `Escalated dispute ${id} to Possible Tech Admin arbitration.`,
      })
    )
  }

export const ruleOnDispute =
  (id: string, ruling: string): AppThunk =>
  (dispatch) => {
    dispatch(disputeRuled({ id, ruling }))
    log.info('admin dispute ruling issued', { id, ruling })
    dispatch(
      addAuditLog({
        actorId: 'user-admin-1',
        actorName: 'Tewodros Kassahun',
        actorRole: 'admin',
        action: 'ADMIN_DISPUTE_RULING',
        entityType: 'Complaint',
        details: `Issued regulatory dispute ruling on ${id}: ${ruling}`,
      })
    )
  }

export const recordPayment =
  (paymentData: NewPayment): AppThunk =>
  (dispatch, getState) => {
    const nextCode = `TXN-2026-${String(getState().platform.transactions.length + 1034)}`
    const ethioRef = `ETHIO-TEL-${Math.floor(100000 + Math.random() * 900000)}`
    dispatch(
      transactionRecorded({
        ...paymentData,
        id: `tx-${Date.now()}`,
        code: nextCode,
        dateTime: new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }),
        status: 'Completed',
        ethioTelecomConfirmationId: ethioRef,
      })
    )
    log.info('payment recorded', {
      code: nextCode,
      tenant: paymentData.tenantName,
      amount: paymentData.amount,
      method: paymentData.method,
      ethioTelecomRef: ethioRef,
    })

    dispatch(tenantPaymentSettled(paymentData.tenantName))

    dispatch(
      addAuditLog({
        actorId: paymentData.tenantId || 'user-tenant-1',
        actorName: paymentData.tenantName,
        actorRole: 'tenant',
        action: 'RENT_PAYMENT_PROCESSED',
        entityType: 'Payment',
        details: `Processed ${paymentData.method} payment of ${paymentData.amount.toLocaleString()} ETB for ${paymentData.buildingName} (Ethio Telecom Ref: ${ethioRef})`,
      })
    )
  }

export const toggleOwnerStatus =
  (ownerId: string, status: UserProfile['status']): AppThunk =>
  (dispatch) => {
    dispatch(ownerStatusChanged({ ownerId, status }))
    log.info('owner status changed', { ownerId, status })
    dispatch(
      addAuditLog({
        actorId: 'user-admin-1',
        actorName: 'Tewodros Kassahun',
        actorRole: 'admin',
        action: status === 'Suspended' ? 'OWNER_ACCOUNT_SUSPENDED' : 'OWNER_ACCOUNT_ACTIVATED',
        entityType: 'User',
        details: `Changed owner account ${ownerId} status to ${status}`,
      })
    )
  }

export const toggleTenantStatus =
  (tenantId: string, status: Tenant['status']): AppThunk =>
  (dispatch) => {
    dispatch(tenantStatusChanged({ tenantId, status }))
    log.info('tenant status changed', { tenantId, status })
    dispatch(
      addAuditLog({
        actorId: 'user-admin-1',
        actorName: 'Tewodros Kassahun',
        actorRole: 'admin',
        action: 'TENANT_STATUS_MODIFIED',
        entityType: 'User',
        details: `Modified tenant ${tenantId} status to ${status}`,
      })
    )
  }
