import { apiFetch } from '@/shared/lib/api/apiFetch'

const BASE = '/api/notifications'

export interface NotificationItem {
  id: string
  senderName: string
  title: string
  message: string
  type: string
  referenceId: string | null
  isRead: boolean
  createdAt: string
}

export interface CreateNotificationRequest {
  recipientUserId: string
  title: string
  message: string
  type: string
  referenceId?: string
}

export const notificationsApi = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiFetch(BASE)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiFetch(`${BASE}/unread-count`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  createNotification: async (body: CreateNotificationRequest): Promise<{ id: string }> => {
    const res = await apiFetch(BASE, { method: 'POST', body: JSON.stringify(body) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  markAsRead: async (id: string): Promise<void> => {
    const res = await apiFetch(`${BASE}/${id}/read`, { method: 'PUT' })
    if (!res.ok) throw new Error(await res.text())
  },

  markAllAsRead: async (): Promise<void> => {
    const res = await apiFetch(`${BASE}/read-all`, { method: 'PUT' })
    if (!res.ok) throw new Error(await res.text())
  },
}
