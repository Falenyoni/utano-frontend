import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppointments, useCancelAppointment, useCheckInAppointment, useRescheduleAppointment } from './useAppointments'
import { ImportAppointmentsModal } from './ImportAppointmentsModal'

const STATUS_COLORS: Record<string, string> = {
  Scheduled:  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Confirmed:  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  CheckedIn:  'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Completed:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Cancelled:  'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
  NoShow:     'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
}

const ACTIVE_STATUSES = ['Scheduled', 'Confirmed', 'CheckedIn', 'InProgress']

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [page, setPage] = useState(1)

  const [showImport, setShowImport] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')

  const { data, isLoading, error } = useAppointments({ date, page, pageSize: 20 })
  const cancelMutation = useCancelAppointment()
  const checkInMutation = useCheckInAppointment()
  const rescheduleMutation = useRescheduleAppointment()

  function openReschedule(apptId: string, apptDate: string, start: string, end: string) {
    setRescheduleId(apptId)
    setNewDate(apptDate)
    setNewStartTime(start.slice(0, 5))
    setNewEndTime(end.slice(0, 5))
  }

  function handleCancel() {
    if (!cancelId || !cancelReason.trim()) return
    cancelMutation.mutate(
      { id: cancelId, reason: cancelReason },
      { onSuccess: () => { setCancelId(null); setCancelReason('') } },
    )
  }

  function handleReschedule() {
    if (!rescheduleId || !newDate || !newStartTime || !newEndTime) return
    rescheduleMutation.mutate(
      { id: rescheduleId, newDate, newStartTime, newEndTime },
      { onSuccess: () => { setRescheduleId(null) } },
    )
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm'

  return (
    <div className="space-y-6">
      {showImport && <ImportAppointmentsModal onClose={() => setShowImport(false)} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Appointments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data ? `${data.totalCount} appointment${data.totalCount !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ↑ Import CSV
          </button>
          <Link
            to="/appointments/walk-in"
            className="inline-block border border-blue-600 text-blue-600 dark:text-blue-400 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            + Walk-in
          </Link>
          <Link
            to="/appointments/new"
            className="inline-block bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Book Appointment
          </Link>
        </div>
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => { setDate(e.target.value); setPage(1) }}
        className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
      />

      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>}
      {error && <div className="text-sm text-red-600 dark:text-red-400">Failed to load appointments.</div>}
      {data && data.data.length === 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500">No appointments for this date.</div>
      )}

      {/* Mobile cards */}
      {data && data.data.length > 0 && (
        <div className="sm:hidden space-y-2">
          {data.data.map((appt) => (
            <div key={appt.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{appt.patientName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{appt.doctorName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[appt.status] ?? ''}`}>
                  {appt.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {appt.startTime.slice(0, 5)} – {appt.endTime.slice(0, 5)}
                </span>
                {ACTIVE_STATUSES.includes(appt.status) && (
                  <div className="flex gap-3">
                    {(appt.status === 'Scheduled' || appt.status === 'Confirmed') && (
                      <button
                        onClick={() => checkInMutation.mutate(appt.id)}
                        disabled={checkInMutation.isPending}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium disabled:opacity-50"
                      >
                        Check In
                      </button>
                    )}
                    {appt.status !== 'InProgress' && (
                      <button
                        onClick={() => navigate('/consultations/new', { state: { patientId: appt.patientId, patientName: appt.patientName, doctorId: appt.doctorId, doctorName: appt.doctorName, appointmentId: appt.id, visitDate: appt.appointmentDate } })}
                        className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                      >
                        Open Visit
                      </button>
                    )}
                    <button onClick={() => openReschedule(appt.id, appt.appointmentDate, appt.startTime, appt.endTime)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Reschedule</button>
                    <button onClick={() => setCancelId(appt.id)}
                      className="text-xs text-red-500 dark:text-red-400 hover:underline">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
        {data && data.data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Time</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Patient</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((appt) => (
                <tr key={appt.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {appt.startTime.slice(0, 5)} – {appt.endTime.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{appt.patientName}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{appt.doctorName}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{appt.type}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[appt.status] ?? ''}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {ACTIVE_STATUSES.includes(appt.status) && (
                      <div className="flex items-center justify-end gap-3">
                        {(appt.status === 'Scheduled' || appt.status === 'Confirmed') && (
                          <button
                            onClick={() => checkInMutation.mutate(appt.id)}
                            disabled={checkInMutation.isPending}
                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium disabled:opacity-50"
                          >
                            Check In
                          </button>
                        )}
                        {appt.status !== 'InProgress' && (
                          <button
                            onClick={() => navigate('/consultations/new', {
                              state: {
                                patientId: appt.patientId,
                                patientName: appt.patientName,
                                doctorId: appt.doctorId,
                                doctorName: appt.doctorName,
                                appointmentId: appt.id,
                                visitDate: appt.appointmentDate,
                              }
                            })}
                            className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                          >
                            Open Visit
                          </button>
                        )}
                        <button
                          onClick={() => openReschedule(appt.id, appt.appointmentDate, appt.startTime, appt.endTime)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setCancelId(appt.id)}
                          className="text-xs text-red-500 dark:text-red-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* end desktop table */}

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.hasPreviousPage}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNextPage}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reschedule Appointment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={inputClass}
                  min={todayISO()}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            {rescheduleMutation.isError && (
              <p className="text-xs text-red-600 dark:text-red-400">Failed to reschedule. Please try again.</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRescheduleId(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleReschedule}
                disabled={!newDate || !newStartTime || !newEndTime || rescheduleMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rescheduleMutation.isPending ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cancel Appointment</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              className={inputClass}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setCancelId(null); setCancelReason('') }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
