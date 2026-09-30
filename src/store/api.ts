import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '../lib/env'
import { getAccessToken, refreshAccessToken } from '../api/tokenStore'
import type { ApiEnvelope } from '../types/api'

export interface QueryExtraOptions {
  /** Set on auth endpoints so a real 401 reaches the caller instead of retrying. */
  skipAuthRetry?: boolean
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAccessToken()
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  },
})

/**
 * Adds transparent 401 recovery: one refresh attempt, then a single replay of
 * the original request. Because the refresh is single-flight, several parallel
 * queries hitting 401 together share one token rotation.
 */
const baseQueryWithReauth: BaseQueryFn<
  FetchArgs,
  unknown,
  FetchBaseQueryError,
  QueryExtraOptions
> = async (args, api, extraOptions) => {
  if (extraOptions?.skipAuthRetry) {
    return rawBaseQuery(args, api, extraOptions)
  }

  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status !== 401) {
    return result
  }

  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    return { error: { status: 401, data: { message: 'Session expired' } } }
  }

  result = await rawBaseQuery(args, api, extraOptions)
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Property',
    'Unit',
    'Dashboard',
    'AdminUser',
    'Notification',
    'Agreement',
    'Balance',
    'Complaint',
  ],
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  endpoints: () => ({}),
})

/** Applied per-endpoint to strip the TransformInterceptor envelope. */
export function unwrapEnvelope<T>(response: ApiEnvelope<T>): T {
  return response.data
}

export type ApiFetchError = FetchBaseQueryError

/** Extracts a user-facing message from an RTK Query or RTK rejection error. */
export function toErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Something went wrong.'
  const data = (error as ApiFetchError).data
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  if ('error' in error && typeof (error as { error?: unknown }).error === 'string') {
    return (error as { error: string }).error
  }
  if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'Something went wrong.'
}
