import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  FileSignature,
  Scale,
  Receipt,
  History,
  LogOut,
  LayoutDashboard,
  Search,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../store/hooks'
import { NotificationBell } from '../NotificationBell'
import { useGetAdminUsersQuery } from '../../store/adminApi'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  // Drives the "Owner Requests" badge; PENDING owners are the request queue.
  const { data: pendingOwners } = useGetAdminUsersQuery(
    { role: 'OWNER', approvalStatus: 'PENDING', limit: 1 },
    { refetchOnMountOrArgChange: true }
  )
  const pendingCount = pendingOwners?.total ?? 0

  const displayName = currentUser?.fullName ?? 'Platform Administrator'
  const organization = currentUser?.role === 'TELECOM' ? 'Ethio Telecom' : 'Possible Technology'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PT'

  const navItems = [
    { to: '/admin/dashboard', label: 'Platform Overview', icon: LayoutDashboard, badge: 0 },
    { to: '/admin/owners', label: 'Owner Requests', icon: Building2, badge: pendingCount },
    { to: '/admin/tenants', label: 'All Tenants', icon: Users, badge: 0 },
    { to: '/admin/agreements', label: 'Agreement Registry', icon: FileSignature, badge: 0 },
    { to: '/admin/disputes', label: 'Escalated Disputes', icon: Scale, badge: 0 },
    { to: '/admin/payments', label: 'Ethio Telecom Payments', icon: Receipt, badge: 0 },
    { to: '/admin/audit', label: 'Audit Trail & Logs', icon: History, badge: 0 },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200/80 bg-slate-900 px-4 py-5 shadow-xs text-white">
      <div>
        {/* Admin Branding */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 font-black text-white text-xs shadow-xs">
            PT
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white">PossibleTech</span>
            <p className="text-[10px] font-medium text-blue-300 -mt-1 leading-tight">
              & Ethio Telecom Admin
            </p>
          </div>
        </div>

        {/* Nav list */}
        <nav className="mt-5 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-slate-800 pt-4 px-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium text-rose-400 transition hover:bg-slate-800 hover:text-rose-300"
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
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
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 lg:px-8 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Admin Control Dashboard
              </span>
              <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                Possible Tech & Ethio Telecom
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-60">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Audit search..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <NotificationBell />

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                {initials}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-800">{displayName}</p>
                <p className="text-[10px] text-slate-400">{organization}</p>
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
