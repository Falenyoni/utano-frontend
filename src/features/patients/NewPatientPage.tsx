import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { patientSchema, type PatientFormValues } from './patientSchema'
import { useCreatePatient } from './useCreatePatient'
import { useMedicalAids } from '@/features/medicalAids/useMedicalAids'
import { COUNTRIES } from '@/shared/constants/countries'

const BLOOD_GROUPS = ['APositive', 'ANegative', 'BPositive', 'BNegative', 'ABPositive', 'ABNegative', 'OPositive', 'ONegative']
const BLOOD_GROUP_LABELS: Record<string, string> = {
  APositive: 'A+', ANegative: 'A-', BPositive: 'B+', BNegative: 'B-',
  ABPositive: 'AB+', ABNegative: 'AB-', OPositive: 'O+', ONegative: 'O-',
}

export function NewPatientPage() {
  const navigate = useNavigate()
  const createPatient = useCreatePatient()
  const { data: medicalAids } = useMedicalAids()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { address: { country: 'Zimbabwe' } },
  })

  function onSubmit(values: PatientFormValues) {
    createPatient.mutate(values, {
      onSuccess: () => navigate('/patients'),
    })
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const errorClass = 'text-xs text-red-600 dark:text-red-400 mt-1'

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Register New Patient</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Personal Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input {...register('firstName')} className={inputClass} />
              {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Last Name</label>
              <input {...register('lastName')} className={inputClass} />
              {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Middle Name</label>
              <input {...register('middleName')} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" {...register('dateOfBirth')} className={inputClass} />
              {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <select {...register('gender')} className={inputClass}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className={errorClass}>{errors.gender.message}</p>}
            </div>

            <div>
              <label className={labelClass}>National ID</label>
              <input {...register('nationalId')} className={inputClass} />
              {errors.nationalId && <p className={errorClass}>{errors.nationalId.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone Number</label>
              <input {...register('contact.phoneNumber')} className={inputClass} />
              {errors.contact?.phoneNumber && (
                <p className={errorClass}>{errors.contact.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input {...register('contact.email')} className={inputClass} />
              {errors.contact?.email && <p className={errorClass}>{errors.contact.email.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Street</label>
              <input {...register('address.street')} className={inputClass} />
              {errors.address?.street && <p className={errorClass}>{errors.address.street.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Suburb</label>
              <input {...register('address.suburb')} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>City</label>
              <input {...register('address.city')} className={inputClass} />
              {errors.address?.city && <p className={errorClass}>{errors.address.city.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Country</label>
              <select {...register('address.country')} className={inputClass}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.address?.country && <p className={errorClass}>{errors.address.country.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Medical Aid (optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Scheme</label>
              <select {...register('medicalAidId')} className={inputClass}>
                <option value="">None</option>
                {medicalAids?.filter((a) => a.isActive).map((aid) => (
                  <option key={aid.id} value={aid.id}>{aid.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Membership Number</label>
              <input {...register('medicalAidNumber')} placeholder="e.g. PSM123456" className={inputClass} />
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Medical History (optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Blood Group</label>
              <select {...register('bloodGroup')} className={inputClass}>
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{BLOOD_GROUP_LABELS[bg]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Allergies</label>
            <textarea
              {...register('allergies')}
              rows={2}
              placeholder="e.g. Penicillin, Aspirin"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Chronic Conditions</label>
            <textarea
              {...register('chronicConditions')}
              rows={2}
              placeholder="e.g. Hypertension, Diabetes Type 2"
              className={inputClass}
            />
          </div>
        </section>

        {createPatient.isError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-md px-3 py-2">
            Failed to register patient. Please try again.
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createPatient.isPending}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {createPatient.isPending ? 'Saving...' : 'Register Patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
