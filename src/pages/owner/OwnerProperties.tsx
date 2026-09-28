import { useState } from 'react'
import { Plus, Search, Building2, DollarSign, MapPin, Layers, UserCheck } from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import type { Property } from '../../types'
import { EditPropertyModal } from '../../components/modals/EditPropertyModal'

export default function OwnerProperties() {
  const { properties, addProperty, updateProperty } = usePlatform()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)

  const handleOpenAdd = () => {
    setEditingProperty(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop)
    setIsModalOpen(true)
  }

  const handleSaveProperty = (savedData: Partial<Property>) => {
    if (editingProperty) {
      updateProperty(editingProperty.id, savedData)
    } else {
      addProperty(savedData)
    }
  }

  const filteredProperties = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manager.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalMonthlyRevETB = properties.reduce((acc, p) => acc + p.monthlyRevenue, 0)

  return (
    <div className="space-y-5">
      {/* Header & Main Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Buildings</h1>
          <p className="text-xs text-slate-500">Manage your property portfolio and units</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F2744] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1A365D] transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          + Add New Building
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Buildings</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{properties.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Revenue</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <DollarSign className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {(totalMonthlyRevETB / 1000).toFixed(1)}K ETB
            <span className="text-xs font-normal text-slate-400">/month</span>
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search buildings by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-xs transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredProperties.map((prop) => (
          <div
            key={prop.id}
            onClick={() => handleOpenEdit(prop)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:border-blue-300 hover:shadow-md"
          >
            {/* Building Image */}
            <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
              <img
                src={prop.imageUrl}
                alt={prop.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute right-3 top-3 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                {prop.status}
              </span>
            </div>

            {/* Building Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {prop.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {prop.address}
                </p>
              </div>

              {/* Occupancy */}
              <div className="rounded-lg bg-slate-50 p-2 text-xs">
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Occupancy</span>
                  <span className="font-semibold text-slate-800">
                    {prop.occupiedUnits}/{prop.totalUnits} units (
                    {Math.round((prop.occupiedUnits / prop.totalUnits) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${(prop.occupiedUnits / prop.totalUnits) * 100}%` }}
                  />
                </div>
              </div>

              {/* Specs & Revenue */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Floors / Year
                  </span>
                  <p className="font-medium text-slate-800">
                    {prop.floors} fl · {prop.yearBuilt}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> Manager
                  </span>
                  <p className="font-medium text-slate-800 truncate">{prop.manager}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Monthly Revenue:</span>
                <span className="font-bold text-slate-900">
                  {prop.monthlyRevenue.toLocaleString()} ETB
                </span>
              </div>

              {/* Amenities tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {prop.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      <EditPropertyModal
        isOpen={isModalOpen}
        property={editingProperty}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProperty}
      />
    </div>
  )
}
