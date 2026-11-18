import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './index'
import * as auth from './authSlice'
import type { PublicUser, UserRole } from '../types/api'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export interface AuthContextType {
  currentUser: PublicUser | null
  isAuthenticated: boolean
  isRestoring: boolean
  isSubmitting: boolean
  error: string | null
  fieldErrors: Record<string, string>
  login: (credentials: { identifier: string; password: string }) => Promise<PublicUser | undefined>
  logout: () => Promise<void>
  clearError: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

export function useAuth(): AuthContextType {
  const dispatch = useAppDispatch()
  const { currentUser, isRestoring, isSubmitting, error, fieldErrors } = useAppSelector(
    (state) => state.auth
  )

  return useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      isRestoring,
      isSubmitting,
      error,
      fieldErrors,
      login: async (credentials) => {
        try {
          return await dispatch(auth.login(credentials)).unwrap()
        } catch {
          return undefined
        }
      },
      logout: async () => {
        await dispatch(auth.logout())
      },
      clearError: () => {
        dispatch(auth.authErrorCleared())
      },
      hasRole: (...roles) => auth.hasRole(currentUser, ...roles),
    }),
    [dispatch, currentUser, isRestoring, isSubmitting, error, fieldErrors]
  )
}

