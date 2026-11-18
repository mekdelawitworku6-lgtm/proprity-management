import { api, unwrapEnvelope } from './api'
import type {
  AdminDashboard,
  AgreementDetail,
  AgreementFilter,
  AgreementSummary,
  AuditLogEntry,
  ComplaintDetail,
  ComplaintFilter,
  ComplaintListItem,
  ComplaintResponseEntry,
  ComplaintStatus,
  CreateComplaintPayload,
  CreatePropertyPayload,
  CreateStaffPayload,
  ManagerPermission,
  OwnerAuditFilter,
  OwnerBalances,
  OwnerDashboard,
  Paginated,
  PaymentFilter,
  PaymentPage,
  PaymentRecord,
  Property,
  PropertyBase,
  PropertyDetail,
  PropertyFilter,
  PublicUser,
  RecordOfflinePaymentPayload,
  RegisterOwnerPayload,
  RegisterResponse,
  StaffMember,
  UpdatePropertyPayload,
  UploadedFile,
} from '../types/api'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    currentUser: builder.query<PublicUser, void>({
      query: () => ({ url: '/auth/me' }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Property'],
    }),

    /** Owner self-registration. The server sets approvalStatus=PENDING for owners. */
    register: builder.mutation<RegisterResponse, RegisterOwnerPayload>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: unwrapEnvelope,
    }),
  }),
  overrideExisting: false,
})

