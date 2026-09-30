import { api, unwrapEnvelope } from './api'
import type {
  AgreementFilter,
  AgreementSummary,
  CreatePropertyPayload,
  OwnerBalances,
  OwnerDashboard,
  Paginated,
  Property,
  PropertyBase,
  PropertyDetail,
  PropertyFilter,
  PublicUser,
  RegisterOwnerPayload,
  RegisterResponse,
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
  useGetOwnerBalancesQuery,
  useUploadPropertyPhotosMutation,
} = { ...authApi, ...propertyApi }
