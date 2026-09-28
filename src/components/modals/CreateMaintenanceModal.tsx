import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { MaintenanceRequest } from '../../types'
import { useLogger } from '../../utils/logger'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (request: Omit<MaintenanceRequest, 'id' | 'code' | 'requestedDate'>) => void
}

export function CreateMaintenanceModal({ isOpen, onClose, onSubmit }: Props) {
  const log = useLogger('modals', 'CreateMaintenanceModal')
  const [unitNumber, setUnitNumber] = useState('')
  const [category, setCategory] = useState<MaintenanceRequest['category']>('Plumbing')
  const [issueSummary, setIssueSummary] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('Medium')
  const [assignedTechnician, setAssignedTechnician] = useState('Mulugeta Tadesse')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitNumber || !issueSummary) {
      log.warn('submit blocked — unit number and issue summary are required')
      return
    }

    log.info('submitting maintenance request', { unitNumber, category, priority, issueSummary })

    onSubmit({
      unitNumber: unitNumber.startsWith('Unit ') ? unitNumber : `Unit ${unitNumber}`,
      buildingName: 'Building A - Bole Plaza',
      tenantName: 'Resident Tenant',
      category,
      issueSummary,
      description: description || issueSummary,
      priority,
      status: 'Pending',
      assignedTechnician,
    })

    setUnitNumber('')
    setIssueSummary('')
    setDescription('')
    log.info('closed after successful submit')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Maintenance Request</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Submit a new maintenance request for a unit
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Number
              </label>
              <input
                type="text"
                placeholder="e.g., A-201"
                required
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Electrical">Electrical</option>
                <option value="Security">Security</option>
                <option value="Carpentry">Carpentry</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issue Summary
            </label>
            <input
              type="text"
              placeholder="Short description of the issue"
              required
              value={issueSummary}
              onChange={(e) => setIssueSummary(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide detailed information about the maintenance issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign To
              </label>
              <select
                value={assignedTechnician}
                onChange={(e) => setAssignedTechnician(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Mulugeta Tadesse">Mulugeta Tadesse</option>
                <option value="Dawit Mengistu">Dawit Mengistu</option>
                <option value="Ermias Tesfaye">Ermias Tesfaye</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1E40AF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition"
            >
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
