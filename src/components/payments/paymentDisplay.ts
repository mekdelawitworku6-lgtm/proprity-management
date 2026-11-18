import type { PaymentMethod, PaymentRecord, PaymentStatus } from '../../types/api'

/** Display labels for the API enums. */
export const METHOD_LABELS: Record<PaymentMethod, string> = {
  TELEBIRR: 'Telebirr',
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
}

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Completed',
  FAILED: 'Failed',
  REJECTED: 'Rejected',
}

export function methodLabel(method: PaymentMethod): string {
  return METHOD_LABELS[method] ?? method
}

export function statusLabel(status: PaymentStatus): string {
  return STATUS_LABELS[status] ?? status
}

const STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-rose-50 text-rose-700',
  REJECTED: 'bg-rose-50 text-rose-700',
}

export function statusBadgeClass(status: PaymentStatus): string {
  return `rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-700'}`
}

const METHOD_BADGE: Record<PaymentMethod, string> = {
  TELEBIRR: 'bg-blue-50 text-blue-700 border border-blue-200',
  BANK_TRANSFER: 'bg-violet-50 text-violet-700 border border-violet-200',
  CASH: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export function methodBadgeClass(method: PaymentMethod): string {
  return `rounded-md px-2 py-0.5 text-[10px] font-medium ${METHOD_BADGE[method] ?? 'bg-slate-100 text-slate-700'}`
}

/** "12 Mar 2026, 14:32" from an ISO timestamp. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`
}

/** Compact money for the stat cards: 1250000 -> "1.3M". */
export function formatCompactMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ETB`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ETB`
  return `${amount.toLocaleString()} ETB`
}

/** The month label a payment settled, e.g. "Mar 2026". */
export function formatPeriod(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

/** The bank / gateway reference when the provider supplied one, else our own. */
export function providerReference(payment: PaymentRecord): string {
  return payment.providerReference ?? payment.referenceNo
}

/** True when the payment covered months beyond the invoice it was booked against. */
export function isPrepaid(payment: PaymentRecord): boolean {
  return payment.prepaidMonths > 0
}

/**
 * "Prepaid through Mar 2026" — the sentence that tells an owner no transfer is due yet.
 * Returns null for an ordinary single-month payment.
 */
export function prepaidSummary(payment: PaymentRecord): string | null {
  if (!isPrepaid(payment) || !payment.prepaidThrough) return null
  const months = payment.prepaidMonths
  const monthWord = months === 1 ? 'month' : 'months'
  const credit = payment.creditAmount > 0 ? ` · ${formatMoney(payment.creditAmount)} credit` : ''
  return `Prepaid ${months} ${monthWord} through ${formatPeriod(payment.prepaidThrough)}${credit}`
}

/** Client-side search across the fields an owner would type a tenant or unit name into. */
export function matchesPaymentSearch(payment: PaymentRecord, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [
    payment.referenceNo,
    payment.providerReference ?? '',
    payment.tenant.fullName,
    payment.property.name,
    payment.invoice?.invoiceNo ?? '',
    payment.agreement.referenceNo,
    ...payment.allocations.map((allocation) => allocation.invoiceNo),
  ].some((field) => field.toLowerCase().includes(needle))
}