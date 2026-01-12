import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const joinEventSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  wishlist: z.string().optional(),
})

type JoinEventFormData = z.infer<typeof joinEventSchema>

interface JoinEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; email: string; wishlist?: string[] }) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
}

export default function JoinEventModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: JoinEventModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinEventFormData>({
    resolver: zodResolver(joinEventSchema),
  })

  const handleFormSubmit = async (data: JoinEventFormData) => {
    // Split wishlist by newlines or commas
    const wishlistItems = data.wishlist
      ? data.wishlist
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : []

    await onSubmit({
      ...data,
      wishlist: wishlistItems.length > 0 ? wishlistItems : undefined,
    })
    reset()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-gold-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-gradient-gold">
              🎁 Join This Event
            </h2>
            <button
              onClick={onClose}
              className="text-gold/60 hover:text-gold transition-colors"
              disabled={isSubmitting}
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

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-snow-white mb-2">
                Your Name <span className="text-gold">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className={`w-full px-4 py-3 border-2 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:outline-none transition-colors ${
                  errors.name
                    ? 'border-red-400'
                    : 'border-gold/30 focus:border-gold'
                }`}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-snow-white mb-2">
                Email Address <span className="text-gold">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 border-2 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-red-400'
                    : 'border-gold/30 focus:border-gold'
                }`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              )}
              <p className="mt-1 text-xs text-snow-white/60">
                We'll send you a confirmation email
              </p>
            </div>

            <div>
              <label
                htmlFor="wishlist"
                className="block text-sm font-semibold text-snow-white mb-2"
              >
                Wishlist (Optional)
              </label>
              <textarea
                id="wishlist"
                {...register('wishlist')}
                rows={4}
                placeholder="Enter your wishlist items, separated by commas or new lines&#10;e.g., Book, Coffee mug, Gift card"
                className="w-full px-4 py-3 border-2 border-gold/30 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:outline-none transition-colors resize-none"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-snow-white/60">
                Help your Secret Santa know what you'd like!
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-500/20 border-2 border-red-400/50 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-red-200">{error}</p>
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
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep rounded-xl font-bold hover:scale-105 transition-transform shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining...' : 'Join Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

