export type UserRole = 'owner' | 'admin'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  organization?: string // e.g. "Possible Technology", "Ethio Telecom", "Bole Plaza LLC"
  avatarUrl?: string
  status: 'Active' | 'Suspended' | 'Pending Verification'
}

export interface Property {
  id: string
  ownerId?: string
  name: string
  manager: string
  address: string
  woredaSubCity: string
  propertyType: 'Residential' | 'Commercial' | 'Mixed Use' | 'Condominium'
  squareMeters: number
  leasePrice: number
  totalUnits: number
  occupiedUnits: number
  floors: number
  yearBuilt: number
  monthlyRevenue: number
  status: 'Active' | 'Under Maintenance' | 'Pending Approval' | 'Suspended'
  description?: string
  amenities: string[]
  imageUrl: string
}

export interface RentalAgreement {
  id: string
  agreementNumber: string // e.g. "AGR-2026-0091"
  propertyId: string
  propertyName: string
  unitNo: string
  ownerId: string
  ownerName: string
  tenantId: string
  tenantName: string
  tenantPhone: string
  monthlyRent: number
  securityDeposit: number
  leaseStart: string
  leaseEnd: string
  terms: string
  signedByTenantAt: string
  signedByOwnerAt?: string
  status: 'Active' | 'Pending Signature' | 'Terminated' | 'Disputed'
  digitalSignatureHash: string
}

export interface ComplaintReport {
  id: string
  code: string // e.g. "CMP-2026-012"
  propertyId?: string
  propertyName?: string
  buildingName?: string
  unitNumber: string
  tenantId?: string
  tenantName: string
  category: 'Plumbing' | 'HVAC' | 'Electrical' | 'Security' | 'Carpentry' | 'General' | 'Lease Dispute'
  issueSummary: string
  description: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In Progress' | 'Pending' | 'Scheduled' | 'Resolved' | 'Escalated to Admin'
  submittedAt?: string
  requestedDate?: string
  assignedTechnician?: string
  ownerNotes?: string
  adminRuling?: string
}

export type MaintenanceRequest = ComplaintReport

export interface Tenant {
  id: string
  unitNo: string
  tenantName: string
  buildingName: string
  propertyId?: string
  tenantType: 'Individual' | 'Family' | 'Corporate'
  contactPhone: string
  contactEmail: string
  leaseType: 'Standard (12 mo)' | 'Short-term (1-12 mo)' | 'Long-term (24+ mo)'
  leaseStart: string
  leaseEnd: string
  monthlyRent: number
  paymentStatus: 'Current' | 'Late' | 'Pending'
  status: 'Active' | 'Expiring Soon' | 'Terminated' | 'Suspended'
}

export interface Transaction {
  id: string
  code: string // e.g. "TXN-2026-001034"
  dateTime: string
  tenantId?: string
  tenantName: string
  unitNo: string
  propertyId?: string
  buildingName: string
  type: 'Rent' | 'Utility' | 'Deposit' | 'Fee' | 'Refund'
  category: string
  amount: number
  method: 'Telebirr' | 'CBE Birr' | 'Commercial Bank of Ethiopia' | 'Awash Bank' | 'Cash'
  reference: string
  status: 'Completed' | 'Pending' | 'Failed'
  ethioTelecomConfirmationId?: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: UserRole | 'tenant'
  action: string
  entityType: 'Property' | 'Agreement' | 'Payment' | 'Complaint' | 'User'
  details: string
  ipAddress: string
}

export interface RegionDistribution {
  name: string
  buildingsCount: number
  collectionRate: number
  status: 'excellent' | 'good' | 'attention'
}

export interface ComplianceAlert {
  id: string
  title: string
  count: number
  variant: 'critical' | 'audit' | 'review' | 'injunction'
}
