import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import QRCodeSVG from 'react-qr-code'
import { v4 as uuidv4 } from 'uuid'
import { useEventStore } from '../stores/eventStore'
import { useAuth } from '../contexts/AuthContext'
import { createEvent as createFirebaseEvent } from '../lib/firebase'
import ParticipantForm from '../components/features/ParticipantForm'
import ParticipantCard from '../components/features/ParticipantCard'
import type { Participant, EventData } from '../types'

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
  const { createEvent, updateEvent, addParticipant, removeParticipant, currentEvent } =
    useEventStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [exclusions, setExclusions] = useState<string[][]>([])
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

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.step) setCurrentStep(draft.step)
        if (draft.formData) {
          Object.entries(draft.formData).forEach(([key, value]) => {
            setValue(key as keyof EventDetailsFormData, value as string)
          })
        }
        if (draft.participants) setParticipants(draft.participants)
        if (draft.exclusions) setExclusions(draft.exclusions)
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [setValue])

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    const subscription = watch((formData) => {
      const draft = {
        step: currentStep,
        formData,
        participants,
        exclusions,
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    })
    return () => subscription.unsubscribe()
  }, [watch, currentStep, participants, exclusions])

  // Save participants and exclusions to draft
  useEffect(() => {
    const draft = {
      step: currentStep,
      formData: watch(),
      participants,
      exclusions,
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [participants, exclusions, currentStep, watch])

  const onEventDetailsSubmit = (data: EventDetailsFormData) => {
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
    setCurrentStep(2)
  }

  const handleAddParticipant = (participantData: Omit<Participant, 'id' | 'eventId' | 'joinedAt'>) => {
    const newParticipant: Participant = {
      ...participantData,
      id: uuidv4(),
      eventId: currentEvent?.id || '', // Will be updated when event is created
      joinedAt: new Date().toISOString(),
    }
    setParticipants([...participants, newParticipant])
    
    // Also add to store if event exists
    if (currentEvent) {
      addParticipant(newParticipant)
    }
  }

  // Sync participants with store when event is created
  useEffect(() => {
    if (currentEvent && participants.length > 0) {
      // Ensure all participants are in the store
      participants.forEach((p) => {
        if (!currentEvent.participants.find((ep) => ep.id === p.id)) {
          addParticipant(p)
        }
      })
    }
  }, [currentEvent, participants, addParticipant])

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
    if (currentEvent) {
      removeParticipant(id)
    }
    // Remove from exclusions
    setExclusions(exclusions.filter(([id1, id2]) => id1 !== id && id2 !== id))
  }

  const handleAddExclusion = (id1: string, id2: string) => {
    // Check if exclusion already exists
    const exists = exclusions.some(
      ([e1, e2]) => (e1 === id1 && e2 === id2) || (e1 === id2 && e2 === id1)
    )
    if (!exists && id1 !== id2) {
      setExclusions([...exclusions, [id1, id2]])
    }
  }

  const handleRemoveExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index))
  }

  const handleFinalize = async () => {
    if (!currentEvent) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Prepare event data for Firebase
      // Note: createEvent expects EventData without createdAt
      // The participants array should include all participant data (with IDs preserved for now)
      // We'll set eventId after event creation
      const now = new Date().toISOString()
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }
      const eventData: Omit<EventData, 'createdAt'> = {
        name: currentEvent.name,
        code: currentEvent.code || generateCode(),
        date: currentEvent.date,
        budget: currentEvent.budget,
        description: currentEvent.description,
        organizerId: currentEvent.organizerId,
        participants: participants.map(p => ({
          id: p.id,
          eventId: '', // Will be set after event creation
          name: p.name,
          email: p.email,
          wishlist: p.wishlist,
          isReady: p.isReady ?? false,
          joinedAt: p.joinedAt || now,
        })),
        exclusions: exclusions.length > 0 ? exclusions : undefined,
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
        participants,
        exclusions: exclusions.length > 0 ? exclusions : undefined,
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

      // Move to review step
      setCurrentStep(3)

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

  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || id
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
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
                    {step === 1 && 'Details'}
                    {step === 2 && 'Participants'}
                    {step === 3 && 'Review'}
                  </div>
                </div>
                {step < 3 && (
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
                  className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
                >
                  Next: Add Participants →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Add Participants */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-christmas-green-600 mb-4">
                👥 Add Participants
              </h2>
              <p className="text-gray-600 mb-6">
                Add participants to your Secret Santa event. Make sure everyone is ready before
                proceeding.
              </p>

              <ParticipantForm
                onSubmit={handleAddParticipant}
                submitLabel="Add Participant"
              />
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
                <h3 className="text-xl font-bold text-christmas-red-600 mb-4">
                  Participants ({participants.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {participants.map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      onDelete={handleRemoveParticipant}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Exclusion Pairs */}
            {participants.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
                <h3 className="text-xl font-bold text-christmas-gold-600 mb-4">
                  🚫 Exclusion Pairs (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select pairs who shouldn't be assigned to each other (e.g., partners, family
                  members)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {participants.map((p1) =>
                    participants
                      .filter((p2) => p1.id < p2.id)
                      .map((p2) => {
                        const isExcluded = exclusions.some(
                          ([id1, id2]) =>
                            (id1 === p1.id && id2 === p2.id) ||
                            (id1 === p2.id && id2 === p1.id)
                        )
                        return (
                          <button
                            key={`${p1.id}-${p2.id}`}
                            onClick={() =>
                              isExcluded
                                ? handleRemoveExclusion(
                                    exclusions.findIndex(
                                      ([id1, id2]) =>
                                        (id1 === p1.id && id2 === p2.id) ||
                                        (id1 === p2.id && id2 === p1.id)
                                    )
                                  )
                                : handleAddExclusion(p1.id, p2.id)
                            }
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isExcluded
                                ? 'bg-christmas-red-50 border-christmas-red-300'
                                : 'bg-gray-50 border-gray-200 hover:border-christmas-green-300'
                            }`}
                          >
                            <div className="text-sm font-semibold">
                              {p1.name} ↔ {p2.name}
                            </div>
                            {isExcluded && (
                              <div className="text-xs text-christmas-red-600 mt-1">Excluded</div>
                            )}
                          </button>
                        )
                      })
                  )}
                </div>

                {exclusions.length > 0 && (
                  <div className="mt-4 p-4 bg-christmas-red-50 rounded-xl">
                    <div className="text-sm font-semibold text-christmas-red-700 mb-2">
                      Current Exclusions:
                    </div>
                    <div className="space-y-1">
                      {exclusions.map(([id1, id2], index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm text-gray-700"
                        >
                          <span>
                            {getParticipantName(id1)} ↔ {getParticipantName(id2)}
                          </span>
                          <button
                            onClick={() => handleRemoveExclusion(index)}
                            className="text-christmas-red-600 hover:text-christmas-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="bg-christmas-red-50 border-2 border-christmas-red-300 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-christmas-red-700 mb-1">Error Saving Event</h4>
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

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                onClick={handleFinalize}
                disabled={participants.length < 2 || isSaving}
                className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Saving to Firebase...</span>
                  </>
                ) : (
                  'Review & Share →'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Share */}
        {currentStep === 3 && (currentEvent || firebaseEventId) && (
          <div className="space-y-6">
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
                Your Secret Santa event is ready. Share it with participants!
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
                    <span className="font-semibold">Participants:</span> {participants.length}
                  </div>
                  {exclusions.length > 0 && (
                    <div>
                      <span className="font-semibold">Exclusions:</span> {exclusions.length} pair(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Shareable Link */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
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
                  Participants can scan this QR code to join your event
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                {currentEvent?.code && (
                  <button
                    onClick={() => {
                      console.log('🔄 CreateEventPage: Navigating to event:', currentEvent.code)
                      navigate(`/event/${currentEvent.code}`)
                    }}
                    className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
                  >
                    Go to Event →
                  </button>
                )}
                <button
                  onClick={() => {
                    console.log('🔄 CreateEventPage: Navigating to home')
                    navigate('/')
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
