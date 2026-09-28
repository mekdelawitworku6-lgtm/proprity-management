export function ClassificationSummaries() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Lease Classification Summary */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-800">
          Lease Classification Summary
        </h3>
        <div className="mt-3 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Standard Leases (12 months)</span>
            <span className="font-semibold text-slate-800">4</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Short-term (1-12 months)</span>
            <span className="font-semibold text-slate-800">1</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Long-term (24+ months)</span>
            <span className="font-semibold text-slate-800">3</span>
          </div>
        </div>
      </div>

      {/* Tenant Classification */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-800">
          Tenant Classification
        </h3>
        <div className="mt-3 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-slate-500">Individual Tenants</span>
            </div>
            <span className="font-semibold text-slate-800">5</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-slate-500">Family Units</span>
            </div>
            <span className="font-semibold text-slate-800">3</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-slate-500">Corporate Clients</span>
            </div>
            <span className="font-semibold text-slate-800">1</span>
          </div>
        </div>
      </div>

      {/* Alerts & Actions Required */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-800">
          Alerts & Actions Required
        </h3>
        <div className="mt-3 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Leases Expiring Soon</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-700">
              1
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Late Payments</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[11px] font-bold text-rose-700">
              1
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Vacant Units</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-bold text-blue-700">
              1
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
