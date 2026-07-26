import { apiFetch } from '@/shared/lib/api/apiFetch'

export async function getPracticeFeatures(): Promise<string[]> {
  const res = await apiFetch('/api/practice/features', { method: 'GET' })
  if (!res.ok) return []
  return res.json()
}
