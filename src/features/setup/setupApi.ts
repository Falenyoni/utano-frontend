const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface CreatePracticeRequest {
  name: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  adminPassword: string
}

export interface CreatePracticeResponse {
  practiceId: string
  practiceName: string
  adminUserId: string
  adminEmail: string
}

// Public self-service signup - no API key needed. The API-key-gated /api/auth/setup still
// exists for manual/internal use (call it directly via Swagger/curl), but this frontend flow is
// the public one, so it hits the dedicated /api/auth/register endpoint instead.
export async function createPractice(
  request: CreatePracticeRequest,
): Promise<CreatePracticeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (response.status === 429) throw new Error('Too many attempts. Please try again later.')
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || 'Failed to create practice.')
  }

  return response.json()
}
