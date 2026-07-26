import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBranding, updateBranding as updateBrandingApi } from './rbacApi'
import { useAuth } from '@/shared/lib/auth/AuthContext'

const PRESET_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
  '#1d4ed8', '#111827',
]

export function BrandingPage() {
  const { user, updateBranding } = useAuth()
  const qc = useQueryClient()

  const { data: branding } = useQuery({ queryKey: ['branding'], queryFn: getBranding })

  const [primaryColor, setPrimaryColor] = useState(user?.primaryColor ?? '#3b82f6')
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logoBase64 ?? null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)

  const logoBase64Ref = useRef(logoBase64)
  useEffect(() => { logoBase64Ref.current = logoBase64 }, [logoBase64])

  useEffect(() => {
    if (branding?.logoBase64 && !logoBase64) {
      setLogoPreview(branding.logoBase64)
    }
  }, [branding?.logoBase64, logoBase64])

  useEffect(() => {
    if (branding?.primaryColor) {
      setPrimaryColor(branding.primaryColor)
    }
  }, [branding?.primaryColor])

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) { alert('Logo must be under 2 MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setLogoPreview(result)
      setLogoBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const save = useMutation({
    mutationFn: () => {
      const current = logoBase64Ref.current
      return updateBrandingApi({
        primaryColor,
        logoBase64: current === '' ? null : (current ?? undefined),
      })
    },
    onSuccess: () => {
      const current = logoBase64Ref.current
      const resolvedLogo =
        current === '' ? null
        : current !== null ? current
        : branding?.logoBase64 ?? user?.logoBase64 ?? null
      updateBranding(primaryColor, resolvedLogo)
      qc.invalidateQueries({ queryKey: ['branding'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Branding</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Customise how your practice appears in the app
        </p>
      </div>

      <div className="max-w-xl space-y-8">
        {/* Logo */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
            Practice Logo
          </label>
          <div className="flex items-center gap-6">
            <div className="shrink-0 flex flex-col items-center gap-2">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <span className="text-xs text-gray-400 text-center px-2">No logo</span>
                </div>
              )}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[96px] text-center">
                {user?.practiceName}
              </span>
            </div>
            <div className="space-y-2">
              <label className="cursor-pointer inline-flex px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Upload logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFile}
                  className="sr-only"
                />
              </label>
              {logoPreview && (
                <button
                  onClick={() => { setLogoPreview(null); setLogoBase64('') }}
                  className="block text-xs text-red-500 hover:underline"
                >
                  Remove logo
                </button>
              )}
              <p className="text-xs text-gray-400">PNG, SVG or JPEG · max 2 MB</p>
            </div>
          </div>
        </div>

        {/* Primary colour */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
            Primary Colour
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setPrimaryColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  primaryColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                }`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border border-gray-300 dark:border-gray-600 p-0.5 bg-transparent"
              title="Custom colour"
            />
          </div>
          <p className="text-xs text-gray-400">
            Selected: <code className="font-mono">{primaryColor}</code>
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
            Preview — Sidebar header
          </div>
          <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
            <div className="flex flex-col items-center gap-1.5 py-3 px-4 border border-gray-100 dark:border-gray-800 rounded-lg">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: primaryColor }}
                >
                  {user?.practiceName?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate">
                {user?.practiceName}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                style={{ background: primaryColor }}
              >
                Primary button
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Outline button
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: primaryColor }} />
              <span className="text-gray-700 dark:text-gray-300">Active nav item</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: primaryColor }}
          >
            {save.isPending ? 'Saving…' : 'Save Branding'}
          </button>
          {save.isError && <p className="text-xs text-red-500">{String(save.error)}</p>}
          {save.isSuccess && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Branding saved — changes apply immediately.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
