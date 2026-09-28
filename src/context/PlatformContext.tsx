import React, { createContext, useContext, useState } from 'react'
import type {
  Property,
  RentalAgreement,
  ComplaintReport,
  Tenant,
  Transaction,
  AuditLogEntry,
  UserProfile,
} from '../types'
import {
  initialProperties,
  initialTenants,
  initialTransactions,
} from '../data/mockData'
import { useLogger } from '../utils/logger'

const initialAgreements: RentalAgreement[] = [
  {
    id: 'agr-1',
    agreementNumber: 'AGR-2025-0091',
    propertyId: 'prop-1',
    propertyName: 'Building A - Bole Plaza',
    unitNo: 'Unit A-201',
    ownerId: 'user-owner-1',
    ownerName: 'Abebe Tadesse',
    tenantId: 'user-tenant-1',
    tenantName: 'Abebe Kebede',
    tenantPhone: '+251-911-234567',
    monthlyRent: 13500,
    securityDeposit: 27000,
    leaseStart: '2025-01-15',
    leaseEnd: '2026-01-14',
    terms: '12-month standard residential tenancy agreement compliant with Federal Housing Directives.',
    signedByTenantAt: '2025-01-15 14:32 EAT',
    signedByOwnerAt: '2025-01-15 15:10 EAT',
    status: 'Active',
    digitalSignatureHash: '0x88f92a1c7e902b4d99e120aa45b1',
  },
  {
    id: 'agr-2',
    agreementNumber: 'AGR-2024-0045',
    propertyId: 'prop-4',
    propertyName: 'Building B - Kazanchis Heights',
    unitNo: 'Unit B-305',
    ownerId: 'user-owner-1',
    ownerName: 'Abebe Tadesse',
    tenantId: 'user-tenant-2',
    tenantName: 'Yonas Bekele',
    tenantPhone: '+251-912-478654',
    monthlyRent: 15500,
    securityDeposit: 31000,
    leaseStart: '2024-07-15',
    leaseEnd: '2026-07-14',
    terms: '24-month long-term family lease agreement with fixed maintenance covenants.',
    signedByTenantAt: '2024-07-15 10:15 EAT',
    signedByOwnerAt: '2024-07-15 11:00 EAT',
    status: 'Active',
    digitalSignatureHash: '0x12a9c390ef1987d643190bbfac78',
  },
  {
    id: 'agr-3',
    agreementNumber: 'AGR-2025-0112',
    propertyId: 'prop-2',
    propertyName: 'Building C - CMC Towers',
    unitNo: 'Unit C-101',
    ownerId: 'user-owner-2',
    ownerName: 'Dawit Bekele',
    tenantId: 'user-tenant-3',
    tenantName: 'Hanna Solomon',
    tenantPhone: '+251-914-666777',
    monthlyRent: 12000,
    securityDeposit: 24000,
    leaseStart: '2025-03-01',
    leaseEnd: '2026-02-28',
    terms: '12-month standard residential tenancy agreement.',
    signedByTenantAt: '2025-03-01 09:20 EAT',
    signedByOwnerAt: '2025-03-01 10:05 EAT',
    status: 'Active',
    digitalSignatureHash: '0x44b9e28f780011bbda334190cce1',
  },
]

const initialComplaints: ComplaintReport[] = [
  {
    id: 'cmp-1',
    code: 'CMP-2026-001',
    propertyId: 'prop-1',
    propertyName: 'Building A - Bole Plaza',
    unitNumber: 'Unit B-204',
    tenantId: 'user-tenant-1',
    tenantName: 'Yonas Bekele',
    category: 'Plumbing',
    issueSummary: 'Plumbing leak in bathroom pipe',
    description: 'Water leaking from bathroom sink pipe. Needs urgent technician attention.',
    priority: 'Urgent',
    status: 'In Progress',
    submittedAt: '2026-03-10 08:30 EAT',
    assignedTechnician: 'Mulugeta Tadesse',
    ownerNotes: 'Technician dispatched to replace valve gaskets.',
  },
  {
    id: 'cmp-2',
    code: 'CMP-2026-002',
    propertyId: 'prop-2',
    propertyName: 'Building C - CMC Towers',
    unitNumber: 'Unit C-101',
    tenantId: 'user-tenant-3',
    tenantName: 'Hanna Solomon',
    category: 'HVAC',
    issueSummary: 'AC unit not cooling effectively',
    description: 'Air conditioner is humming but cooling fan appears defective.',
    priority: 'Medium',
    status: 'Open',
    submittedAt: '2026-03-11 11:15 EAT',
    assignedTechnician: 'Dawit Mengistu',
  },
  {
    id: 'cmp-3',
    code: 'CMP-2026-003',
    propertyId: 'prop-4',
    propertyName: 'Building B - Kazanchis Heights',
    unitNumber: 'Unit B-302',
    tenantId: 'user-tenant-4',
    tenantName: 'Badredin Haille',
    category: 'Lease Dispute',
    issueSummary: 'Utility sub-meter calculation dispute',
    description: 'Billed for communal hallway lighting electricity disproportionately.',
    priority: 'High',
    status: 'Escalated to Admin',
    submittedAt: '2026-03-08 14:00 EAT',
    ownerNotes: 'Dispute over sub-meter calibration escalated for regulatory review.',
    adminRuling: 'Arbitration hearing scheduled with Ethio Telecom Power Audit Team.',
  },
]

