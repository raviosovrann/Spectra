import { ReactNode } from 'react'
import { ShieldAlert, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CredentialsGateProps {
  hasCredentials: boolean
  children: ReactNode
  title?: string
  description?: string
  ctaLabel?: string
}

export default function CredentialsGate({
  hasCredentials,
  children,
  title = 'Coinbase credentials required',
  description = 'Connect your Coinbase API keys in Settings to unlock this experience.',
  ctaLabel = 'Go to Settings',
}: CredentialsGateProps) {
  const navigate = useNavigate()

  if (hasCredentials) {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="max-w-xl w-full rounded-3xl border border-dark-800 bg-dark-900/60 p-10 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-500/10 text-danger-400 mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <p className="text-dark-300 mb-8 leading-relaxed">{description}</p>
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
        >
          <KeyRound className="h-5 w-5" />
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
