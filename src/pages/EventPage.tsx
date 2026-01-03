import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { nanoid } from 'nanoid'
import { useEventStore } from '../stores/eventStore'
import ParticipantCard from '../components/features/ParticipantCard'
import ParticipantForm from '../components/features/ParticipantForm'
import type { Participant } from '../types'

export default function EventPage() {
  const navigate = useNavigate()
  const {
    currentEvent,
    assignments,
    isLoading,
    error,
    canRunDraw,
    runDraw,
    addParticipant,
    removeParticipant,
    markParticipantReady,
    markParticipantNotReady,
    clearError,
  } = useEventStore()

  const [showAddForm, setShowAddForm] = useState(false)

  // Redirect if no event
  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            No Event Found
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have an active event. Create one to get started!
          </p>
          <button
            onClick={() => navigate('/create')}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Create Event
          </button>
        </div>
      </div>
    )
  }

  const handleRunDraw = () => {
    if (canRunDraw) {
      runDraw()
      // Navigate to results after a short delay
      setTimeout(() => {
        navigate('/results')
      }, 500)
    }
  }

  const handleAddParticipant = (participantData: Omit<Participant, 'id'>) => {
    const newParticipant: Participant = {
      ...participantData,
      id: nanoid(),
    }
    addParticipant(newParticipant)
    setShowAddForm(false)
  }

  const handleToggleReady = (participant: Participant) => {
    if (participant.isReady) {
      markParticipantNotReady(participant.id)
    } else {
      markParticipantReady(participant.id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-christmas-red-100 border-2 border-christmas-red-300 rounded-xl flex items-center justify-between">
            <p className="text-christmas-red-700 font-semibold">⚠️ {error}</p>
            <button
              onClick={clearError}
              className="text-christmas-red-700 hover:text-christmas-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Event Header */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🎁 {currentEvent.name}
          </h1>
          <p className="text-gray-600 mb-6">{currentEvent.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-christmas-red-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-red-600">
                {currentEvent.participants.length}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="p-4 bg-christmas-green-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-green-600">
                {format(new Date(currentEvent.date), 'MMM d')}
              </div>
              <div className="text-sm text-gray-600">Exchange Date</div>
            </div>
            {currentEvent.spendingLimit && (
              <div className="p-4 bg-christmas-gold-50 rounded-xl">
                <div className="text-2xl font-bold text-christmas-gold-600">
                  ${currentEvent.spendingLimit}
                </div>
                <div className="text-sm text-gray-600">Budget</div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                currentEvent.status === 'draft'
                  ? 'bg-gray-100 text-gray-700'
                  : currentEvent.status === 'open'
                  ? 'bg-christmas-green-100 text-christmas-green-700'
                  : currentEvent.status === 'assigned'
                  ? 'bg-christmas-red-100 text-christmas-red-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              Status: {currentEvent.status}
            </span>
          </div>
        </div>

        {/* Participants Section */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-christmas-green-600">
              Participants ({currentEvent.participants.length})
            </h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-christmas-green-500 text-white rounded-lg font-semibold hover:bg-christmas-green-600 transition-colors"
              >
                + Add Participant
              </button>
            )}
          </div>

          {/* Add Participant Form */}
          {showAddForm && (
            <div className="mb-6">
              <ParticipantForm
                onSubmit={handleAddParticipant}
                onCancel={() => setShowAddForm(false)}
                submitLabel="Add Participant"
              />
            </div>
          )}

          {/* Participants List */}
          {currentEvent.participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No participants yet. Add your first participant!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentEvent.participants.map((participant) => (
                <div key={participant.id} className="relative">
                  <ParticipantCard
                    participant={participant}
                    onDelete={removeParticipant}
                    showActions={true}
                  />
                  <button
                    onClick={() => handleToggleReady(participant)}
                    className={`mt-2 w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      participant.isReady
                        ? 'bg-christmas-green-100 text-christmas-green-700 hover:bg-christmas-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {participant.isReady ? '✓ Mark as Not Ready' : 'Mark as Ready'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ready Status Summary */}
          {currentEvent.participants.length > 0 && (
            <div className="p-4 bg-christmas-green-50 rounded-xl">
              <div className="text-sm font-semibold text-christmas-green-700 mb-1">
                Ready Status:
              </div>
              <div className="text-sm text-gray-600">
                {currentEvent.participants.filter((p) => p.isReady).length} of{' '}
                {currentEvent.participants.length} participants ready
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-gold-600 mb-4">Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {canRunDraw && !isLoading && (
              <button
                onClick={handleRunDraw}
                className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas"
              >
                🎁 Generate Assignments
              </button>
            )}
            {isLoading && (
              <div className="flex-1 px-6 py-3 bg-christmas-gold-500 text-white rounded-xl font-bold text-center">
                Generating assignments...
              </div>
            )}
            {!canRunDraw && !isLoading && currentEvent.participants.length >= 2 && (
              <div className="flex-1 px-6 py-3 bg-gray-300 text-gray-600 rounded-xl font-bold text-center">
                {currentEvent.participants.some((p) => !p.isReady)
                  ? 'All participants must be ready'
                  : 'Draw already completed'}
              </div>
            )}
            {!canRunDraw && !isLoading && currentEvent.participants.length < 2 && (
              <div className="flex-1 px-6 py-3 bg-gray-300 text-gray-600 rounded-xl font-bold text-center">
                Need at least 2 participants
              </div>
            )}
            {assignments.length > 0 && (
              <button
                onClick={() => navigate('/results')}
                className="flex-1 px-6 py-3 bg-christmas-gold-500 text-white rounded-xl font-bold hover:bg-christmas-gold-600 transition-colors shadow-christmas"
              >
                View Results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
