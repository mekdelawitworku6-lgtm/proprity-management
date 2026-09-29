import { configureStore, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit'
import authReducer, { sessionEnded } from './authSlice'
import platformReducer from './platformSlice'
import { api } from './api'
import { onSessionExpired } from '../api/tokenStore'
import { createLogger } from '../utils/logger'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    platform: platformReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

const sessionLog = createLogger('auth', 'session')

/** A rejected refresh token must clear Redux too, not just the token store. */
onSessionExpired(() => {
  sessionLog.warn('refresh token rejected, session terminated')
  store.dispatch(api.util.resetApiState())
  store.dispatch(sessionEnded())
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppThunk<Result = void> = ThunkAction<Result, RootState, unknown, UnknownAction>
