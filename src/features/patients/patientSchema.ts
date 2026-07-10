import { z } from 'zod'

export const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  nationalId: z.string().min(1, 'National ID is required'),
  contact: z.object({
    phoneNumber: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
  }),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    suburb: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  medicalAidId: z.string().uuid().optional().or(z.literal('')),
  medicalAidNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>
