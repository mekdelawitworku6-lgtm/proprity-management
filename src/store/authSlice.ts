import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loginRequest, logoutRequest, meRequest } from '../api/auth'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
  setTokens,
} from '../api/tokenStore'
import { ApiError, toErrorMessage } from '../api/client'
import { createLogger } from '../utils/logger'
import type { PublicUser, UserRole } from '../types/api'

const log = createLogger('auth', 'authSlice')

export interface AuthState {
  currentUser: PublicUser | null
  /** True until a persisted refresh token has been exchanged for a session. */
  isRestoring: boolean
  isSubmitting: boolean
  error: string | null
  fieldErrors: Record<string, string>
}

const initialState: AuthState = {
  currentUser: null,
  isRestoring: getRefreshToken() !== null,
  isSubmitting: false,
  error: null,
  fieldErrors: {},
}

export const login = createAsyncThunk<
  PublicUser,
  { identifier: string; password: string },
  { rejectValue: { message: string; fieldErrors: Record<string, string> } }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const result = await loginRequest(credentials)
    setTokens(result.tokens)
    log.info('login succeeded', { role: result.user.role, email: result.user.email })
    return result.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return rejectWithValue({ message: 'Incorrect phone/email or password.', fieldErrors: {} })
    }
    return rejectWithValue({
      message: toErrorMessage(error),
      fieldErrors: error instanceof ApiError ? error.fieldErrors : {},
    })
  }
})

/** Exchanges a persisted refresh token for a session on app start. */
export const restoreSession = createAsyncThunk<PublicUser | null>('auth/restore', async () => {
  const accessToken = getAccessToken()
  if (accessToken) {
    try {
      return await meRequest(accessToken)
    } catch {
      /* fall through to a refresh attempt */
    }
  }
  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    clearTokens()
    return null
  }
  const token = getAccessToken()
  if (!token) return null
  try {
    return await meRequest(token)
  } catch {
    clearTokens()
    return null
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  const token = getAccessToken()
  if (token) {
    try {
      await logoutRequest(token)
    } catch {
      /* revoking server-side is best-effort; the local session is cleared either way */
    }
  }
  clearTokens()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEnded(state) {
      state.currentUser = null
      state.isRestoring = false
      state.isSubmitting = false
      state.error = null
      state.fieldErrors = {}
    },
    authErrorCleared(state) {
      state.error = null
      state.fieldErrors = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isSubmitting = true
        state.error = null
        state.fieldErrors = {}
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.currentUser = action.payload
        state.isRestoring = false
        state.error = null
        state.fieldErrors = {}
      })
      .addCase(login.rejected, (state, action) => {
        state.isSubmitting = false
        state.isRestoring = false
        state.error = action.payload?.message ?? 'Login failed.'
        state.fieldErrors = action.payload?.fieldErrors ?? {}
      })
      .addCase(restoreSession.pending, (state) => {
        state.isRestoring = true
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isRestoring = false
        state.currentUser = action.payload
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isRestoring = false
        state.currentUser = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.currentUser = null
        state.isRestoring = false
        state.error = null
      })
  },
})

export const { sessionEnded, authErrorCleared } = authSlice.actions
export default authSlice.reducer

export const hasRole = (user: PublicUser | null, ...roles: UserRole[]): boolean =>
  !!user && roles.includes(user.role)
