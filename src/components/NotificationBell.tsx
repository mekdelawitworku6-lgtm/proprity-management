import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../store/adminApi'
import { toErrorMessage } from '../store/api'
import { useLogger } from '../utils/logger'

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotificationBell() {
  const log = useLogger('actions', 'NotificationBell')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // The badge polls; the list only loads when the panel is actually open.
  const { data: unread } = useGetUnreadCountQuery(undefined, { pollingInterval: 60_000 })
  const { data, isFetching, error } = useGetNotificationsQuery({ limit: 8 }, { skip: !open })
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()
  const [markRead] = useMarkNotificationReadMutation()

  const unreadCount = unread?.unread ?? 0

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleMarkAll = async () => {
    try {
      const result = await markAllRead().unwrap()
      log.info('marked all notifications read', { updated: result.updated })
    } catch (caught) {
      log.error('mark all read failed', { message: toErrorMessage(caught) })
    }
  }

  const handleMarkOne = async (id: string) => {
    try {
      await markRead(id).unwrap()
    } catch (caught) {
      log.error('mark read failed', { message: toErrorMessage(caught) })
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Notifications</p>
              <p className="text-[10px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || isMarkingAll}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isFetching && !data && (
              <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </div>
            )}

            {error && (
              <p className="px-4 py-6 text-center text-[11px] font-medium text-red-600">
                {toErrorMessage(error)}
              </p>
            )}

            {data && data.docs.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <Inbox className="h-5 w-5 text-slate-300" />
                <p className="text-[11px] font-medium text-slate-500">No notifications yet</p>
                <p className="text-[10px] text-slate-400">
                  Alerts appear here when something needs your attention.
                </p>
              </div>
            )}

            {data?.docs.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleMarkOne(notification.id)}
                className={`flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  notification.readAt ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!notification.readAt && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800">{notification.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      {notification.type} · {formatWhen(notification.createdAt)}
                      {notification.channels.includes('SMS') ? ' · SMS sent' : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
