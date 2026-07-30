import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  notificationsApi,
  type CreateNotificationRequest,
  type UpdateNotificationPreferencesRequest,
} from './notificationsApi'

const KEYS = {
  list: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  preferences: ['notifications', 'preferences'] as const,
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

export function useNotificationPreferences() {
  return useQuery({
    queryKey: KEYS.preferences,
    queryFn: notificationsApi.getPreferences,
  })
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: UpdateNotificationPreferencesRequest) =>
      notificationsApi.updatePreferences(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.preferences }),
  })
}
