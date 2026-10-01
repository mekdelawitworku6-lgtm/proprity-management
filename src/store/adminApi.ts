import { api, unwrapEnvelope } from './api'
import type {
  AdminStaffFilter,
  AdminUser,
  AdminUserDetail,
  AdminUserFilter,
  AppNotification,
  CreatePlatformStaffPayload,
  ManagerPermission,
  NotificationFilter,
  Paginated,
  PlatformStaffMember,
  PublicUser,
} from '../types/api'

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Owner/tenant accounts platform-wide. Filter to approvalStatus=PENDING for the request queue. */
    getAdminUsers: builder.query<Paginated<AdminUser>, AdminUserFilter | void>({
      query: (filter) => ({ url: '/admin/users', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: ['AdminUser'],
    }),

    /** Full record behind a request: relations plus activity counts. */
    getAdminUser: builder.query<AdminUserDetail, string>({
      query: (id) => ({ url: `/admin/users/${id}` }),
      transformResponse: unwrapEnvelope,
      providesTags: (_result, _error, id) => [{ type: 'AdminUser', id }],
    }),

    approveUser: builder.mutation<PublicUser, string>({
      query: (id) => ({ url: `/admin/users/${id}/approve`, method: 'PATCH' }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['AdminUser'],
    }),

    rejectUser: builder.mutation<PublicUser, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/reject`, method: 'PATCH', body: { reason } }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['AdminUser'],
    }),

    suspendUser: builder.mutation<PublicUser, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/suspend`, method: 'PATCH', body: { reason } }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['AdminUser'],
    }),

    unsuspendUser: builder.mutation<PublicUser, string>({
      query: (id) => ({ url: `/admin/users/${id}/unsuspend`, method: 'PATCH' }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['AdminUser'],
    }),

    getNotifications: builder.query<Paginated<AppNotification>, NotificationFilter | void>({
      query: (filter) => ({ url: '/notifications', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<{ unread: number }, void>({
      query: () => ({ url: '/notifications/unread-count' }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Notification'],
    }),

    /** Every staff account on the platform, each labelled with the owner it works for. */
    getPlatformStaff: builder.query<Paginated<PlatformStaffMember>, AdminStaffFilter | void>({
      query: (filter) => ({ url: '/admin/managers', params: filter ?? {} }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Staff'],
    }),

    /**
     * Creates a staff account on an owner's behalf. Unlike the owner-side route,
     * an admin manages every portfolio, so the owner has to be named.
     */
    createPlatformStaff: builder.mutation<PlatformStaffMember, CreatePlatformStaffPayload>({
      query: (body) => ({ url: '/admin/managers', method: 'POST', body }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Staff'],
    }),

    setPlatformStaffPermissions: builder.mutation<
      PlatformStaffMember,
      { id: string; permissions: ManagerPermission[] }
    >({
      query: ({ id, permissions }) => ({
        url: `/admin/managers/${id}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Staff'],
    }),

    setPlatformStaffActive: builder.mutation<PlatformStaffMember, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/admin/managers/${id}/${active ? 'activate' : 'deactivate'}`,
        method: 'PATCH',
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: ['Staff'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetPlatformStaffQuery,
  useCreatePlatformStaffMutation,
  useSetPlatformStaffPermissionsMutation,
  useSetPlatformStaffActiveMutation,
} = adminApi
