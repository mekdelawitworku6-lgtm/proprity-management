import { useState } from 'react'
import {
  Building2,
  Receipt,
  CreditCard,
  Users,
  AlertTriangle,
  FileWarning,
  Clock,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import {
  regionalDistributionData,
  complianceAlertsData,
  monthlyTransactionTrend,
} from '../../data/mockData'

export default function AdminDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 12 Months')
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)

  const getAlertIcon = (variant: string) => {
    switch (variant) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />
      case 'audit':
        return <FileWarning className="h-4 w-4 text-amber-600" />
      case 'review':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'injunction':
        return <ShieldAlert className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-slate-600" />
    }
  }

  const getAlertBadge = (variant: string) => {
    switch (variant) {
      case 'critical':
        return 'bg-rose-100 text-rose-700'
      case 'audit':
        return 'bg-amber-100 text-amber-700'
      case 'review':
        return 'bg-yellow-100 text-yellow-700'
      case 'injunction':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const minVol = 60
  const maxVol = 100
  const chartHeight = 140
  const chartWidth = 560

  const points = monthlyTransactionTrend.map((d, index) => {
    const x = (index / (monthlyTransactionTrend.length - 1)) * (chartWidth - 40) + 20
    const y = chartHeight - ((d.volume - minVol) / (maxVol - minVol)) * (chartHeight - 30) - 15
    return { x, y, ...d }
  })

  const pathD = points.reduce(
    (acc, curr, index, arr) => {
      if (index === 0) return `M ${curr.x} ${curr.y}`
      const prev = arr[index - 1]
      const cx = (prev.x + curr.x) / 2
      return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`
    },
    ''
  )

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Admin Control Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Platform-wide observation, payment reconciliation, and dispute governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ethio Telecom Gateway Active
          </span>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Registered Buildings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">47,545</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Payment Collection Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">88.4%</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Monthly Digital Transactions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">95.0M ETB</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">12,847</p>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column (7 cols): Geographic Distribution & Transaction Trend */}
        <div className="space-y-5 lg:col-span-7">
          {/* Geographic Distribution Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Geographic Distribution</h2>
              <span className="text-[11px] text-slate-400">Regional Portfolios</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {regionalDistributionData.map((region) => (
                <div
                  key={region.name}
                  className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{region.name}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        region.status === 'excellent'
                          ? 'bg-emerald-500'
                          : region.status === 'good'
                          ? 'bg-emerald-400'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <div className="mt-1 text-slate-500 text-[11px]">
                    <span>{region.buildingsCount.toLocaleString()} buildings</span>
                    <span className="mx-1.5">•</span>
                    <span className="font-semibold text-slate-700">
                      {region.collectionRate}% collection rate
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Excellent (&gt;90%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Good (85-90%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Needs Attention (&lt;85%)</span>
              </div>
            </div>
          </div>

          {/* Transaction Volume Trend Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Transaction Volume Trend
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-slate-800">
                    Total 2026 Volume: 95.0M ETB
                  </span>
                  <span className="flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> +4.7%
                  </span>
                </div>
              </div>

              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-none"
              >
                <option>Last 12 Months</option>
                <option>Q1-Q4 2025</option>
                <option>Year to Date</option>
              </select>
            </div>

            {/* Interactive SVG Chart */}
            <div className="mt-4 w-full overflow-hidden">
              <div className="relative h-44 w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-full w-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="70" x2={chartWidth} y2="70" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="110" x2={chartWidth} y2="110" stroke="#F1F5F9" strokeWidth="1" />

                  <path d={areaD} fill="url(#volumeGradient)" />

                  <path
                    d={pathD}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {points.map((pt, i) => (
                    <g key={pt.month}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredMonth === i ? 6 : 4}
                        fill="#FFFFFF"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(i)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      />
                    </g>
                  ))}
                </svg>

                <div className="mt-2 flex justify-between px-2 text-[10px] text-slate-400">
                  {monthlyTransactionTrend.map((d, i) => (
                    <span
                      key={d.month}
                      className={hoveredMonth === i ? 'font-bold text-blue-600' : ''}
                    >
                      {d.month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Compliance & Alerts & Maintenance Resolution */}
        <div className="space-y-5 lg:col-span-5">
          {/* Compliance & Alerts */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Compliance & Alerts</h2>
              <span className="text-[11px] text-slate-400">Active flags</span>
            </div>

            <div className="mt-4 space-y-2.5">
              {complianceAlertsData.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {getAlertIcon(alert.variant)}
                    <span className="font-medium text-slate-700">{alert.title}</span>
                  </div>
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${getAlertBadge(
                      alert.variant
                    )}`}
                  >
                    {alert.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Resolution Rate */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Maintenance Resolution Rate
              </h2>
              <span className="text-[11px] text-slate-400">National avg</span>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-emerald-500"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - 0.875)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-slate-900">87.5%</span>
                  <p className="text-[10px] text-slate-400 font-medium">Efficiency</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 w-full border-t border-slate-100 pt-4 text-center">
                <div className="rounded-lg bg-emerald-50/70 p-2">
                  <p className="text-sm font-bold text-emerald-700">245</p>
                  <p className="text-[10px] font-medium text-emerald-600">Resolved</p>
                </div>
                <div className="rounded-lg bg-amber-50/70 p-2">
                  <p className="text-sm font-bold text-amber-700">28</p>
                  <p className="text-[10px] font-medium text-amber-600">Pending</p>
                </div>
                <div className="rounded-lg bg-rose-50/70 p-2">
                  <p className="text-sm font-bold text-rose-700">8</p>
                  <p className="text-[10px] font-medium text-rose-600">Escalated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
