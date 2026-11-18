/**
 * Types mirroring the backend API exactly.
 * Source of truth: backend/apps/backend/prisma/schema.prisma
 *                backend/apps/backend/src/common/utils/api-response.util.ts
 * Do not invent fields here; Decimal columns arrive as JSON numbers.
 */

export const USER_ROLES = ['ADMIN', 'TELECOM', 'OWNER', 'MANAGER', 'TENANT'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type Language = 'EN' | 'AM'
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
export type IdType = 'KEBELE_ID' | 'PASSPORT' | 'FAYDA' | 'DRIVING_LICENSE'

/** Capability grants an owner can hand to a staff (MANAGER) account. */
export const MANAGER_PERMISSIONS = [
  'PROPERTY_VIEW',
  'PROPERTY_MANAGE',
  'UNIT_MANAGE',
  'TENANT_VIEW',
  'TENANT_MANAGE',
  'AGREEMENT_VIEW',
  'AGREEMENT_MANAGE',
  'COMPLAINT_VIEW',
  'COMPLAINT_MANAGE',
  'PAYMENT_VIEW',
  'PAYMENT_RECORD',
  'VENDOR_VIEW',
  'VENDOR_MANAGE',
  'REPORT_VIEW',
] as const
export type ManagerPermission = (typeof MANAGER_PERMISSIONS)[number]

/** Grouped for the "add staff" checkbox list, with a sensible default per area. */
export const MANAGER_PERMISSION_GROUPS: { area: string; permissions: ManagerPermission[] }[] = [
  { area: 'Properties & units', permissions: ['PROPERTY_VIEW', 'PROPERTY_MANAGE', 'UNIT_MANAGE'] },
  { area: 'Tenants', permissions: ['TENANT_VIEW', 'TENANT_MANAGE'] },
  { area: 'Agreements', permissions: ['AGREEMENT_VIEW', 'AGREEMENT_MANAGE'] },
  { area: 'Complaints & maintenance', permissions: ['COMPLAINT_VIEW', 'COMPLAINT_MANAGE'] },
  { area: 'Payments', permissions: ['PAYMENT_VIEW', 'PAYMENT_RECORD'] },
  { area: 'Vendors', permissions: ['VENDOR_VIEW', 'VENDOR_MANAGE'] },
  { area: 'Reports', permissions: ['REPORT_VIEW'] },
]

export const PROPERTY_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE'] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const UNIT_TYPES = [
  'APARTMENT',
  'STUDIO',
  'VILLA',
  'ROOM',
  'OFFICE',
  'SHOP',
  'WAREHOUSE',
  'OTHER',
] as const
export type UnitType = (typeof UNIT_TYPES)[number]

export const UNIT_STATUSES = ['VACANT', 'RESERVED', 'OCCUPIED', 'UNDER_MAINTENANCE'] as const
export type UnitStatus = (typeof UNIT_STATUSES)[number]

export type AgreementStatus =
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'RENEWED'
  | 'CANCELLED'

export type RentalRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type PaymentMethod = 'TELEBIRR' | 'BANK_TRANSFER' | 'CASH'
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED'
export type ComplaintCategory = 'MAINTENANCE' | 'NOISE' | 'SAFETY' | 'PAYMENT' | 'DISPUTE' | 'OTHER'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type EscalationStatus = 'NONE' | 'ESCALATED' | 'ADMIN_RESOLVED'
export type WorkOrderStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

/** Global TransformInterceptor envelope. */
export interface ApiEnvelope<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
  timestamp: string
}

