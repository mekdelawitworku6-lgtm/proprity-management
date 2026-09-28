import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Tenant } from '../../types'
import { useLogger } from '../../utils/logger'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAdd: (tenant: Omit<Tenant, 'id'>) => void
}

export function AddTenantModal({ isOpen, onClose, onAdd }: Props) {
  const log = useLogger('modals', 'AddTenantModal')
  const [tenantName, setTenantName] = useState('')
  const [unitNo, setUnitNo] = useState('')
  const [buildingName, setBuildingName] = useState('Building A - Bole Plaza')
  const [tenantType, setTenantType] = useState<Tenant['tenantType']>('Individual')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [leaseType, setLeaseType] = useState<Tenant['leaseType']>('Standard (12 mo)')
  const [leaseStart, setLeaseStart] = useState('2026-03-01')
  const [leaseEnd, setLeaseEnd] = useState('2027-02-28')
  const [monthlyRent, setMonthlyRent] = useState('14000')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantName || !unitNo) {
      log.warn('submit blocked — tenant name and unit are required')
      return
    }

    log.info('submitting new tenant', {
      tenantName,
      unitNo,
      buildingName,
      monthlyRent: Number(monthlyRent) || 12000,
    })

    onAdd({
      tenantName,
      unitNo,
      buildingName,
      tenantType,
      contactPhone: contactPhone || '+251-911-234567',
      contactEmail: contactEmail || `${tenantName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      leaseType,
      leaseStart,
      leaseEnd,
      monthlyRent: Number(monthlyRent) || 12000,
      paymentStatus: 'Current',
      status: 'Active',
    })

    setTenantName('')
    setUnitNo('')
    log.info('closed after successful submit')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Tenant</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Create a new tenant record and assign to a unit
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenant Full Name
              </label>
              <input
                type="text"
                placeholder="e.g., Abebe Kebede"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Number
              </label>
              <input
                type="text"
                placeholder="e.g., A-201"
                required
                value={unitNo}
                onChange={(e) => setUnitNo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Building
              </label>
              <select
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Building A - Bole Plaza">Building A - Bole Plaza</option>
                <option value="Building B - Kazanchis Heights">Building B - Kazanchis Heights</option>
                <option value="Building C - CMC Towers">Building C - CMC Towers</option>
                <option value="Building D - Sarbet View">Building D - Sarbet View</option>
                <option value="Building E - Lideta Residences">Building E - Lideta Residences</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenant Type
              </label>
              <select
                value={tenantType}
                onChange={(e) => setTenantType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Individual">Individual</option>
                <option value="Family">Family</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+251-911-234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="tenant@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lease Type
              </label>
              <select
                value={leaseType}
                onChange={(e) => setLeaseType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Standard (12 mo)">Standard (12 mo)</option>
                <option value="Short-term (1-12 mo)">Short-term (1-12 mo)</option>
                <option value="Long-term (24+ mo)">Long-term (24+ mo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lease Start
              </label>
              <input
                type="date"
                value={leaseStart}
                onChange={(e) => setLeaseStart(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lease End
              </label>
              <input
                type="date"
                value={leaseEnd}
                onChange={(e) => setLeaseEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Rent (ETB)
            </label>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2744] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1A365D] transition"
            >
              Add Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
