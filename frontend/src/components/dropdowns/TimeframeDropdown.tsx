import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export type TimeframeInterval = 
  | '1m' | '2m' | '3m' | '4m' | '5m' | '10m' | '15m' | '30m' | '45m'
  | '1h' | '2h' | '3h' | '4h'
  | '1d'

interface TimeframeOption {
  value: TimeframeInterval
  label: string
}

interface TimeframeGroup {
  name: string
  options: TimeframeOption[]
}

const TIMEFRAME_GROUPS: TimeframeGroup[] = [
  {
    name: 'Minutes',
    options: [
      { value: '1m', label: '1m' },
      { value: '2m', label: '2m' },
      { value: '3m', label: '3m' },
      { value: '4m', label: '4m' },
      { value: '5m', label: '5m' },
      { value: '10m', label: '10m' },
      { value: '15m', label: '15m' },
      { value: '30m', label: '30m' },
      { value: '45m', label: '45m' },
    ],
  },
  {
    name: 'Hours',
    options: [
      { value: '1h', label: '1H' },
      { value: '2h', label: '2H' },
      { value: '3h', label: '3H' },
      { value: '4h', label: '4H' },
    ],
  },
  {
    name: 'Days',
    options: [
      { value: '1d', label: '1D' },
    ],
  },
]

const STORAGE_KEY = 'spectra_trading_interval'

interface TimeframeDropdownProps {
  selectedInterval: TimeframeInterval
  onSelect: (interval: TimeframeInterval) => void
}

export default function TimeframeDropdown({ selectedInterval, onSelect }: TimeframeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get display label for selected interval
  const getLabel = (value: TimeframeInterval): string => {
    for (const group of TIMEFRAME_GROUPS) {
      const option = group.options.find(o => o.value === value)
      if (option) return option.label
    }
    return value
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (interval: TimeframeInterval) => {
    onSelect(interval)
    setIsOpen(false)
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, interval)
  }

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors min-w-[80px]"
      >
        <span className="font-semibold text-white text-sm">{getLabel(selectedInterval)}</span>
        <ChevronDown className={`h-4 w-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-50 overflow-hidden">
          {TIMEFRAME_GROUPS.map((group, groupIndex) => (
            <div key={group.name}>
              {/* Group Header */}
              <div className="px-3 py-2 text-xs font-semibold text-dark-400 uppercase tracking-wider bg-dark-900/50">
                {group.name}
              </div>
              {/* Group Options */}
              <div className="grid grid-cols-4 gap-1 p-2">
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedInterval === option.value
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {/* Divider between groups */}
              {groupIndex < TIMEFRAME_GROUPS.length - 1 && (
                <div className="border-t border-dark-700" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