export const propertyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query<Paginated<Property>, PropertyFilter | void>({
      query: (filter) => ({ url: '/properties', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: (result) => [
        { type: 'Property' as const, id: 'LIST' },
        ...(result?.docs.map((property) => ({ type: 'Property' as const, id: property.id })) ?? []),
      ],
    }),

    getProperty: builder.query<PropertyDetail, string>({
      query: (id) => ({ url: `/properties/${id}` }),
      transformResponse: unwrapEnvelope,
      providesTags: (_result, _error, id) => [{ type: 'Property' as const, id }],
    }),

    createProperty: builder.mutation<PropertyBase, CreatePropertyPayload>({
      query: (body) => ({ url: '/properties', method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: 'Property', id: 'LIST' }, 'Dashboard'],
    }),

    updateProperty: builder.mutation<PropertyBase, { id: string; changes: UpdatePropertyPayload }>({
      query: ({ id, changes }) => ({ url: `/properties/${id}`, method: 'PATCH', body: changes }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'LIST' },
        'Dashboard',
      ],
    }),

    deleteProperty: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/properties/${id}`, method: 'DELETE' }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: 'Property', id: 'LIST' }, 'Dashboard'],
    }),

    /** Supplies the revenue figures the properties table shows. */
    getOwnerDashboard: builder.query<OwnerDashboard, void>({
      query: () => ({ url: '/dashboard/owner' }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Dashboard'],
    }),

    /**
     * Leases scoped to the signed-in owner. The Tenants page derives its
     * roster from these, so an owner with no leases correctly shows empty.
     */
    getAgreements: builder.query<Paginated<AgreementSummary>, AgreementFilter | void>({
      query: (filter) => ({ url: '/agreements', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Agreement'],
    }),

    /** Full signed agreement text plus the SHA-256 integrity verdict. */
    getAgreement: builder.query<AgreementDetail, string>({
      query: (id) => ({ url: `/agreements/${id}` }),
      transformResponse: unwrapEnvelope,
      providesTags: (_result, _error, id) => [{ type: 'Agreement', id }],
    }),

    getOwnerBalances: builder.query<OwnerBalances, void>({
      query: () => ({ url: '/invoices/balances' }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Balance'],
    }),

    /**
     * Multipart upload for property photos. Returns the public /uploads URLs
     * to store in the property's photos array.
     */
    uploadPropertyPhotos: builder.mutation<UploadedFile[], File[]>({
      query: (files) => {
        const form = new FormData()
        for (const file of files) form.append('files', file)
        return { url: '/files/upload/properties', method: 'POST', body: form }
      },
      transformResponse: unwrapEnvelope,
    }),
  }),
  overrideExisting: false,
})

export const complaintsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * The server scopes the list by role: an owner receives everything filed
     * against their properties, a tenant only their own reports, and an admin
     * only escalated or SLA-breached complaints.
     */
    getComplaints: builder.query<Paginated<ComplaintListItem>, ComplaintFilter | void>({
      query: (filter) => ({ url: '/complaints', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: (result) => [
        { type: 'Complaint' as const, id: 'LIST' },
        ...(result?.docs.map((complaint) => ({ type: 'Complaint' as const, id: complaint.id })) ?? []),
      ],
    }),

    /** Adds the response thread and the work orders, so the owner can see who replied. */
    getComplaint: builder.query<ComplaintDetail, string>({
      query: (id) => ({ url: `/complaints/${id}` }),
      transformResponse: unwrapEnvelope,
      providesTags: (_result, _error, id) => [{ type: 'Complaint', id }],
    }),

    createComplaint: builder.mutation<ComplaintListItem, CreateComplaintPayload>({
      query: (body) => ({ url: '/complaints', method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: 'Complaint', id: 'LIST' }],
    }),

    /**
     * Owner/manager status change. An optional `note` is appended to the thread,
     * and the tenant is notified by SMS.
     */
    updateComplaintStatus: builder.mutation<
      ComplaintListItem,
      { id: string; status: ComplaintStatus; note?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/complaints/${id}/status`, method: 'PATCH', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Complaint', id },
        { type: 'Complaint', id: 'LIST' },
      ],
    }),

    respondToComplaint: builder.mutation<
      ComplaintResponseEntry,
      { id: string; message: string; attachments?: string[] }
    >({
      query: ({ id, ...body }) => ({ url: `/complaints/${id}/responses`, method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Complaint', id },
        { type: 'Complaint', id: 'LIST' },
      ],
    }),

    /** Hands the dispute to platform admins. Only allowed once, and not after CLOSED. */
    escalateComplaint: builder.mutation<ComplaintListItem, { id: string; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/complaints/${id}/escalate`, method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Complaint', id },
        { type: 'Complaint', id: 'LIST' },
      ],
    }),

    /** FR-ADM-03: official ruling on a dispute the owner escalated. Admin-only on the server. */
    adminResolveComplaint: builder.mutation<
      ComplaintListItem,
      { id: string; resolution: string; status?: ComplaintStatus }
    >({
      query: ({ id, ...body }) => ({ url: `/complaints/${id}/admin-resolve`, method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Complaint', id },
        { type: 'Complaint', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const billingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Rent/payment history. The server scopes it by role — an owner sees their whole
     * portfolio, a tenant only their own payments — and adds `totalConfirmed` so the
     * header can show real collected totals instead of summing the current page.
     */
    getPayments: builder.query<PaymentPage, PaymentFilter | void>({
      query: (filter) => ({ url: '/payments', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: (result) => [
        { type: 'Payment' as const, id: 'LIST' },
        ...(result?.docs.map((payment) => ({ type: 'Payment' as const, id: payment.id })) ?? []),
      ],
    }),

    /**
     * Records a payment the owner received directly (cash, or a transfer that landed in
     * their own account). Confirms immediately and spreads any surplus across later
     * invoices, so an owner can log several months of rent in one go.
     */
    recordOfflinePayment: builder.mutation<PaymentRecord, RecordOfflinePaymentPayload>({
      query: (body) => ({ url: '/payments/offline', method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }, 'Balance', 'Dashboard', 'Agreement'],
    }),

    /** Settles a pending bank transfer the tenant submitted. */
    confirmPayment: builder.mutation<PaymentRecord, { id: string; providerReference?: string; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/confirm`, method: 'PATCH', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }, 'Balance', 'Dashboard', 'Agreement'],
    }),

    rejectPayment: builder.mutation<PaymentRecord, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/payments/${id}/reject`, method: 'PATCH', body: { reason } }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }, 'Balance', 'Dashboard'],
    }),
  }),
  overrideExisting: false,
})

export const teamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Staff accounts this owner added, each with the grants currently attached. */
    getStaff: builder.query<StaffMember[], void>({
      query: () => ({ url: '/managers' }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Staff'],
    }),

    /**
     * Adds a staff account. Omitting `permissions` grants everything, which is
     * why the UI always sends an explicit list.
     */
    createStaff: builder.mutation<StaffMember, CreateStaffPayload>({
      query: (body) => ({ url: '/managers', method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Staff'],
    }),

    /** Replaces the grants on one staff account; the server audits before/after. */
    setStaffPermissions: builder.mutation<
      StaffMember,
      { id: string; permissions: ManagerPermission[] }
    >({
      query: ({ id, permissions }) => ({
        url: `/managers/${id}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Staff'],
    }),

    setStaffActive: builder.mutation<StaffMember, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/managers/${id}/${active ? 'activate' : 'deactivate'}`,
        method: 'PATCH',
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Staff'],
    }),
  }),
  overrideExisting: false,
})

export const activityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * What I and my staff did, scoped server-side to this owner and the accounts
     * they employ. Includes RECORD_VIEWED rows so read access is traceable.
     */
    getMyActivity: builder.query<Paginated<AuditLogEntry>, OwnerAuditFilter | void>({
      query: (filter) => ({ url: '/owner/audit-logs', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: (result) => [
        'Activity' as const,
        ...(result?.docs
          .filter((entry) => entry.actorId)
          .map((entry) => ({ type: 'Activity' as const, id: entry.actorId as string })) ?? []),
      ],
    }),

    /** Platform-wide audit trail (FR-ADM-04). Admin and Ethio Telecom only. */
    getPlatformAuditLogs: builder.query<Paginated<AuditLogEntry>, OwnerAuditFilter | void>({
      query: (filter) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { includeViews, ...cleanParams } = (filter ?? {}) as Record<string, unknown>
        return { url: '/admin/audit-logs', params: cleanParams }
      },
      transformResponse: unwrapEnvelope,
      providesTags: ['Activity'],
    }),

    /** Platform oversight counters: users, units, agreements, collected volume, escalations. */
    getAdminDashboard: builder.query<AdminDashboard, { month?: string } | void>({
      query: (filter) => ({ url: '/dashboard/admin', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Dashboard'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCurrentUserQuery,
  useRegisterMutation,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetOwnerDashboardQuery,
  useGetAgreementsQuery,
  useGetAgreementQuery,
  useGetOwnerBalancesQuery,
  useGetPaymentsQuery,
  useRecordOfflinePaymentMutation,
  useConfirmPaymentMutation,
  useRejectPaymentMutation,
  useUploadPropertyPhotosMutation,
  useGetComplaintsQuery,
  useGetComplaintQuery,
  useCreateComplaintMutation,
  useUpdateComplaintStatusMutation,
  useRespondToComplaintMutation,
  useEscalateComplaintMutation,
  useAdminResolveComplaintMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useSetStaffPermissionsMutation,
  useSetStaffActiveMutation,
  useGetMyActivityQuery,
  useGetPlatformAuditLogsQuery,
  useGetAdminDashboardQuery,
} = { ...authApi, ...propertyApi, ...complaintsApi, ...billingApi, ...teamApi, ...activityApi }