/** Shape of `buildPaginatedList`. */
export interface Paginated<T> {
  docs: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Backend HttpExceptionFilter body (buildErrorResponse). */
export interface ApiErrorBody {
  statusCode: number
  success: boolean
  message: string
  data: null
  /** class-validator messages, e.g. "name must be longer than 2 characters". */
  errors?: string[]
  timestamp?: string
}

export interface OwnerProfile {
  id: string
  userId: string
  companyName: string | null
  tinNumber: string | null
  address: string | null
  payoutMethod: PaymentMethod | null
  bankName: string | null
  bankAccount: string | null
  telebirrNumber: string | null
  createdAt: string
  updatedAt: string
}

export interface TenantProfile {
  id: string
  userId: string
  idType: IdType | string | null
  idNumberMasked?: string | null
  hasIdNumber?: boolean
  faydaId: string | null
  kycStatus: KycStatus
  faydaVerificationRef?: string | null
  faydaVerifiedAt: string | null
  dateOfBirth?: string | null
  occupation?: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation?: string | null
  createdAt: string
  updatedAt: string
}

export interface TenantVerificationSummary {
  kycStatus: KycStatus
  faydaId: string | null
  faydaVerifiedAt: string | null
  faydaVerificationRef?: string | null
}

export interface VerifyFaydaPayload {
  faydaId: string
  fullName?: string
  dateOfBirth?: string
}

export interface FaydaVerificationResult {
  agreementId: string
  verified: boolean
  kycStatus: KycStatus
  faydaId: string | null
  faydaVerificationRef: string
  faydaVerifiedAt: string | null
  reason: string | null
}

/** `toPublicUser` — never includes passwordHash / refreshTokenHash / sessionVersion. */
export interface PublicUser {
  id: string
  role: UserRole
  fullName: string
  phoneNumber: string
  email: string | null
  language: Language
  approvalStatus: ApprovalStatus
  isSuspended: boolean
  suspendedReason: string | null
  suspendedAt: string | null
  phoneVerified: boolean
  telegramChatId: string | null
  lastLoginAt: string | null
  employerId: string | null
  createdAt: string
  updatedAt: string
  ownerProfile: OwnerProfile | null
  tenantProfile: TenantProfile | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: string
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface LoginResponse {
  user: PublicUser
  tokens: AuthTokens
}

/**
 * POST /auth/register body. The backend only accepts OWNER or TENANT here —
 * ADMIN/TELECOM accounts are provisioned internally, never self-registered.
 */
export interface RegisterOwnerPayload {
  role: 'OWNER'
  fullName: string
  /** Ethiopian mobile, e.g. 0911223344 or +251911223344. Required. */
  phoneNumber: string
  email?: string
  /** Server rule: at least 8 characters, containing both a letter and a digit. */
  password: string
  language?: Language
  /** Owners only. */
  companyName?: string
}

/** Register returns tokens too, but OWNER_AUTO_APPROVE is off, so the account lands as PENDING. */
export interface RegisterResponse {
  user: PublicUser
  tokens: AuthTokens
}

/** Derived from `units` on GET /properties; replaces the frontend's totalUnits/occupiedUnits. */
export interface UnitSummary {
  total: number
  vacant: number
  reserved: number
  occupied: number
  underMaintenance: number
}

/**
 * Fields common to every property response. `unitSummary` is only attached by
 * the list and detail endpoints, so it is not part of this shape.
 */
export interface PropertyBase {
  id: string
  ownerId: string
  name: string
  type: PropertyType
  description: string | null
  city: string
  subCity: string | null
  woreda: string | null
  address: string
  latitude: number | null
  longitude: number | null
  totalArea: number | null
  ownershipType: string | null
  titleDeedNo: string | null
  amenities: string[]
  photos: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Property as returned by GET /properties (list). */
export interface Property extends PropertyBase {
  unitSummary: UnitSummary
}

export interface Unit {
  id: string
  propertyId: string
  unitNumber: string
  floor: number | null
  type: UnitType
  bedrooms: number | null
  bathrooms: number | null
  sizeSqm: number | null
  rentAmount: number
  depositAmount: number
  currency: string
  status: UnitStatus
  isListed: boolean
  amenities: string[]
  photos: string[]
  terms: string | null
  createdAt: string
  updatedAt: string
}

/** Property as returned by GET /properties/:id. */
export interface PropertyDetail extends PropertyBase {
  units: Unit[]
  owner: { id: string; fullName: string; phoneNumber: string }
  /** Only the `tenant` relation is included here — not unit/property/owner. */
  agreements: AgreementSummary[]
  unitSummary: UnitSummary
}

/** CreatePropertyDto — only name, type, city and address are required. */
export interface CreatePropertyPayload {
  name: string
  type: PropertyType
  city: string
  address: string
  description?: string
  subCity?: string
  woreda?: string
  latitude?: number
  longitude?: number
  totalArea?: number
  ownershipType?: string
  titleDeedNo?: string
  amenities?: string[]
  photos?: string[]
}

/** UpdatePropertyDto — every CreatePropertyDto field is optional. */
export type UpdatePropertyPayload = Partial<CreatePropertyPayload>

/** PropertyFilterDto (extends PaginationDto: page defaults 1, limit 20, max 100). */
export interface PropertyFilter {
  page?: number
  limit?: number
  type?: PropertyType
  city?: string
  search?: string
  ownerId?: string
  isActive?: boolean
}

export interface OwnerDashboardProperty {
  propertyId: string
  name: string
  city: string
  units: UnitSummary
  occupancyRate: number
  rentExpected: number
  rentCollected: number
  outstanding: number
  activeTenants: number
}

export interface OwnerDashboardTotals {
  properties: number
  units: UnitSummary
  occupancyRate: number
  activeTenants: number
  activeAgreements: number
  leasesExpiringSoon: number
  rentExpected: number
  rentCollected: number
  collectionRate: number
  collectedByMethod: Record<PaymentMethod, number>
  outstanding: number
  overdueInvoices: number
  pendingRentalRequests: number
}

export interface OwnerDashboardMaintenance {
  /** Count per complaint status across the whole portfolio. */
  complaints: Record<ComplaintStatus, number>
  escalated: number
  /** Count per work order status across the whole portfolio. */
  workOrders: Record<WorkOrderStatus, number>
}

export interface OwnerDashboard {
  /** The month the figures cover. Rent figures are scoped to this window. */
  period: { start: string; end: string }
  properties: OwnerDashboardProperty[]
  totals: OwnerDashboardTotals
  maintenance: OwnerDashboardMaintenance
}

/**
 * GET /admin/users returns toPublicUser, which keeps the Prisma `_count`
 * the list query includes. Counts are platform-wide per user.
 */
export interface AdminUser extends PublicUser {
  _count: {
    properties: number
    tenantAgreements: number
    ownerAgreements: number
  }
}

/** AdminUserFilterDto (extends PaginationDto). */
export interface AdminUserFilter {
  page?: number
  limit?: number
  role?: UserRole
  approvalStatus?: ApprovalStatus
  isSuspended?: boolean
  search?: string
}

/** Notification model. `type` is a MessageKey string, not a Prisma enum. */
export interface AppNotification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  channels: string[]
  readAt: string | null
  createdAt: string
}

/** NotificationFilterDto (extends PaginationDto). */
export interface NotificationFilter {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export interface AgreementPartyRef {
  id: string
  fullName: string
  phoneNumber: string
  tenantProfile?: TenantVerificationSummary | null
}

/** GET /agreements rows omit `content` (the signed body) but carry these relations. */
export interface AgreementSummary {
  id: string
  referenceNo: string
  unitId: string
  propertyId: string
  tenantId: string
  ownerId: string
  startDate: string
  endDate: string
  rentAmount: number
  depositAmount: number
  currency: string
  paymentDueDay: number
  status: AgreementStatus
  createdAt: string
  unit: { id: string; unitNumber: string; type: UnitType }
  property: { id: string; name: string; address: string; city: string; subCity: string | null }
  tenant: AgreementPartyRef
  owner: AgreementPartyRef
}

/** POST /agreements/:id/renew — RenewAgreementDto. */
export interface RenewAgreementPayload {
  durationMonths: number
  rentAmount?: number
  depositAmount?: number
  specialTerms?: string
}

/** AgreementFilterDto (extends PaginationDto). */
export interface AgreementFilter {
  page?: number
  limit?: number
  status?: AgreementStatus
  propertyId?: string
  unitId?: string
  tenantId?: string
}

export type InspectionType = 'MOVE_IN' | 'MOVE_OUT'
export type InspectionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
export type DepositRefundStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

export interface InspectionItem {
  label: string
  ok: boolean
  note?: string
}

export interface InspectionSummary {
  id: string
  referenceNo: string
  agreementId: string
  propertyId: string
  unitId: string
  ownerId: string
  tenantId: string
  type: InspectionType
  status: InspectionStatus
  scheduledAt: string | null
  completedAt: string | null
  conductedById: string | null
  items: InspectionItem[] | null
  photos: string[]
  notes: string | null
  createdAt: string
  agreement: {
    id: string
    referenceNo: string
    status: AgreementStatus
    endDate: string
    property: { id: string; name: string }
    unit: { id: string; unitNumber: string }
  }
  tenant: AgreementPartyRef
  conductedBy: { id: string; fullName: string } | null
}

export interface InspectionFilter {
  page?: number
  limit?: number
  type?: InspectionType
  status?: InspectionStatus
  agreementId?: string
}

export interface CreateInspectionPayload {
  agreementId: string
  type: InspectionType
  scheduledAt?: string
  items?: InspectionItem[]
  photos?: string[]
  notes?: string
  clientRef?: string
}

export interface CompleteInspectionPayload {
  items?: InspectionItem[]
  photos?: string[]
  notes?: string
}

export interface DepositRefundRecord {
  id: string
  referenceNo: string
  agreementId: string
  propertyId: string
  unitId: string
  ownerId: string
  tenantId: string
  inspectionId: string | null
  depositAmount: number
  deductions: number
  refundAmount: number
  status: DepositRefundStatus
  notes: string | null
  providerReference: string | null
  paidAt: string | null
  createdAt: string
  agreement: {
    id: string
    referenceNo: string
    status: AgreementStatus
    property: { id: string; name: string }
    unit: { id: string; unitNumber: string }
  }
  tenant: AgreementPartyRef
  inspection: { id: string; referenceNo: string; type: InspectionType; status: InspectionStatus } | null
}

export interface DepositRefundFilter {
  page?: number
  limit?: number
  status?: DepositRefundStatus
  agreementId?: string
}

export interface CreateDepositRefundPayload {
  agreementId: string
  inspectionId?: string
  deductions?: number
  notes?: string
  clientRef?: string
}

export interface DecideDepositRefundPayload {
  notes?: string
}

export interface PayDepositRefundPayload {
  providerReference?: string
  notes?: string
}

/** Tenant credit is what a tenant OWES; there is no prepaid/credit field in the API. */
export interface TenantBalance {
  tenant: AgreementPartyRef
  outstanding: number
  overdueCount: number
  oldestDueDate: string
}

export interface OwnerBalances {
  totalOutstanding: number
  tenants: TenantBalance[]
}

/** POST /files/upload/:folder */
export interface UploadedFile {
  url: string
  originalName: string
  mimeType: string
  size: number
}

export type InvoiceType = 'RENT' | 'DEPOSIT' | 'PENALTY' | 'OTHER'

/** GET /invoices rows. */
export interface InvoiceSummary {
  id: string
  invoiceNo: string
  agreementId: string
  tenantId: string
  ownerId: string
  propertyId: string
  unitId: string
  type: InvoiceType
  periodStart: string
  periodEnd: string
  dueDate: string
  amount: number
  amountPaid: number
  currency: string
  status: InvoiceStatus
  description: string | null
}

/**
 * Portion of a confirmed payment that landed on this invoice rather than being
 * carried forward as a credit against later periods. Null when the whole
 * payment was a prepayment that had no invoice to settle.
 */
export interface PaymentAllocation {
  invoiceId: string
  invoiceNo: string
  amount: number
}

/** GET /agreements/:id — adds the signed body, its hash and the integrity verdict. */
export interface AgreementDetail extends AgreementSummary {
  content: string
  contentHash: string
  specialTerms: string | null
  ownerSignedAt: string | null
  tenantSignedAt: string | null
  integrity: { valid: boolean; checkedAt: string; reason?: string }
}

/** GET /payments rows (PAYMENT_INCLUDE: invoice, tenant, property, agreement). */
export interface PaymentRecord {
  id: string
  referenceNo: string
  invoiceId: string | null
  agreementId: string
  tenantId: string
  ownerId: string
  propertyId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  providerReference: string | null
  bankName: string | null
  receiptUrl: string | null
  checkoutUrl: string | null
  notes: string | null
  clientRef: string | null
  recordedById: string | null
  confirmedById: string | null
  confirmationSource: string | null
  confirmedAt: string | null
  createdAt: string
  /** How far this payment reaches: months actually settled, then any credit beyond. */
  allocations: PaymentAllocation[]
  prepaidMonths: number
  creditAmount: number
  /** Last day rent is covered without a further transfer, null when not prepaid. */
  prepaidThrough: string | null
  invoice: {
    id: string
    invoiceNo: string
    type: InvoiceType
    periodStart: string
    periodEnd: string
    status: InvoiceStatus
  } | null
  tenant: AgreementPartyRef
  property: { id: string; name: string }
  agreement: { id: string; referenceNo: string; unitId: string }
}

/** PaymentFilterDto (extends PaginationDto) + the `totalConfirmed` sum the server adds. */
export interface PaymentFilter {
  page?: number
  limit?: number
  status?: PaymentStatus
  method?: PaymentMethod
  propertyId?: string
  tenantId?: string
  agreementId?: string
  ownerId?: string
  from?: string
  to?: string
}

export interface PaymentPage extends Paginated<PaymentRecord> {
  /** Sum of every CONFIRMED payment in the filtered set, in ETB. */
  totalConfirmed: number
}

/** POST /payments/offline — RecordOfflinePaymentDto. */
export interface RecordOfflinePaymentPayload {
  invoiceId: string
  /** Omit to pay the invoice in full. Larger amounts prepay later months. */
  amount?: number
  method: 'CASH' | 'BANK_TRANSFER'
  providerReference?: string
  bankName?: string
  notes?: string
  receiptUrl?: string
}

/** GET /dashboard/admin — platform oversight counters. */
export interface AdminDashboard {
  period: { start: string; end: string }
  users: {
    owners: number
    ownersPendingApproval: number
    tenants: number
    managers: number
    suspended: number
  }
  properties: number
  units: { total: number; occupancyRate: number } & Partial<Record<UnitStatus, number>>
  /** Keyed by AgreementStatus. */
  agreements: Partial<Record<AgreementStatus, number>>
  payments: {
    confirmedVolume: number
    confirmedCount: number
    telebirrVolume: number
    estimatedPlatformFee: number
    pendingConfirmation: { method: PaymentMethod; count: number; amount: number }[]
  }
  disputes: { escalated: number; unresolvedPastSla: number }
  payouts: { pendingCount: number; pendingAmount: number }
  workOrdersOpen: number
}

/** GET /admin/users/:id adds relations and activity counts to the public user. */
export interface AdminUserDetail extends PublicUser {
  employer: { id: string; fullName: string } | null
  properties: { id: string; name: string; city: string; isActive: boolean }[]
  tenantAgreements: {
    id: string
    referenceNo: string
    status: AgreementStatus
    startDate: string
    endDate: string
  }[]
  ownerAgreements: { id: string; referenceNo: string; status: AgreementStatus }[]
  _count: {
    properties: number
    tenantAgreements: number
    ownerAgreements: number
    tenantComplaints: number
    ownerComplaints: number
    tenantPayments: number
    ownerPayments: number
  }
}

/** The tenant behind a complaint. The backend only selects these three columns. */
export interface ComplaintTenantRef {
  id: string
  fullName: string
  phoneNumber: string
}

/** Whoever the backend attributes an action to: the reporter, or who escalated it. */
export interface ComplaintAuthorRef {
  id: string
  fullName: string
  role: UserRole
}

/**
 * One message on a complaint thread. `author` is who actually wrote it, which
 * is not always the tenant — a manager or the admin can post on the thread too.
 */
export interface ComplaintResponseEntry {
  id: string
  complaintId: string
  authorId: string
  message: string
  attachments: string[]
  createdAt: string
  author: ComplaintAuthorRef
}

/** A repair job booked against a complaint, with the vendor that will do it. */
export interface ComplaintWorkOrder {
  id: string
  referenceNo: string
  title: string
  description: string | null
  priority: Priority
  status: WorkOrderStatus
  estimatedCost: number | null
  actualCost: number | null
  scheduledDate: string | null
  completedAt: string | null
  completionNotes: string | null
  photos: string[]
  createdAt: string
  vendor: { id: string; name: string; phoneNumber: string } | null
}

/**
 * GET /complaints rows. The server scopes these by role, so an owner only ever
 * receives complaints on their own properties — no ownerId filter is needed.
 *
 * `raisedById` is the account that submitted the report (tenant or manager);
 * `tenantId` is the tenant the report is *about*, derived from the active
 * agreement. They differ when a manager files on a tenant's behalf, so the
 * `raisedBy` relation is what the UI should attribute the report to.
 */
export interface ComplaintListItem {
  id: string
  referenceNo: string
  tenantId: string | null
  ownerId: string
  propertyId: string
  unitId: string | null
  agreementId: string | null
  raisedById: string
  category: ComplaintCategory
  priority: Priority
  title: string
  description: string
  photos: string[]
  status: ComplaintStatus
  escalationStatus: EscalationStatus
  escalatedAt: string | null
  escalatedById: string | null
  escalationReason: string | null
  adminResolution: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  property: { id: string; name: string }
  unit: { id: string; unitNumber: string } | null
  tenant: ComplaintTenantRef | null
  raisedBy: ComplaintAuthorRef
  escalatedBy: ComplaintAuthorRef | null
  _count: { responses: number; workOrders: number }
}

/** GET /complaints/:id adds the full thread and the work orders. */
export interface ComplaintDetail extends Omit<ComplaintListItem, '_count'> {
  responses: ComplaintResponseEntry[]
  workOrders: ComplaintWorkOrder[]
}

/**
 * CreateComplaintDto. Owners and managers must send `propertyId`; the tenant is
 * resolved server-side from the active agreement on the chosen `unitId`.
 */
export interface CreateComplaintPayload {
  propertyId: string
  unitId?: string
  agreementId?: string
  category: ComplaintCategory
  priority?: Priority
  title: string
  description: string
  photos?: string[]
  /** Idempotency key, so a retried submit cannot create a duplicate. */
  clientRef?: string
}

export interface UpdateComplaintStatusPayload {
  status: ComplaintStatus
  /** Posted to the thread as part of the status change. */
  note?: string
}

export interface RespondComplaintPayload {
  message: string
  attachments?: string[]
}

export interface EscalateComplaintPayload {
  reason: string
}

/** ComplaintFilterDto (extends PaginationDto). */
export interface ComplaintFilter {
  page?: number
  limit?: number
  status?: ComplaintStatus
  category?: ComplaintCategory
  priority?: Priority
  escalationStatus?: EscalationStatus
  propertyId?: string
  /** Admin only: complaints left unresolved past the SLA. */
  staleOnly?: boolean
}

/** A staff account the owner added, with the grants currently attached to it. */
export interface StaffMember {
  id: string
  fullName: string
  phoneNumber: string
  email: string | null
  role: UserRole
  /** Empty means the staff member currently has no owner-side access at all. */
  permissions: ManagerPermission[]
  isSuspended: boolean
  suspendedReason: string | null
  createdAt: string
}

export interface CreateStaffPayload {
  fullName: string
  phoneNumber: string
  email?: string
  password: string
  permissions?: ManagerPermission[]
}

/**
 * The same staff account as seen by platform staff, who manage every owner's
 * portfolio rather than just their own.
 */
export interface PlatformStaffMember extends StaffMember {
  employerId: string | null
  employer: {
    id: string
    fullName: string
    ownerProfile: { companyName: string } | null
  } | null
}

export interface CreatePlatformStaffPayload extends CreateStaffPayload {
  /**
   * Optional owner to attach the account to. Omitted by the admin staff screen:
   * the account belongs to Possible Technology and works across every owner.
   */
  ownerId?: string
}

export interface AuditLogActor {
  id: string
  fullName: string
  role: UserRole
  phoneNumber: string
}

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  actorId: string | null
  actorRole: string
  ipAddress: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: AuditLogActor | null
}

/** OwnerAuditLogFilterDto (extends PaginationDto). */
export interface OwnerAuditFilter {
  page?: number
  limit?: number
  action?: string
  entityType?: string
  actorId?: string
  from?: string
  to?: string
  /** Set false to hide RECORD_VIEWED rows and show only real changes. */
  includeViews?: boolean
}

/** AdminStaffFilterDto (extends PaginationDto). */
export interface AdminStaffFilter {
  page?: number
  limit?: number
  search?: string
  /** Narrow to the staff of one owner. */
  ownerId?: string
  isSuspended?: boolean
}
