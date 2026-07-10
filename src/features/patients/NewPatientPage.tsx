import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { patientSchema, type PatientFormValues } from './patientSchema'
import { useCreatePatient } from './useCreatePatient'

export function NewPatientPage() {
  const navigate = useNavigate()
  const createPatient = useCreatePatient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  })

  function onSubmit(values: PatientFormValues) {
    createPatient.mutate(values, {
      onSuccess: () => navigate('/patients'),
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Register New Patient</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Personal Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input {...register('firstName')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input {...register('lastName')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input {...register('middleName')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" {...register('dateOfBirth')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select {...register('gender')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
              <input {...register('nationalId')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.nationalId && <p className="text-xs text-red-600 mt-1">{errors.nationalId.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Contact</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input {...register('contact.phoneNumber')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.contact?.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.contact.phoneNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('contact.email')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.contact?.email && <p className="text-xs text-red-600 mt-1">{errors.contact.email.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Address</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input {...register('address.street')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.address?.street && <p className="text-xs text-red-600 mt-1">{errors.address.street.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
              <input {...register('address.suburb')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.address?.suburb && <p className="text-xs text-red-600 mt-1">{errors.address.suburb.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input {...register('address.city')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.address?.city && <p className="text-xs text-red-600 mt-1">{errors.address.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input {...register('address.country')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              {errors.address?.country && <p className="text-xs text-red-600 mt-1">{errors.address.country.message}</p>}
            </div>
          </div>
        </section>

        {createPatient.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
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
            className="border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}