import { API_BASE_URL, API_TIMEOUT_MS } from '../lib/env'
import type { ApiEnvelope, ApiErrorBody } from '../types/api'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type QueryValue = string | number | boolean | undefined | null

/**
 * class-validator messages start with the offending property name
 * ("name must be longer than 2 characters"), so the leading token maps
 * back to a form field.
 */
function extractFieldErrors(messages: string[] | undefined): Record<string, string> {
  if (!messages?.length) return {}
  const result: Record<string, string> = {}
  for (const message of messages) {
    const [first] = message.split(' ')
    if (first && !result[first]) result[first] = message
  }
  return result
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.fieldErrors = extractFieldErrors(body?.errors)
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  token?: string | null
  signal?: AbortSignal
  query?: Record<string, QueryValue>
  /** Set for auth calls so a 401 is a real answer, not a refresh trigger. */
  skipAuth?: boolean
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'success' in value &&
    'data' in value
  )
}

/**
 * Performs one request and unwraps the backend's TransformInterceptor envelope,
 * so callers receive `data` directly. Throws {@link ApiError} on any non-2xx.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal, query, skipAuth } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const externalAbort = () => controller.abort()
  signal?.addEventListener('abort', externalAbort)

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (!skipAuth && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (cause) {
    const aborted = cause instanceof DOMException && cause.name === 'AbortError'
    throw new ApiError(0, aborted ? 'Request timed out. Please try again.' : 'Cannot reach the server.', null)
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', externalAbort)
  }

  const raw = await response.text()
  let payload: unknown = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const errorBody =
      typeof payload === 'object' && payload !== null && 'statusCode' in payload
        ? (payload as ApiErrorBody)
        : null
    const message = errorBody?.message || response.statusText || 'Request failed'
    throw new ApiError(response.status, message, errorBody)
  }

  if (isEnvelope(payload)) return payload.data as T
  return payload as T
}

/** Turns any thrown value into a user-facing message. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
