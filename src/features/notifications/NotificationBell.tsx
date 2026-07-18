import { useEffect, useRef, useState } from 'react'
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from './useNotifications'
import type { NotificationItem } from './notificationsApi'

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={hasUnread ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={hasUnread ? 0 : 1.8}
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: count = 0, isError: countError } = useUnreadCount()
  const { data: notifications = [], isError: listError } = useNotifications()
  const markOne = useMarkAsRead()
  const markAll = useMarkAllAsRead()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleItemClick(n: NotificationItem) {
    if (!n.isRead) markOne.mutate(n.id)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <span className={count > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}>
          <BellIcon hasUnread={count > 0} />
        </span>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Notifications
            </span>
            {count > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {(countError || listError) && (
              <p className="text-sm text-red-500 dark:text-red-400 text-center py-8 px-4">
                Could not load notifications. Run the DB migration if this is a new deployment.
              </p>
            )}
            {!listError && notifications.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No notifications
              </p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !n.isRead ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                  <div className={!n.isRead ? '' : 'ml-4'}>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {n.senderName} · {timeAgo(n.createdAt)}
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
