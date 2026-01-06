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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-christmas-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-christmas-red-600">
              🎁 Join This Event
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name <span className="text-christmas-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.name
                    ? 'border-christmas-red-500'
                    : 'border-gray-300 focus:border-christmas-red-500'
                }`}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-christmas-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-christmas-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-christmas-red-500'
                    : 'border-gray-300 focus:border-christmas-green-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-christmas-red-600">{errors.email.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                We'll send you a confirmation email
              </p>
            </div>

            <div>
              <label
                htmlFor="wishlist"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Wishlist (Optional)
              </label>
              <textarea
                id="wishlist"
                {...register('wishlist')}
                rows={4}
                placeholder="Enter your wishlist items, separated by commas or new lines&#10;e.g., Book, Coffee mug, Gift card"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-gold-500 focus:outline-none transition-colors resize-none"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Help your Secret Santa know what you'd like!
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-christmas-red-50 border-2 border-christmas-red-200 rounded-xl">
                <p className="text-sm text-christmas-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas disabled:bg-gray-400 disabled:cursor-not-allowed"
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

