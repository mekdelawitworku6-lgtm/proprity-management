import { api, unwrapEnvelope } from './api'
import type {
  AdminUser,
  AdminUserDetail,
  AdminUserFilter,
  AppNotification,
  NotificationFilter,
  Paginated,
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
} = adminApi
