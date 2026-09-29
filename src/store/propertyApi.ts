import { api, unwrapEnvelope } from './api'
import type {
  CreatePropertyPayload,
  OwnerDashboard,
  Paginated,
  Property,
  PropertyBase,
  PropertyDetail,
  PropertyFilter,
  PublicUser,
  UpdatePropertyPayload,
} from '../types/api'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    currentUser: builder.query<PublicUser, void>({
      query: () => ({ url: '/auth/me' }),
      transformResponse: unwrapEnvelope,
      providesTags: ['Property'],
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
  }),
  overrideExisting: false,
})

export const {
  useCurrentUserQuery,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetOwnerDashboardQuery,
} = { ...authApi, ...propertyApi }
