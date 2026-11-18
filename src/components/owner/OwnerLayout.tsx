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
  Menu,
  ScrollText,
  UserCog,
  X,
} from 'lucide-react'
import { useAuth } from '../../store/hooks'
import { NotificationBell } from '../NotificationBell'

export function OwnerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = currentUser?.fullName ?? 'Property Owner'
  const organization = currentUser?.ownerProfile?.companyName ?? displayName
  // Staff accounts can act on the portfolio but must not manage other staff or
  // read the owner's activity trail, so those two entries are owner-only.
  const isOwner = currentUser?.role === 'OWNER'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PO'

  const navItems = [
    { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/owner/properties', label: 'My Building', icon: Building2 },
    { to: '/owner/tenants', label: 'Tenants & Leases', icon: Users },
    { to: '/owner/complaints', label: 'Maintenance', icon: Wrench },
    { to: '/owner/payments', label: 'Transactions', icon: Receipt },
    { to: '/owner/agreements', label: 'Agreements', icon: FileSignature },
    { to: '/owner/staff', label: 'Staff & Roles', icon: UserCog, ownerOnly: true },
    { to: '/owner/activity', label: 'Activity Logs', icon: ScrollText, ownerOnly: true },
    { to: '/owner/settings', label: 'Settings', icon: Settings },
  ].filter((item) => !item.ownerOnly || isOwner)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200 bg-white px-3.5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div>
        {/* LOGO Branding matching Figma */}
        <div className="flex items-center justify-between px-3 py-1 mb-6">
          <span className="text-xl font-black tracking-wider text-blue-600">
            LOGO
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/owner/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-tight transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
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
      <div className="border-t border-slate-100 pt-3 px-2">
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 tracking-tight">
                Property Management Web Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-64">
              <input
                type="text"
                placeholder="Search for..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-3.5 pr-9 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            <NotificationBell />

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
                {initials}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-800">{displayName}</p>
                <p className="text-[10px] text-slate-400 -mt-0.5">{organization}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
