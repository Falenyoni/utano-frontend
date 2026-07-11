import { useNavigate } from 'react-router'
import { useAppointments } from './useAppointments'
import { Link } from 'react-router'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function waitingSince(createdAt: string) {
  const arrived = new Date(createdAt)
  const now = new Date()
  const mins = Math.floor((now.getTime() - arrived.getTime()) / 60000)
  if (mins < 1) return 'Just arrived'
  if (mins < 60) return `${mins}m waiting`
  return `${Math.floor(mins / 60)}h ${mins % 60}m waiting`
}

const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
}

export function WaitingRoomPage() {
  const navigate = useNavigate()
  const today = todayISO()

  const { data: waiting, isLoading } = useAppointments({ date: today, status: 'Scheduled', pageSize: 100 })
  const { data: inProgress } = useAppointments({ date: today, status: 'InProgress', pageSize: 100 })

  const allPatients = [
    ...(inProgress?.data ?? []).map((a) => ({ ...a, _order: 0 })),
    ...(waiting?.data ?? []).map((a) => ({ ...a, _order: 1 })),
  ].sort((a, b) => {
    if (a._order !== b._order) return a._order - b._order
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const waitingCount = waiting?.totalCount ?? 0
  const inProgressCount = inProgress?.totalCount ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Waiting Room</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {inProgressCount > 0 && <span className="text-yellow-600 dark:text-yellow-400 font-medium">{inProgressCount} with doctor</span>}
            {inProgressCount > 0 && waitingCount > 0 && <span className="mx-1">·</span>}
            {waitingCount > 0 && <span>{waitingCount} waiting</span>}
            {waitingCount === 0 && inProgressCount === 0 && <span>No patients currently</span>}
          </p>
        </div>
        <Link
          to="/appointments/walk-in"
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Register Walk-in
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {!isLoading && allPatients.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">
            <p className="text-lg mb-1">Waiting room is empty</p>
            <p>Register a walk-in or check back when patients arrive.</p>
          </div>
        )}
        {allPatients.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">#</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Patient</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Arrived</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {allPatients.map((appt, idx) => (
                <tr key={appt.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{appt.patientName}</p>
                    {appt.notes && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{appt.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{appt.doctorName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${appt.type === 'WalkIn' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {appt.type === 'WalkIn' ? 'Walk-in' : appt.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 dark:text-gray-300">{appt.startTime.slice(0, 5)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{waitingSince(appt.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${STATUS_BADGE[appt.status] ?? ''}`}>
                      {appt.status === 'InProgress' ? 'With Doctor' : 'Waiting'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {appt.status === 'Scheduled' && (
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
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-medium"
                      >
                        Open Visit
                      </button>
                    )}
                    {appt.status === 'InProgress' && (
                      <button
                        onClick={() => navigate('/consultations')}
                        className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        View Visit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
