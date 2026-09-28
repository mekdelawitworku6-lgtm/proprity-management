import React, { useState, useEffect } from 'react'
import { X, UploadCloud } from 'lucide-react'
import type { Property } from '../../types'
import { useLogger } from '../../utils/logger'

interface Props {
  isOpen: boolean
  property?: Property | null
  onClose: () => void
  onSave: (property: Partial<Property>) => void
}

export function EditPropertyModal({ isOpen, property, onClose, onSave }: Props) {
  const log = useLogger('modals', 'EditPropertyModal')
  const [name, setName] = useState('')
  const [manager, setManager] = useState('')
  const [address, setAddress] = useState('')
  const [woredaSubCity, setWoredaSubCity] = useState('Bole')
  const [propertyType, setPropertyType] = useState<Property['propertyType']>('Residential')
  const [squareMeters, setSquareMeters] = useState('640')
  const [leasePrice, setLeasePrice] = useState('6000')
  const [totalUnits, setTotalUnits] = useState('12')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (property) {
      setName(property.name)
      setManager(property.manager)
      setAddress(property.address)
      setWoredaSubCity(property.woredaSubCity || 'Bole')
      setPropertyType(property.propertyType)
      setSquareMeters(property.squareMeters?.toString() || '640')
      setLeasePrice(property.leasePrice?.toString() || '6000')
      setTotalUnits(property.totalUnits?.toString() || '12')
      setDescription(property.description || '')
    } else {
      setName('')
      setManager('')
      setAddress('')
      setWoredaSubCity('Bole')
      setPropertyType('Residential')
      setSquareMeters('')
      setLeasePrice('')
      setTotalUnits('')
      setDescription('')
    }
  }, [property, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !manager || !address) {
      log.warn('submit blocked — name, manager and address are required')
      return
    }

    log.info(property ? 'saving property edits' : 'creating new property', {
      id: property?.id ?? 'new',
      name,
      totalUnits: Number(totalUnits) || 10,
      leasePrice: Number(leasePrice) || 5000,
    })

    onSave({
      id: property?.id || `prop-${Date.now()}`,
      name,
      manager,
      address,
      woredaSubCity,
      propertyType,
      squareMeters: Number(squareMeters) || 500,
      leasePrice: Number(leasePrice) || 5000,
      totalUnits: Number(totalUnits) || 10,
      occupiedUnits: property?.occupiedUnits || Math.floor((Number(totalUnits) || 10) * 0.9),
      floors: property?.floors || 8,
      yearBuilt: property?.yearBuilt || 2022,
      monthlyRevenue: (Number(leasePrice) || 5000) * (Number(totalUnits) || 10),
      status: property?.status || 'Active',
      description,
      amenities: property?.amenities || ['Parking', 'Elevator', 'Security', 'Gym'],
      imageUrl: property?.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    })
    log.info('closed after save')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
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
                Name of Compound
              </label>
              <input
                type="text"
                placeholder="Building A - Bole Plaza"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manager
              </label>
              <input
                type="text"
                placeholder="Abebe Tadesse"
                required
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address
            </label>
            <input
              type="text"
              placeholder="Bole Road, Addis Ababa"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Woreda / Sub-city
              </label>
              <select
                value={woredaSubCity}
                onChange={(e) => setWoredaSubCity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Bole">Bole</option>
                <option value="Kirkos">Kirkos</option>
                <option value="Lideta">Lideta</option>
                <option value="Yeka">Yeka</option>
                <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                <option value="Arada">Arada</option>
                <option value="Gulele">Gulele</option>
                <option value="Kolfe Keranio">Kolfe Keranio</option>
                <option value="Akaky Kaliti">Akaky Kaliti</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed Use">Mixed Use</option>
                <option value="Condominium">Condominium</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Square Meters
              </label>
              <input
                type="number"
                placeholder="640"
                value={squareMeters}
                onChange={(e) => setSquareMeters(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lease Price (ETB/mo)
              </label>
              <input
                type="number"
                placeholder="6000"
                value={leasePrice}
                onChange={(e) => setLeasePrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Units
              </label>
              <input
                type="number"
                placeholder="12"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Provide general property details, building specifications, or notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Images
            </label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer">
              <UploadCloud className="h-7 w-7 text-slate-400" />
              <p className="mt-1.5 text-xs text-slate-600 font-medium">
                Click or drag images here (max 5)
              </p>
              <p className="text-[11px] text-slate-400">PNG, JPG or WEBP up to 10MB</p>
            </div>
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
              Save Property
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
