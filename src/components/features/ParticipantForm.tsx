import { useForm } from 'react-hook-form'
import { useState } from 'react'
import type { Participant } from '../../types'

interface ParticipantFormProps {
  onSubmit: (participant: Omit<Participant, 'id'>) => void
  onCancel?: () => void
  initialData?: Partial<Participant>
  submitLabel?: string
}

interface FormData {
  name: string
  email: string
  wishlist: string
}

export default function ParticipantForm({
  onSubmit,
  onCancel,
  initialData,
  submitLabel = 'Add Participant',
}: ParticipantFormProps) {
  const [wishlistItems, setWishlistItems] = useState<string[]>(
    initialData?.wishlist || []
  )
  const [wishlistInput, setWishlistInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      wishlist: '',
    },
  })

  const addWishlistItem = () => {
    if (wishlistInput.trim()) {
      setWishlistItems([...wishlistItems, wishlistInput.trim()])
      setWishlistInput('')
    }
  }

  const removeWishlistItem = (index: number) => {
    setWishlistItems(wishlistItems.filter((_, i) => i !== index))
  }

  const onFormSubmit = (data: FormData) => {
    const participant: Omit<Participant, 'id' | 'eventId' | 'joinedAt'> = {
      name: data.name,
      email: data.email || undefined,
      wishlist: wishlistItems.length > 0 ? wishlistItems : undefined,
      isReady: true, // Participants are automatically ready when added
    }

    onSubmit(participant as Omit<Participant, 'id'>)
    reset()
    setWishlistItems([])
    setWishlistInput('')
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-christmas-red-dark/40 backdrop-blur-sm rounded-xl shadow-gold border border-gold/20 p-6 md:p-8"
    >
      <h3 className="font-display text-2xl text-gradient-gold mb-6">
        {initialData ? 'Edit Participant' : 'Add New Participant'}
      </h3>

      <div className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-snow-white mb-2">
            Name <span className="text-gold">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
            className={`w-full px-4 py-3 border-2 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:outline-none transition-colors ${
              errors.name
                ? 'border-red-400'
                : 'border-gold/30 focus:border-gold'
            }`}
            placeholder="Enter participant name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-snow-white mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            className={`w-full px-4 py-3 border-2 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:outline-none transition-colors ${
              errors.email
                ? 'border-red-400'
                : 'border-gold/30 focus:border-gold'
            }`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
          )}
        </div>

        {/* Wishlist Field */}
        <div>
          <label className="block text-sm font-semibold text-snow-white mb-2">
            Wishlist Items
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={wishlistInput}
              onChange={(e) => setWishlistInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addWishlistItem()
                }
              }}
              className="flex-1 px-4 py-2 border-2 border-gold/30 rounded-lg bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:outline-none transition-colors"
              placeholder="Add wishlist item"
            />
            <button
              type="button"
              onClick={addWishlistItem}
              className="px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep rounded-lg font-semibold hover:scale-105 transition-transform shadow-gold"
            >
              Add
            </button>
          </div>
          {wishlistItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {wishlistItems.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 border border-gold/30 text-gold rounded-full text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeWishlistItem(index)}
                    className="text-gold hover:text-gold-light"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gold/20">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep rounded-xl font-bold hover:scale-105 transition-transform shadow-gold"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gold/30 text-gold bg-transparent rounded-xl font-bold hover:bg-gold/10 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

