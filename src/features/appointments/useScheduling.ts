import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAvailableSlots,
  getDoctorSchedule,
  setDoctorSchedule,
  addScheduleException,
  removeScheduleException,
  type DayScheduleInput,
  type AddExceptionRequest,
} from './schedulingApi'

export function useAvailableSlots(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ['available-slots', doctorId, date],
    queryFn: () => getAvailableSlots(doctorId!, date!),
    enabled: !!doctorId && !!date,
    staleTime: 60 * 1000,
  })
}

export function useDoctorSchedule(doctorId: string | null) {
  return useQuery({
    queryKey: ['doctor-schedule', doctorId],
    queryFn: () => getDoctorSchedule(doctorId!),
    enabled: !!doctorId,
  })
}

export function useSetDoctorSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (days: DayScheduleInput[]) => setDoctorSchedule(doctorId, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule', doctorId] })
      queryClient.invalidateQueries({ queryKey: ['available-slots', doctorId] })
    },
  })
}

export function useAddScheduleException(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AddExceptionRequest) => addScheduleException(doctorId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule', doctorId] })
      queryClient.invalidateQueries({ queryKey: ['available-slots', doctorId] })
    },
  })
}

export function useRemoveScheduleException(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (exceptionId: string) => removeScheduleException(doctorId, exceptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule', doctorId] })
      queryClient.invalidateQueries({ queryKey: ['available-slots', doctorId] })
    },
  })
}