const initialRegisteredOwners: UserProfile[] = [
  {
    id: 'user-owner-1',
    name: 'Abebe Tadesse',
    email: 'owner@boleplaza.et',
    role: 'owner',
    phone: '+251-911-234567',
    organization: 'Bole Plaza Real Estate LLC',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
  },
  {
    id: 'user-owner-2',
    name: 'Dawit Bekele',
    email: 'dawit@cmctowers.et',
    role: 'owner',
    phone: '+251-911-554433',
    organization: 'CMC Towers Property Group',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
  },
  {
    id: 'user-owner-3',
    name: 'Solomon Haile',
    email: 'solomon@lidetaresidences.et',
    role: 'owner',
    phone: '+251-912-332211',
    organization: 'Lideta Housing Developers',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
  },
  {
    id: 'user-owner-4',
    name: 'Girum Mengistu',
    email: 'girum@sarbetcondos.et',
    role: 'owner',
    phone: '+251-913-778899',
    organization: 'Sarbet Development PLC',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    status: 'Pending Verification',
  },
]

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-03-26 14:02:11 EAT',
    actorId: 'user-tenant-1',
    actorName: 'Abebe Kebede',
    actorRole: 'tenant',
    action: 'DIGITAL_RENT_PAYMENT_TELEBIRR',
    entityType: 'Payment',
    details: 'Paid 13,500 ETB for Unit A-201 via Telebirr (Ref: TXN8293041). Ethio Telecom Confirmed.',
    ipAddress: '197.156.104.22',
  },
  {
    id: 'log-2',
    timestamp: '2026-03-26 11:15:40 EAT',
    actorId: 'user-owner-1',
    actorName: 'Abebe Tadesse',
    actorRole: 'owner',
    action: 'COMPLAINT_ESCALATED',
    entityType: 'Complaint',
    details: 'Escalated complaint CMP-2026-003 to Possible Tech Admin for official arbitration.',
    ipAddress: '196.188.62.14',
  },
  {
    id: 'log-3',
    timestamp: '2026-03-25 16:45:00 EAT',
    actorId: 'user-admin-1',
    actorName: 'Tewodros Kassahun',
    actorRole: 'admin',
    action: 'OWNER_ACCOUNT_VERIFIED',
    entityType: 'User',
    details: 'Verified license and approved Bole Plaza Real Estate LLC platform standing.',
    ipAddress: '213.55.98.10',
  },
]

interface PlatformContextType {
  properties: Property[]
  agreements: RentalAgreement[]
  complaints: ComplaintReport[]
  tenants: Tenant[]
  transactions: Transaction[]
  registeredOwners: UserProfile[]
  auditLogs: AuditLogEntry[]
  
