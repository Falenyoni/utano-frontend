import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAppointments,
  getDoctors,
  bookAppointment,
  cancelAppointment,
  checkInAppointment,
  rescheduleAppointment,
  type GetAppointmentsParams,
  type BookAppointmentRequest,
} from './appointmentsApi'

export function useAppointments(params: GetAppointmentsParams) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => getAppointments(params),
  })
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBookAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: BookAppointmentRequest) => bookAppointment(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useCheckInAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => checkInAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelAppointment(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      newDate,
      newStartTime,
      newEndTime,
    }: {
      id: string
      newDate: string
      newStartTime: string
      newEndTime: string
    }) => rescheduleAppointment(id, newDate, newStartTime, newEndTime),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
