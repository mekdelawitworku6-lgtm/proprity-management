import React, { useState } from 'react'
import {
  Smartphone,
  Search,
  Home,
  FileSignature,
  Wrench,
  Receipt,
  ArrowRight,
  CheckCircle2,
  MapPin,
  X,
} from 'lucide-react'
import { usePlatform } from '../../context/PlatformContext'
import { useAuth } from '../../context/AuthContext'
import type { Property } from '../../types'

export default function TenantApp() {
  const {
    properties,
    agreements,
    complaints,
    transactions,
    createRentalAgreement,
    submitComplaint,
    recordPayment,
  } = usePlatform()

  const { currentUser, switchRole } = useAuth()

  // Mobile App Active Tab
  const [activeTab, setActiveTab] = useState<'explore' | 'my-lease' | 'agreements' | 'complaints' | 'payments'>('explore')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubCity, setSelectedSubCity] = useState('All')

  // Renting Modal
  const [rentingProperty, setRentingProperty] = useState<Property | null>(null)
  const [selectedUnit, setSelectedUnit] = useState('Unit 302')
  const [isSignAgreed, setIsSignAgreed] = useState(false)
  const [signatureName, setSignatureName] = useState(currentUser?.name || 'Yonas Bekele')

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('13500')
  const [payMethod, setPayMethod] = useState<'Telebirr' | 'CBE Birr'>('Telebirr')
  const [paymentSuccessRef, setPaymentSuccessRef] = useState<string | null>(null)

  // New Complaint Modal
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [complaintCategory, setComplaintCategory] = useState<any>('Plumbing')
  const [complaintSummary, setComplaintSummary] = useState('')
  const [complaintDesc, setComplaintDesc] = useState('')
  const [complaintPriority, setComplaintPriority] = useState<any>('Medium')

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = selectedSubCity === 'All' ? true : p.woredaSubCity === selectedSubCity
    return matchesSearch && matchesCity
  })

  // Handle Rental Submit & Digital Signature
  const handleExecuteRental = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rentingProperty || !isSignAgreed) return

    createRentalAgreement({
      propertyId: rentingProperty.id,
      propertyName: rentingProperty.name,
      unitNo: selectedUnit,
      ownerId: rentingProperty.ownerId || 'user-owner-1',
      ownerName: rentingProperty.manager,
      tenantId: currentUser?.id || 'user-tenant-1',
      tenantName: signatureName,
      tenantPhone: currentUser?.phone || '+251-912-478654',
      monthlyRent: rentingProperty.leasePrice,
      securityDeposit: rentingProperty.leasePrice * 2,
      leaseStart: '2026-04-01',
      leaseEnd: '2027-03-31',
      terms: 'Standard residential lease compliant with National Condominium Housing Framework.',
    })

    setRentingProperty(null)
    setActiveTab('my-lease')
  }

  // Handle Pay Rent via Telebirr
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault()
    const refCode = `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    recordPayment({
      tenantId: currentUser?.id || 'user-tenant-1',
      tenantName: currentUser?.name || 'Yonas Bekele',
      unitNo: 'Unit B-204',
      propertyId: 'prop-1',
      buildingName: 'Building A - Bole Plaza',
      type: 'Rent',
      category: 'Rent Payment',
      amount: Number(payAmount) || 13500,
      method: payMethod,
      reference: refCode,
    })

    setPaymentSuccessRef(`ETHIO-CONF-${Math.floor(1000000 + Math.random() * 9000000)}`)
  }

  // Handle Submit Complaint
  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintSummary) return

    submitComplaint({
      propertyId: 'prop-1',
      propertyName: 'Building A - Bole Plaza',
      unitNumber: 'Unit B-204',
      tenantId: currentUser?.id || 'user-tenant-1',
      tenantName: currentUser?.name || 'Yonas Bekele',
      category: complaintCategory,
      issueSummary: complaintSummary,
      description: complaintDesc || complaintSummary,
      priority: complaintPriority,
    })

    setComplaintSummary('')
    setComplaintDesc('')
    setIsComplaintModalOpen(false)
    setActiveTab('complaints')
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center justify-center">
      {/* Top Device Header & Role Switcher */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between text-white text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-emerald-400" />
          <span className="font-bold">Tenant Flutter Mobile App</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => switchRole('owner')}
            className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
          >
            Owner View
          </button>
          <button
            onClick={() => switchRole('admin')}
            className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white"
          >
            Admin View
          </button>
        </div>
      </div>

      {/* Smartphone Device Frame */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-white rounded-[44px] shadow-2xl border-[9px] border-slate-800 overflow-hidden flex flex-col">
        {/* Notch / Speaker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
          <div className="h-1 w-10 bg-slate-700 rounded-full" />
        </div>

        {/* Mobile App Header */}
        <div className="pt-7 pb-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white shrink-0 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-200 font-medium">Addis Ababa, Ethiopia</p>
              <h2 className="text-sm font-extrabold tracking-tight">Ketero Tenant Portal</h2>
            </div>
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              YB
            </div>
          </div>
        </div>

        {/* Main App Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50 text-slate-800 text-xs">
          {/* TAB 1: EXPLORE */}
          {activeTab === 'explore' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Bole, CMC, Lideta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-[11px] text-slate-800 placeholder-slate-400 shadow-2xs outline-none"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                {['All', 'Bole', 'Yeka', 'Kirkos', 'Lideta'].map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedSubCity(city)}
                    className={`rounded-full px-2.5 py-1 font-semibold whitespace-nowrap transition ${
                      selectedSubCity === city
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {/* Property Cards */}
              <div className="space-y-3">
                {filteredProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 pb-3"
                  >
                    <div className="relative h-32 w-full bg-slate-200">
                      <img
                        src={prop.imageUrl}
                        alt={prop.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                        {prop.leasePrice.toLocaleString()} ETB/mo
                      </span>
                    </div>

                    <div className="px-3 space-y-1">
                      <h3 className="font-bold text-slate-900 text-xs">{prop.name}</h3>
                      <p className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400" /> {prop.address}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {prop.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600 font-medium"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-3 pt-1">
                      <button
                        onClick={() => {
                          setRentingProperty(prop)
                          setIsSignAgreed(false)
                        }}
                        className="w-full flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700"
                      >
                        Request to Rent & Sign <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MY LEASE */}
          {activeTab === 'my-lease' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/40">
                    Active Lease
                  </span>
                  <span className="text-[10px] text-blue-200">Due in 5 Days</span>
                </div>

                <div>
                  <h3 className="font-bold text-sm">Building A - Bole Plaza</h3>
                  <p className="text-[11px] text-blue-200">Unit B-204 · Bole Road, Addis Ababa</p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-300">Monthly Rent</span>
                    <p className="text-base font-extrabold">13,500 ETB</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsPayModalOpen(true)
                      setPaymentSuccessRef(null)
                    }}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm"
                  >
                    Pay via Telebirr
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsComplaintModalOpen(true)}
                  className="rounded-xl bg-white border border-slate-200 p-3 text-left space-y-1 hover:border-blue-400 shadow-2xs"
                >
                  <Wrench className="h-4 w-4 text-amber-500" />
                  <p className="font-bold text-slate-800 text-[11px]">Report Issue</p>
                  <p className="text-[10px] text-slate-400">Plumbing, AC, repairs</p>
                </button>

                <button
                  onClick={() => setActiveTab('agreements')}
                  className="rounded-xl bg-white border border-slate-200 p-3 text-left space-y-1 hover:border-blue-400 shadow-2xs"
                >
                  <FileSignature className="h-4 w-4 text-blue-500" />
                  <p className="font-bold text-slate-800 text-[11px]">My Agreement</p>
                  <p className="text-[10px] text-slate-400">View digital contract</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AGREEMENTS */}
          {activeTab === 'agreements' && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900">Signed Digital Agreements</h3>
              <div className="space-y-2.5">
                {agreements.map((agr) => (
                  <div
                    key={agr.id}
                    className="rounded-2xl bg-white border border-slate-200 p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {agr.agreementNumber}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {agr.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{agr.propertyName}</p>
                      <p className="text-[10px] text-slate-500">{agr.unitNo} · {agr.monthlyRent.toLocaleString()} ETB/mo</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400 truncate max-w-[150px]">
                        {agr.digitalSignatureHash}
                      </span>
                      <span className="text-blue-600 font-bold">Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900">Maintenance & Complaints</h3>
                <button
                  onClick={() => setIsComplaintModalOpen(true)}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white"
                >
                  + New Issue
                </button>
              </div>

              <div className="space-y-2.5">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl bg-white border border-slate-200 p-3.5 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] text-slate-900">{c.code}</span>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {c.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{c.issueSummary}</p>
                    <p className="text-[10px] text-slate-500">{c.description}</p>
                    {c.adminRuling && (
                      <p className="text-[10px] text-purple-700 bg-purple-50 p-1.5 rounded font-medium">
                        Admin Decision: {c.adminRuling}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900">Payment History & Receipts</h3>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-[11px]">{tx.category}</p>
                      <p className="text-[9px] text-slate-400">{tx.dateTime} · {tx.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-xs">+{tx.amount.toLocaleString()} ETB</p>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="h-14 bg-white border-t border-slate-200 px-2 flex items-center justify-around shrink-0 text-[9px] font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'explore' ? 'text-blue-600' : ''}`}
          >
            <Search className="h-4 w-4" />
            Explore
          </button>
          <button
            onClick={() => setActiveTab('my-lease')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'my-lease' ? 'text-blue-600' : ''}`}
          >
            <Home className="h-4 w-4" />
            My Home
          </button>
          <button
            onClick={() => setActiveTab('agreements')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'agreements' ? 'text-blue-600' : ''}`}
          >
            <FileSignature className="h-4 w-4" />
            Agreements
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'complaints' ? 'text-blue-600' : ''}`}
          >
            <Wrench className="h-4 w-4" />
            Support
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'payments' ? 'text-blue-600' : ''}`}
          >
            <Receipt className="h-4 w-4" />
            Receipts
          </button>
        </div>
      </div>

      {/* Modal: Rent & Digital Agreement Signing */}
      {rentingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-3.5 text-xs text-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Rent Property</h3>
                <p className="text-[11px] text-slate-500">{rentingProperty.name}</p>
              </div>
              <button onClick={() => setRentingProperty(null)} className="p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRental} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Unit</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none"
                >
                  <option value="Unit 201">Unit 201 (2-Bedroom · 5,500 ETB/mo)</option>
                  <option value="Unit 302">Unit 302 (3-Bedroom · 6,000 ETB/mo)</option>
                  <option value="Unit 405">Unit 405 (Studio · 4,500 ETB/mo)</option>
                </select>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-[11px] space-y-1 text-blue-900 border border-blue-100">
                <p><strong>Monthly Rent:</strong> {rentingProperty.leasePrice.toLocaleString()} ETB</p>
                <p><strong>Security Deposit:</strong> {(rentingProperty.leasePrice * 2).toLocaleString()} ETB</p>
                <p><strong>Lease Term:</strong> 12 Months Standard Tenancy</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Digital Signature Name
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold outline-none"
                />
              </div>

              <label className="flex items-start gap-2 text-[10px] text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={isSignAgreed}
                  onChange={(e) => setIsSignAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600"
                />
                <span>
                  I understand this executes a legally binding digital tenancy agreement logged to the Possible Tech and Ethio Telecom registry.
                </span>
              </label>

              <button
                type="submit"
                disabled={!isSignAgreed}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Sign Agreement & Confirm Lease
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Telebirr Payment */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-3.5 text-xs text-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Pay Rent via Telebirr</h3>
                <p className="text-[11px] text-slate-500">Instant Ethio Telecom Mobile Money Settlement</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {paymentSuccessRef ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Payment Successful!</h4>
                <p className="text-[11px] text-slate-500">
                  Ethio Telecom Confirmation Ref: <br />
                  <strong className="font-mono text-blue-700">{paymentSuccessRef}</strong>
                </p>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="mt-3 w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount (ETB)</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('Telebirr')}
                      className={`py-2 px-2 rounded-xl text-center font-bold border text-[11px] ${
                        payMethod === 'Telebirr'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Telebirr Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod('CBE Birr')}
                      className={`py-2 px-2 rounded-xl text-center font-bold border text-[11px] ${
                        payMethod === 'CBE Birr'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      CBE Birr
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  Authorize {payAmount} ETB Payment
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Complaint */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-3 text-xs text-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Submit Maintenance Issue</h3>
                <p className="text-[11px] text-slate-500">Notifies building manager immediately</p>
              </div>
              <button onClick={() => setIsComplaintModalOpen(false)} className="p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC / Air Conditioning</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Security">Smart Lock / Security</option>
                  <option value="Carpentry">Carpentry / Doors</option>
                  <option value="General">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Short Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Kitchen sink pipe leaking"
                  value={complaintSummary}
                  onChange={(e) => setComplaintSummary(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={complaintPriority}
                  onChange={(e) => setComplaintPriority(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none"
                >
                  <option value="Urgent">Urgent (Emergency)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Submit Report to Owner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
