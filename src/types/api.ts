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
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  nationalIdNumber: string | null
  kycStatus: KycStatus
  createdAt: string
  updatedAt: string
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

export interface AgreementSummary {
  id: string
  status: AgreementStatus
  tenant: { id: string; fullName: string; phoneNumber: string }
}

/** Property as returned by GET /properties/:id. */
export interface PropertyDetail extends PropertyBase {
  units: Unit[]
  owner: { id: string; fullName: string; phoneNumber: string }
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

export interface OwnerDashboard {
  properties: OwnerDashboardProperty[]
  totals: OwnerDashboardTotals
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

/** AgreementFilterDto (extends PaginationDto). */
export interface AgreementFilter {
  page?: number
  limit?: number
  status?: AgreementStatus
  propertyId?: string
  unitId?: string
  tenantId?: string
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
