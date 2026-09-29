import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './store/hooks'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useLogger } from './utils/logger'
import { HOME_FOR } from './lib/routes'
import Login from './pages/Login'

// Owner Portal
import { OwnerLayout } from './components/owner/OwnerLayout'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import OwnerProperties from './pages/owner/OwnerProperties'
import OwnerTenants from './pages/owner/OwnerTenants'
import OwnerAgreements from './pages/owner/OwnerAgreements'
import OwnerComplaints from './pages/owner/OwnerComplaints'
import OwnerPayments from './pages/owner/OwnerPayments'
import OwnerSettings from './pages/owner/OwnerSettings'

// Admin Portal
import { AdminLayout } from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOwners from './pages/admin/AdminOwners'
import AdminTenants from './pages/admin/AdminTenants'
import AdminAgreements from './pages/admin/AdminAgreements'
import AdminDisputes from './pages/admin/AdminDisputes'
import AdminPayments from './pages/admin/AdminPayments'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'

function RootRedirect() {
  const { currentUser, isAuthenticated, isRestoring } = useAuth()
  const log = useLogger('navigation', 'RootRedirect')

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    log.warn('unauthenticated request to /, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  const target = HOME_FOR[currentUser.role] ?? '/login'
  log.info(`dispatching ${currentUser.role} to home`, { target })
  return <Navigate to={target} replace />
}

function RouteLogger() {
  const location = useLocation()
  const log = useLogger('navigation', 'router')
  useEffect(() => {
    log.info(`→ ${location.pathname}`, { search: location.search, hash: location.hash })
  }, [log, location.pathname, location.search, location.hash])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <RouteLogger />
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Root Dispatcher */}
        <Route path="/" element={<RootRedirect />} />

        {/* Property Owner Portal (Protected) */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="properties" element={<OwnerProperties />} />
          <Route path="tenants" element={<OwnerTenants />} />
          <Route path="agreements" element={<OwnerAgreements />} />
          <Route path="complaints" element={<OwnerComplaints />} />
          <Route path="payments" element={<OwnerPayments />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>

        {/* Admin Control Dashboard (Possible Tech & Ethio Telecom) (Protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TELECOM']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="owners" element={<AdminOwners />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="agreements" element={<AdminAgreements />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="audit" element={<AdminAuditLogs />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App