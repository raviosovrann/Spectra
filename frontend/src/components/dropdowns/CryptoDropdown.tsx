import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Cryptocurrency } from '../../types/market'
import { formatCurrency } from '../../utils/formatters'

interface CryptoDropdownProps {
  selectedSymbol: string
  onSelect: (symbol: string) => void
  cryptocurrencies: Cryptocurrency[]
}

// Crypto icon mapping
const getCryptoIcon = (symbol: string): string => {
  const icons: Record<string, string> = {
    BTC: '₿', ETH: 'Ξ', SOL: '◎', ADA: '₳', DOGE: 'Ð', XRP: '✕',
    DOT: '●', AVAX: '🔺', POL: '⬡', LINK: '⬡', UNI: '🦄', ATOM: '⚛',
    LTC: 'Ł', BCH: '₿', ALGO: 'Ⱥ', XLM: '*', AAVE: '👻', NEAR: 'Ⓝ',
    APT: '◆', ARB: '🔵',
  }
  return icons[symbol] || symbol.charAt(0)
}

// Crypto name mapping
const getCryptoName = (symbol: string): string => {
  const names: Record<string, string> = {
    BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', ADA: 'Cardano',
    DOGE: 'Dogecoin', XRP: 'XRP', DOT: 'Polkadot', AVAX: 'Avalanche',
    POL: 'Polygon', LINK: 'Chainlink', UNI: 'Uniswap', ATOM: 'Cosmos',
    LTC: 'Litecoin', BCH: 'Bitcoin Cash', ALGO: 'Algorand', XLM: 'Stellar',
    AAVE: 'Aave', NEAR: 'NEAR', APT: 'Aptos', ARB: 'Arbitrum',
  }
  return names[symbol] || symbol
}

export default function CryptoDropdown({ selectedSymbol, onSelect, cryptocurrencies }: CryptoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get selected crypto data
  const selectedCrypto = cryptocurrencies.find(c => c.symbol === selectedSymbol)

  // Filter and sort cryptocurrencies
  const filteredCryptos = useMemo(() => {
    const searchLower = search.toLowerCase()
    return cryptocurrencies
      .filter(c => c.price > 0)
      .filter(c => 
        c.symbol.toLowerCase().includes(searchLower) ||
        getCryptoName(c.symbol).toLowerCase().includes(searchLower)
      )
      .sort((a, b) => {
        if (a.symbol === 'BTC') return -1
        if (b.symbol === 'BTC') return 1
        if (a.symbol === 'ETH') return -1
        if (b.symbol === 'ETH') return 1
        return b.marketCap - a.marketCap
      })
  }, [cryptocurrencies, search])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [search])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredCryptos.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCryptos[highlightedIndex]) {
          onSelect(filteredCryptos[highlightedIndex].symbol)
          setIsOpen(false)
          setSearch('')
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearch('')
        break
    }
  }

  const handleSelect = (symbol: string) => {
    onSelect(symbol)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors min-w-[240px]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400 font-bold text-lg">
          {getCryptoIcon(selectedSymbol)}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{selectedSymbol}</span>
            {selectedCrypto && (
              <span className="text-sm font-mono text-dark-300">
                {formatCurrency(selectedCrypto.price)}
              </span>
            )}
          </div>
          {selectedCrypto && (
            <span className={`text-xs font-semibold ${
              selectedCrypto.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
            }`}>
              {selectedCrypto.change24h >= 0 ? '+' : ''}{selectedCrypto.change24h.toFixed(2)}%
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-dark-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-900 border border-dark-600 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCryptos.length > 0 ? (
              filteredCryptos.map((crypto, index) => (
                <button
                  key={crypto.symbol}
                  onClick={() => handleSelect(crypto.symbol)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    index === highlightedIndex
                      ? 'bg-primary-500/10'
                      : 'hover:bg-dark-700/50'
                  } ${crypto.symbol === selectedSymbol ? 'bg-primary-500/5' : ''}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-700 text-lg">
                    {getCryptoIcon(crypto.symbol)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{crypto.symbol}</span>
                      <span className="text-xs text-dark-400">{getCryptoName(crypto.symbol)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">
                      {formatCurrency(crypto.price)}
                    </div>
                    <div className={`text-xs font-semibold ${
                      crypto.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
                    }`}>
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-dark-400 text-sm">
                No cryptocurrencies found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
