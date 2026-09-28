import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  Wrench,
  Receipt,
  FileSignature,
  Settings,
  LogOut,
  LayoutDashboard,
  Search,
  Bell,
  Menu,
  X,
  Smartphone,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function OwnerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentUser, logout, switchRole } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/owner/properties', label: 'My Buildings', icon: Building2 },
    { to: '/owner/tenants', label: 'Tenants & Leases', icon: Users },
    { to: '/owner/agreements', label: 'Digital Agreements', icon: FileSignature },
    { to: '/owner/complaints', label: 'Maintenance & Reports', icon: Wrench },
    { to: '/owner/payments', label: 'Payment History', icon: Receipt },
    { to: '/owner/settings', label: 'Settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200/80 bg-white px-4 py-5 shadow-xs">
      <div>
        {/* Owner Branding */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs shadow-xs">
            BP
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-blue-700">LOGO</span>
            <p className="text-[10px] font-medium text-slate-400 -mt-1 leading-tight">
              Owner Dashboard
            </p>
          </div>
        </div>

        {/* Quick Portal Switcher */}
        <div className="mt-4 p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Switch View
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => {
                switchRole('admin')
                navigate('/admin/dashboard')
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-300 transition"
            >
              <Shield className="h-3 w-3 text-blue-600" /> Admin
            </button>
            <button
              onClick={() => {
                switchRole('tenant')
                navigate('/tenant')
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition"
            >
              <Smartphone className="h-3 w-3 text-emerald-600" /> Tenant App
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="mt-5 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/owner/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-50/80 text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-slate-100 pt-4 px-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebarContent}</aside>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 rounded-lg bg-white/20 p-2 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Owner Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 lg:px-8 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-xs font-bold text-slate-800">
                Property Management Web Platform
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                Owner Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-60">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                PO
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-800">{currentUser?.name || 'Abebe Tadesse'}</p>
                <p className="text-[10px] text-slate-400">{currentUser?.organization || 'Senior Property Owner'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
