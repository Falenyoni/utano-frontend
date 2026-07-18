import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi, type CreateNotificationRequest } from './notificationsApi'

const KEYS = {
  list: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: notificationsApi.getMyNotifications,
    refetchInterval: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unreadCount,
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  })
}

export function useCreateNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateNotificationRequest) =>
      notificationsApi.createNotification(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list })
      qc.invalidateQueries({ queryKey: KEYS.unreadCount })
    },
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list })
      qc.invalidateQueries({ queryKey: KEYS.unreadCount })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list })
      qc.invalidateQueries({ queryKey: KEYS.unreadCount })
    },
  })
}
