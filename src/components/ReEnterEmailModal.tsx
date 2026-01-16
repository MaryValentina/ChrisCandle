import { useState } from 'react'

interface ReEnterEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
  isOrganizer?: boolean
}

export default function ReEnterEmailModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
  isOrganizer = false,
}: ReEnterEmailModalProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    await onSubmit(email.trim())
    setEmail('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-gold-lg max-w-md w-full">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-gradient-gold">
              {isOrganizer ? '🔍 View Participant Match' : '🔑 Re-enter Your Email'}
            </h2>
            <button
              onClick={onClose}
              className="text-gold/60 hover:text-gold transition-colors"
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-snow-white/70 mb-6">
            {isOrganizer 
              ? 'Enter a participant\'s email address to view their Secret Santa match.'
              : 'Enter the email address you used to join this event to access your participant card.'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-snow-white mb-2">
                Email Address <span className="text-gold">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gold/30 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:outline-none transition-colors"
                disabled={isSubmitting}
                autoFocus
                required
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-500/20 border-2 border-red-400/50 rounded-xl backdrop-blur-sm" role="alert">
                <p className="text-sm text-red-200 text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border-2 border-gold/30 text-gold bg-transparent rounded-xl font-bold hover:bg-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep rounded-xl font-bold hover:scale-105 transition-transform shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Checking...' : isOrganizer ? 'View Match' : 'Access My Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
