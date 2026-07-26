import { useState, useRef, useEffect } from 'react'
import { OCCUPATIONS } from '@/shared/constants/occupations'

interface OccupationComboboxProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function OccupationCombobox({
  value,
  onChange,
  className = '',
  placeholder = 'Type or search occupation…',
}: OccupationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? OCCUPATIONS.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : OCCUPATIONS

  // Keep query in sync if parent resets the value (e.g. form reset)
  useEffect(() => {
    setQuery(value ?? '')
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    setOpen(true)
  }

  function select(occupation: string) {
    setQuery(occupation)
    onChange(occupation)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={(e) => { e.preventDefault(); select(o) }}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 ${
                o === query
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
