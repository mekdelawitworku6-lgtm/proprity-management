import { useAuth } from '../../context/AuthContext'

export default function OwnerSettings() {
  const { currentUser } = useAuth()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Owner Profile & Preferences</h1>
        <p className="text-xs text-slate-500">
          Manage your real estate license details, bank payout accounts, and notifications
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Owner Profile Information</h3>
          <p className="text-xs text-slate-500">Verified by Possible Tech Regulatory Layer</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Legal Name</label>
              <input
                type="text"
                disabled
                value={currentUser?.name || 'Abebe Tadesse'}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Registered Organization</label>
              <input
                type="text"
                disabled
                value={currentUser?.organization || 'Bole Plaza Real Estate LLC'}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Telebirr Merchant Payout Settlement</h3>
          <p className="text-xs text-slate-500">Direct deposit destination for tenant rent collections</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Telebirr Merchant ID</label>
              <input
                type="text"
                disabled
                value="MERCHANT-ETH-882910"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Commercial Bank of Ethiopia (CBE) Payout</label>
              <input
                type="text"
                disabled
                value="1000293849102 (Abebe Tadesse Prop)"
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
