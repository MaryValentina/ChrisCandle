import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import QRCodeSVG from 'react-qr-code'
import { useEventStore } from '../stores/eventStore'
import { useAuth } from '../contexts/AuthContext'
import { createEvent as createFirebaseEvent } from '../lib/firebase'
import type { EventData } from '../types'

// Zod schema for event details
const eventDetailsSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  date: z.string().min(1, 'Date is required'),
  budget: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) > 0),
      'Budget must be a positive number'
    ),
  description: z.string().optional(),
})

type EventDetailsFormData = z.infer<typeof eventDetailsSchema>

const DRAFT_STORAGE_KEY = 'chriscandle-create-event-draft'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { organizerId } = useAuth()
  const { createEvent, updateEvent, currentEvent, resetEvent } = useEventStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [shareableLink, setShareableLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [firebaseEventId, setFirebaseEventId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventDetailsFormData>({
    resolver: zodResolver(eventDetailsSchema),
    defaultValues: {
      name: '',
      date: '',
      budget: '',
      description: '',
    },
  })

  // Reset state when component mounts (for creating a new event)
  useEffect(() => {
    // Reset to step 1 and clear any existing event from store
    // This ensures we start fresh when navigating to create page
    resetEvent()
    setCurrentStep(1)
    setSaveError(null)
    setSaveSuccess(false)
    setFirebaseEventId(null)
    setShareableLink('')
    setCopied(false)
    
    // Clear any saved draft to start fresh
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    
    // Reset form
    setValue('name', '')
    setValue('date', '')
    setValue('budget', '')
    setValue('description', '')
  }, [setValue, resetEvent])

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    const subscription = watch((formData) => {
      const draft = {
        step: currentStep,
        formData,
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    })
    return () => subscription.unsubscribe()
  }, [watch, currentStep])

  const onEventDetailsSubmit = async (data: EventDetailsFormData) => {
    // Generate a simple code if not provided (6 alphanumeric characters)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    // Create or update event in store
    if (!currentEvent) {
      if (!organizerId) {
        console.error('No organizer ID available. User must be logged in.')
        return
      }
      createEvent({
        name: data.name,
        code: generateCode(),
        date: data.date,
        budget: data.budget ? Number(data.budget) : undefined,
        description: data.description,
        organizerId: organizerId,
      })
    } else {
      updateEvent({
        name: data.name,
        date: data.date,
        budget: data.budget ? Number(data.budget) : undefined,
        description: data.description,
      })
    }
    // Skip participant step - create event immediately
    // Participants will join via code
    await handleFinalize()
  }

  const handleFinalize = async () => {
    if (!currentEvent) {
      // If no currentEvent, try to get form data directly
      const formData = watch()
      if (!formData.name || !formData.date) {
        setSaveError('Please fill in all required fields')
        return
      }
      
      // Create event in store first
      if (!organizerId) {
        setSaveError('You must be logged in to create an event')
        return
      }
      
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }
      
      createEvent({
        name: formData.name,
        code: generateCode(),
        date: formData.date,
        budget: formData.budget ? Number(formData.budget) : undefined,
        description: formData.description,
        organizerId: organizerId,
      })
      
      // Wait a moment for store to update
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!currentEvent) {
      setSaveError('Failed to create event. Please try again.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Ensure we have organizerId from auth context
      if (!organizerId) {
        throw new Error('You must be logged in to create an event')
      }

      // Generate event code
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      // Prepare event data for Firebase
      // Participants will join via code, so start with empty array
      const eventData: Omit<EventData, 'createdAt'> = {
        name: currentEvent.name,
        code: currentEvent.code || generateCode(),
        date: currentEvent.date,
        budget: currentEvent.budget,
        description: currentEvent.description,
        organizerId: organizerId,
        participants: [], // Participants will join via code
        exclusions: undefined, // Exclusions can be set later if needed
        status: 'active' as const,
      }

      // Save to Firebase
      const eventId = await createFirebaseEvent(eventData)
      setFirebaseEventId(eventId)

      // Get the event code (from eventData or fetch from Firebase)
      const eventCode = eventData.code || currentEvent.code || ''

      // Update local store with Firebase event ID
      updateEvent({
        id: eventId,
        code: eventCode,
        participants: [], // Participants will join via code
        exclusions: undefined,
        status: 'active',
      })

      // Generate shareable link using event code
      const link = `${window.location.origin}/event/${eventCode}`
      setShareableLink(link)

      // Copy link to clipboard automatically
      try {
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch (clipboardError) {
        console.warn('Failed to copy to clipboard:', clipboardError)
      }

      setSaveSuccess(true)
      
      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY)

      // Move to review/share step (step 2, since we removed participant step)
      setCurrentStep(2)

      // No auto-redirect - let user copy link/QR code and navigate manually
    } catch (error) {
      console.error('Error saving event to Firebase:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save event. Please try again.')
      setSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      currentStep >= step
                        ? 'bg-christmas-red-500 text-white shadow-christmas'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step ? '✓' : step}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-center text-gray-600">
                    {step === 1 && 'Event Details'}
                    {step === 2 && 'Share Code'}
                  </div>
                </div>
                {step < 2 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step ? 'bg-christmas-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
              🎄 Event Details
            </h1>
            <p className="text-gray-600 mb-8">
              Set up the basic information for your Secret Santa event
            </p>

            <form onSubmit={handleSubmit(onEventDetailsSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name <span className="text-christmas-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.name
                      ? 'border-christmas-red-500'
                      : 'border-gray-300 focus:border-christmas-red-500'
                  }`}
                  placeholder="e.g., Office Secret Santa 2024"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-christmas-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Gift Exchange Date <span className="text-christmas-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  {...register('date')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.date
                      ? 'border-christmas-red-500'
                      : 'border-gray-300 focus:border-christmas-green-500'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-christmas-red-600">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="budget"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Budget (optional)
                </label>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('budget')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.budget
                      ? 'border-christmas-red-500'
                      : 'border-gray-300 focus:border-christmas-gold-500'
                  }`}
                  placeholder="e.g., 25"
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-christmas-red-600">
                    {errors.budget.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  rows={4}
                  {...register('description')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-red-500 focus:outline-none transition-colors resize-none"
                  placeholder="Add any special instructions or rules..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Creating Event...</span>
                    </>
                  ) : (
                    'Create Event & Get Code →'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Review & Share (Participants join via code) */}
        {/* Only show step 2 if we have a successfully created event */}
        {currentStep === 2 && saveSuccess && (currentEvent || firebaseEventId) && (
          <div className="space-y-6">
            {/* Error Message */}
            {saveError && (
              <div className="bg-christmas-red-50 border-2 border-christmas-red-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-christmas-red-700 mb-1">Error Creating Event</h4>
                    <p className="text-sm text-christmas-red-600">{saveError}</p>
                  </div>
                  <button
                    onClick={() => setSaveError(null)}
                    className="text-christmas-red-600 hover:text-christmas-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
              <div className="bg-christmas-green-50 border-2 border-christmas-green-300 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-christmas-green-700 mb-1">Event Saved Successfully!</h4>
                    <p className="text-sm text-christmas-green-600">
                      Your event has been saved to Firebase. Link copied to clipboard! Copy the link or scan the QR code below to share with participants.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-christmas-gold-600 mb-4">
                🎉 Event Created!
              </h2>
              <p className="text-gray-600 mb-6">
                Your Secret Santa event is ready! Share the code or link below with participants. They'll join by entering the code at the join page.
              </p>

              {/* Event Summary */}
              <div className="bg-gradient-to-r from-christmas-red-50 to-christmas-green-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-christmas-red-600 mb-4">Event Summary</h3>
                <div className="space-y-2 text-gray-700">
                  {currentEvent?.code && (
                    <div>
                      <span className="font-semibold">Event Code:</span>{' '}
                      <span className="font-mono text-sm bg-white px-2 py-1 rounded font-bold text-christmas-red-600">
                        {currentEvent.code}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Name:</span> {currentEvent?.name || 'Event'}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span>{' '}
                    {currentEvent?.date && format(new Date(currentEvent.date), 'MMMM d, yyyy')}
                  </div>
                  {currentEvent?.budget && (
                    <div>
                      <span className="font-semibold">Budget:</span> ${currentEvent.budget}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Participants:</span> 0 (they'll join via code)
                  </div>
                </div>
              </div>

              {/* Event Code */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Code
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={currentEvent?.code || ''}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-christmas-red-300 rounded-xl bg-christmas-red-50 font-mono text-2xl font-bold text-center text-christmas-red-600"
                  />
                  <button
                    onClick={async () => {
                      if (currentEvent?.code) {
                        await navigator.clipboard.writeText(currentEvent.code)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }
                    }}
                    className="px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Share this code with participants. They can enter it at <strong>{window.location.origin}/join</strong>
                </p>
              </div>

              {/* Shareable Link */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Direct Link (Alternative)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-christmas-green-200">
                <h3 className="text-lg font-bold text-christmas-green-600 mb-4">
                  Scan to Join
                </h3>
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={shareableLink} size={200} />
                </div>
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Participants can scan this QR code to join your event, or enter code: <strong className="font-mono">{currentEvent?.code}</strong>
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                {currentEvent?.code && (
                  <>
                    <button
                      onClick={() => navigate(`/event/${currentEvent.code}/admin`)}
                      className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas"
                    >
                      🔒 Go to Admin Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
                    >
                      View All Events
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
