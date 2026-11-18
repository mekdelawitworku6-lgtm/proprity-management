import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  isFetching?: boolean
  onChange: (page: number) => void
}

/** Shared pager for the server-paginated payments and agreement lists. */
export function Pagination({ page, totalPages, total, isFetching, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        {total.toLocaleString()} records
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page <strong className="text-slate-800">{page}</strong> of {totalPages} · {total.toLocaleString()} records
        {isFetching && <span className="ml-1 text-slate-400">· refreshing…</span>}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
