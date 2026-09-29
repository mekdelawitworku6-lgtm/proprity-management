import { refreshRequest } from './auth'
import type { AuthTokens } from '../types/api'

export const REFRESH_TOKEN_STORAGE_KEY = 'prop_platform_refresh_token'

/**
 * Access token lives in memory only (a leaked localStorage token is readable by
 * any XSS payload); the refresh token is persisted so a reload keeps the session.
 * The backend rotates the refresh token on every refresh, so it must be rewritten.
 */
let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null
let expiredListener: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken
  try {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
  } catch {
    /* storage unavailable (private mode): session stays in memory only */
  }
}

export function clearTokens(): void {
  accessToken = null
  try {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Called by the store when a refresh fails, so the session can be torn down. */
export function onSessionExpired(listener: () => void): void {
  expiredListener = listener
}

/**
 * Single-flight refresh: concurrent 401s (five parallel queries, a page that
 * mounts several hooks) share one network call instead of rotating the refresh
 * token five times, which would invalidate itself.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearTokens()
    expiredListener?.()
    return Promise.resolve(false)
  }

  refreshInFlight = refreshRequest(refreshToken)
    .then((tokens) => {
      setTokens(tokens)
      return true
    })
    .catch(() => {
      clearTokens()
      expiredListener?.()
      return false
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}
