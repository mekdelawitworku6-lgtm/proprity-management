import { request } from './client'
import type {
  AuthTokens,
  LoginPayload,
  LoginResponse,
  PublicUser,
  RegisterOwnerPayload,
  RegisterResponse,
} from '../types/api'

/** POST /auth/register — public. Self-service signup for property owners (and tenants). */
export function registerRequest(payload: RegisterOwnerPayload): Promise<RegisterResponse> {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  })
}

/** POST /auth/login — public. Accepts phone number or email as identifier. */
export function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  })
}

/** POST /auth/refresh — public. Rotates both tokens, returns no user. */
export function refreshRequest(refreshToken: string): Promise<AuthTokens> {
  return request<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
  })
}

/** GET /auth/me — requires a valid access token. */
export function meRequest(accessToken: string): Promise<PublicUser> {
  return request<PublicUser>('/auth/me', { token: accessToken })
}

/** POST /auth/logout — revokes every refresh token for the user. */
export function logoutRequest(accessToken: string): Promise<{ loggedOut: true }> {
  return request<{ loggedOut: true }>('/auth/logout', { method: 'POST', token: accessToken })
}