  // Actions
  addProperty: (property: Partial<Property>) => void
  updateProperty: (id: string, property: Partial<Property>) => void
  createRentalAgreement: (data: Omit<RentalAgreement, 'id' | 'agreementNumber' | 'signedByTenantAt' | 'digitalSignatureHash' | 'status'>) => RentalAgreement
  submitComplaint: (data: Omit<ComplaintReport, 'id' | 'code' | 'submittedAt' | 'status'>) => void
  resolveComplaint: (id: string, notes?: string) => void
  escalateComplaint: (id: string, reason?: string) => void
  ruleOnDispute: (id: string, ruling: string) => void
  recordPayment: (payment: Omit<Transaction, 'id' | 'code' | 'dateTime' | 'status'>) => void
  toggleOwnerStatus: (ownerId: string, status: UserProfile['status']) => void
  toggleTenantStatus: (tenantId: string, status: Tenant['status']) => void
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined)

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const log = useLogger('data', 'PlatformProvider')
  const audit = useLogger('actions', 'AuditTrail')
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [agreements, setAgreements] = useState<RentalAgreement[]>(initialAgreements)
  const [complaints, setComplaints] = useState<ComplaintReport[]>(initialComplaints)
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [registeredOwners, setRegisteredOwners] = useState<UserProfile[]>(initialRegisteredOwners)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs)

  const addAuditLog = (
    actorId: string,
    actorName: string,
    actorRole: AuditLogEntry['actorRole'],
    action: string,
    entityType: AuditLogEntry['entityType'],
    details: string
  ) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }) + ' EAT',
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      details,
      ipAddress: '197.156.70.12',
    }
    setAuditLogs((prev) => [newLog, ...prev])
    audit.info(`${action} on ${entityType}`, { actor: actorName, role: actorRole, details })
  }

  const addProperty = (propData: Partial<Property>) => {
    const newProp: Property = {
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
      imageUrl: propData.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    }
    setProperties((prev) => [newProp, ...prev])
    log.info('property added', { id: newProp.id, name: newProp.name, units: newProp.totalUnits })
    addAuditLog('user-owner-1', 'Abebe Tadesse', 'owner', 'PROPERTY_CREATED', 'Property', `Added new property: ${newProp.name}`)
  }

  const updateProperty = (id: string, propData: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? ({ ...p, ...propData } as Property) : p))
    )
    log.info('property updated', { id, changed: Object.keys(propData) })
    addAuditLog('user-owner-1', 'Abebe Tadesse', 'owner', 'PROPERTY_UPDATED', 'Property', `Updated property specs for ${propData.name || id}`)
  }

  const createRentalAgreement = (
    data: Omit<RentalAgreement, 'id' | 'agreementNumber' | 'signedByTenantAt' | 'digitalSignatureHash' | 'status'>
  ) => {
    const nextCode = `AGR-2026-${String(agreements.length + 1).padStart(4, '0')}`
    const now = new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }) + ' EAT'
    const newAgreement: RentalAgreement = {
      ...data,
      id: `agr-${Date.now()}`,
      agreementNumber: nextCode,
      signedByTenantAt: now,
      signedByOwnerAt: now,
      status: 'Active',
      digitalSignatureHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    }

    setAgreements((prev) => [newAgreement, ...prev])
    log.info('agreement digitally signed', {
      code: nextCode,
      property: data.propertyName,
      unit: data.unitNo,
      rent: data.monthlyRent,
    })

    // Update Property occupancy
    setProperties((prev) =>
      prev.map((p) =>
        p.id === data.propertyId
          ? { ...p, occupiedUnits: Math.min(p.totalUnits, p.occupiedUnits + 1) }
          : p
      )
    )

    // Add Tenant record
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
    setTenants((prev) => [newTenant, ...prev])

    addAuditLog(
      data.tenantId,
      data.tenantName,
      'tenant',
      'AGREEMENT_DIGITALLY_SIGNED',
      'Agreement',
      `Signed agreement ${nextCode} for ${data.propertyName} ${data.unitNo} (${data.monthlyRent.toLocaleString()} ETB/mo)`
    )

    return newAgreement
  }

  const submitComplaint = (
    data: Omit<ComplaintReport, 'id' | 'code' | 'submittedAt' | 'status'>
  ) => {
    const nextCode = `CMP-2026-${String(complaints.length + 1).padStart(3, '0')}`
    const newComplaint: ComplaintReport = {
      ...data,
      id: `cmp-${Date.now()}`,
      code: nextCode,
      submittedAt: new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }) + ' EAT',
      status: 'Open',
    }
    setComplaints((prev) => [newComplaint, ...prev])
    log.info('complaint submitted', { code: nextCode, category: data.category, priority: data.priority })
    addAuditLog(
      data.tenantId || 'tenant-anon',
      data.tenantName,
      'tenant',
      'COMPLAINT_SUBMITTED',
      'Complaint',
      `Submitted complaint ${nextCode}: ${data.issueSummary} (${data.propertyName || data.buildingName || 'Property'})`
    )
  }

  const resolveComplaint = (id: string, notes?: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'Resolved', ownerNotes: notes || c.ownerNotes } : c
      )
    )
    log.info('complaint resolved', { id, notes: notes ?? 'none' })
    addAuditLog('user-owner-1', 'Abebe Tadesse', 'owner', 'COMPLAINT_RESOLVED', 'Complaint', `Marked complaint ${id} as Resolved.`)
  }

  const escalateComplaint = (id: string, reason?: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'Escalated to Admin',
              ownerNotes: reason ? `Escalation note: ${reason}` : c.ownerNotes,
            }
          : c
      )
    )
    log.warn('complaint escalated to admin', { id, reason: reason ?? 'none' })
    addAuditLog(
      'user-owner-1',
      'Abebe Tadesse',
      'owner',
      'COMPLAINT_ESCALATED_TO_ADMIN',
      'Complaint',
      `Escalated dispute ${id} to Possible Tech Admin arbitration.`
    )
  }

  const ruleOnDispute = (id: string, ruling: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'Resolved',
              adminRuling: ruling,
            }
          : c
      )
    )
    log.info('admin dispute ruling issued', { id, ruling })
    addAuditLog(
      'user-admin-1',
      'Tewodros Kassahun',
      'admin',
      'ADMIN_DISPUTE_RULING',
      'Complaint',
      `Issued regulatory dispute ruling on ${id}: ${ruling}`
    )
  }

  const recordPayment = (
    paymentData: Omit<Transaction, 'id' | 'code' | 'dateTime' | 'status'>
  ) => {
    const nextCode = `TXN-2026-${String(transactions.length + 1034)}`
    const ethioRef = `ETHIO-TEL-${Math.floor(100000 + Math.random() * 900000)}`
    const newTx: Transaction = {
      ...paymentData,
      id: `tx-${Date.now()}`,
      code: nextCode,
      dateTime: new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }),
      status: 'Completed',
      ethioTelecomConfirmationId: ethioRef,
    }

    setTransactions((prev) => [newTx, ...prev])
    log.info('payment recorded', {
      code: nextCode,
      tenant: paymentData.tenantName,
      amount: paymentData.amount,
      method: paymentData.method,
      ethioTelecomRef: ethioRef,
    })

    // Update tenant payment status to Current
    setTenants((prev) =>
      prev.map((t) =>
        t.tenantName === paymentData.tenantName ? { ...t, paymentStatus: 'Current' } : t
      )
    )

    addAuditLog(
      paymentData.tenantId || 'user-tenant-1',
      paymentData.tenantName,
      'tenant',
      'RENT_PAYMENT_PROCESSED',
      'Payment',
      `Processed ${paymentData.method} payment of ${paymentData.amount.toLocaleString()} ETB for ${paymentData.buildingName} (Ethio Telecom Ref: ${ethioRef})`
    )
  }

  const toggleOwnerStatus = (ownerId: string, status: UserProfile['status']) => {
    setRegisteredOwners((prev) =>
      prev.map((o) => (o.id === ownerId ? { ...o, status } : o))
    )
    log.info('owner status changed', { ownerId, status })
    addAuditLog(
      'user-admin-1',
      'Tewodros Kassahun',
      'admin',
      status === 'Suspended' ? 'OWNER_ACCOUNT_SUSPENDED' : 'OWNER_ACCOUNT_ACTIVATED',
      'User',
      `Changed owner account ${ownerId} status to ${status}`
    )
  }

  const toggleTenantStatus = (tenantId: string, status: Tenant['status']) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status } : t))
    )
    log.info('tenant status changed', { tenantId, status })
    addAuditLog(
      'user-admin-1',
      'Tewodros Kassahun',
      'admin',
      'TENANT_STATUS_MODIFIED',
      'User',
      `Modified tenant ${tenantId} status to ${status}`
    )
  }

  return (
    <PlatformContext.Provider
      value={{
        properties,
        agreements,
        complaints,
        tenants,
        transactions,
        registeredOwners,
        auditLogs,
        addProperty,
        updateProperty,
        createRentalAgreement,
        submitComplaint,
        resolveComplaint,
        escalateComplaint,
        ruleOnDispute,
        recordPayment,
        toggleOwnerStatus,
        toggleTenantStatus,
      }}
    >
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider')
  }
  return context
}
