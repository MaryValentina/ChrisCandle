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
  isReady: boolean
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
      isReady: initialData?.isReady || false,
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
      isReady: data.isReady,
    }

    onSubmit(participant as Omit<Participant, 'id'>)
    reset()
    setWishlistItems([])
    setWishlistInput('')
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-white rounded-xl shadow-christmas-lg border-2 border-christmas-green-200 p-6 md:p-8"
    >
      <h3 className="text-2xl font-bold text-christmas-red-600 mb-6">
        {initialData ? 'Edit Participant' : 'Add New Participant'}
      </h3>

      <div className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Name <span className="text-christmas-red-500">*</span>
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
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
              errors.name
                ? 'border-christmas-red-500'
                : 'border-gray-300 focus:border-christmas-green-500'
            }`}
            placeholder="Enter participant name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-christmas-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
              errors.email
                ? 'border-christmas-red-500'
                : 'border-gray-300 focus:border-christmas-green-500'
            }`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-christmas-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Wishlist Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-christmas-gold-500 focus:outline-none transition-colors"
              placeholder="Add wishlist item"
            />
            <button
              type="button"
              onClick={addWishlistItem}
              className="px-4 py-2 bg-christmas-gold-500 text-white rounded-lg font-semibold hover:bg-christmas-gold-600 transition-colors"
            >
              Add
            </button>
          </div>
          {wishlistItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {wishlistItems.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-christmas-red-50 text-christmas-red-700 rounded-full text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeWishlistItem(index)}
                    className="text-christmas-red-500 hover:text-christmas-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ready Status */}
        <div className="flex items-center gap-3">
          <input
            id="isReady"
            type="checkbox"
            {...register('isReady')}
            className="w-5 h-5 text-christmas-green-500 rounded focus:ring-christmas-green-500"
          />
          <label htmlFor="isReady" className="text-sm font-semibold text-gray-700">
            Mark as ready
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

