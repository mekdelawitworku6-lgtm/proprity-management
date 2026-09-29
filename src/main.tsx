import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { installLogger } from './utils/logger.ts'
import { store } from './store/index.ts'
import { restoreSession } from './store/authSlice.ts'

installLogger()

// Exchanges a persisted refresh token for a session before the first render
// decides whether protected routes are reachable.
void store.dispatch(restoreSession())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
