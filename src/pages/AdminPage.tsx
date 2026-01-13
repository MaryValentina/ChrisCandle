import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getEventByCode, subscribeToEvent, updateEvent, deleteEvent, saveAssignments, getAssignments } from '../lib/firebase'
import { useEventStore } from '../stores/eventStore'
import { useAuth } from '../contexts/AuthContext'
import { generateAssignments } from '../lib/shuffle'
import { sendDrawEmail, sendWelcomeEmail } from '../lib/email'
import { triggerDrawConfetti } from '../lib/confetti'
import { trackEvent, AnalyticsEvents } from '../lib/analytics'
import { checkAndExpireEvent } from '../lib/eventExpiry'
import Navbar from '../components/Navbar'
import Snowflakes from '../components/Snowflakes'
import { Button } from '../components/ui/button'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Link as LinkIcon, 
  Users, 
  CheckCircle, 
  Activity,
  Calendar,
  DollarSign,
  Shuffle,
  Eye,
  Settings,
  X,
  Gift,
  Sparkles,
  Mail,
  ListChecks,
  Download,
  Send,
} from 'lucide-react'
import type { Event } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const { runDraw: runDrawInStore } = useEventStore()
  const { organizerId } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRunningDraw, setIsRunningDraw] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    date: '',
    budget: '',
    budgetCurrency: 'USD',
    description: '',
  })

  // Fetch event and set up real-time subscription
  useEffect(() => {
    if (!code) {
      setError('No event code provided')
      setIsLoading(false)
      return
    }

    const fetchAndSubscribe = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initial fetch
        const fetchedEvent = await getEventByCode(code)
        if (!fetchedEvent) {
          setError('Event not found')
          setIsLoading(false)
          return
        }

        // Check and expire event if needed (if date passed > 7 days)
        try {
          const wasExpired = await checkAndExpireEvent(fetchedEvent)
          if (wasExpired) {
            // Refetch to get updated status
            const updatedEvent = await getEventByCode(code)
            if (updatedEvent) {
              setEvent(updatedEvent)
            } else {
              setEvent(fetchedEvent)
            }
          } else {
            setEvent(fetchedEvent)
          }
        } catch (expiryError) {
          // Don't fail the page load if expiry check fails
          console.warn('Error checking event expiry:', expiryError)
          setEvent(fetchedEvent)
        }

        // Set up real-time subscription
        unsubscribeRef.current = subscribeToEvent(fetchedEvent.id, (updatedEvent, err) => {
          if (err) {
            console.error('Real-time subscription error:', err)
            return
          }
          if (updatedEvent) {
            setEvent(updatedEvent)
            // Update edit form data if in edit mode
            if (isEditing) {
              setEditFormData({
                name: updatedEvent.name,
                date: typeof updatedEvent.date === 'string' ? updatedEvent.date : updatedEvent.date.toISOString().split('T')[0],
                budget: updatedEvent.budget?.toString() || '',
                budgetCurrency: updatedEvent.budgetCurrency || 'USD',
                description: updatedEvent.description || '',
              })
            }
          }
        })

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching event:', err)
        setError(err instanceof Error ? err.message : 'Failed to load event')
        setIsLoading(false)
      }
    }

    fetchAndSubscribe()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [code, isEditing])

  const handleRunDraw = async () => {
    if (!event) return

    setIsRunningDraw(true)
    try {
      // Generate assignments
      const assignmentMap = generateAssignments(event.participants, event.exclusions)

      // Convert to Assignment array
      const assignments = Array.from(assignmentMap.entries()).map(([giverId, receiverId]) => ({
        eventId: event.id,
        giverId,
        receiverId,
        createdAt: new Date().toISOString(),
        revealedAt: null,
      }))

      // Save to Firebase
      await saveAssignments(event.id, assignments)
      await updateEvent(event.id, { status: 'drawn' })

      // Send draw completion emails to all participants
      const eventLink = `${window.location.origin}/event/${event.code}`
      const emailPromises = assignments.map(async (assignment) => {
        const giver = event.participants.find((p) => p.id === assignment.giverId)
        const receiver = event.participants.find((p) => p.id === assignment.receiverId)

        if (giver && receiver && giver.email) {
          try {
            const eventDateStr = typeof event.date === 'string' ? event.date : event.date.toISOString()
            await sendDrawEmail({
              participantEmail: giver.email,
              participantName: giver.name,
              receiverName: receiver.name,
              receiverWishlist: receiver.wishlist,
              eventName: event.name,
              eventDate: eventDateStr,
              eventLink,
            })
          } catch (emailError) {
            // Don't fail the draw if email fails
            console.warn(`Failed to send draw email to ${giver.email}:`, emailError)
          }
        }
      })

      // Wait for all emails to be sent (or fail silently)
      await Promise.allSettled(emailPromises)

      // Update local store
      await runDrawInStore()

      // Trigger confetti celebration
      triggerDrawConfetti()

      // Track analytics
      trackEvent(AnalyticsEvents.DRAW_COMPLETED, {
        event_id: event.id,
        event_code: event.code,
        participant_count: event.participants.length,
      })

      // Navigate to results
      navigate(`/results/${event.code}`)
    } catch (err) {
      console.error('Error running draw:', err)
      setError(err instanceof Error ? err.message : 'Failed to run draw')
    } finally {
      setIsRunningDraw(false)
    }
  }

  const canRunDraw = event
    ? event.participants.length >= 2 &&
      event.participants.every((p) => p.isReady) &&
      event.status !== 'drawn' &&
      event.status !== 'completed' &&
      event.status !== 'expired'
    : false

  const shareableLink = event ? `${window.location.origin}/event/${event.code}` : ''

  const handleCopyCode = async () => {
    if (!event) return
    try {
      await navigator.clipboard.writeText(event.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareableLink) return
    try {
      await navigator.clipboard.writeText(shareableLink)
      setShareLinkCopied(true)
      setTimeout(() => setShareLinkCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy share link:', err)
    }
  }

  const handleStartEdit = () => {
    if (!event) return
    setIsEditing(true)
    setEditFormData({
      name: event.name,
      date: typeof event.date === 'string' ? event.date : event.date.toISOString().split('T')[0],
      budget: event.budget?.toString() || '',
      budgetCurrency: event.budgetCurrency || 'USD',
      description: event.description || '',
    })
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData({
      name: '',
      date: '',
      budget: '',
      budgetCurrency: 'USD',
      description: '',
    })
    setError(null)
  }

  const handleSaveEdit = async () => {
    if (!event) return

    setIsUpdating(true)
    try {
      const updates: any = {
        name: editFormData.name,
        date: editFormData.date,
      }

      if (editFormData.budget) {
        updates.budget = Number(editFormData.budget)
        updates.budgetCurrency = editFormData.budgetCurrency
      } else {
        updates.budget = undefined
        updates.budgetCurrency = undefined
      }

      if (editFormData.description) {
        updates.description = editFormData.description
      } else {
        updates.description = undefined
      }

      await updateEvent(event.id, updates)
      setIsEditing(false)
      setError(null)
      
      trackEvent(AnalyticsEvents.EVENT_SETTINGS_UPDATED, {
        event_id: event.id,
        action: 'edit_event',
      })
    } catch (err) {
      console.error('Error saving event:', err)
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!event) return

    setIsDeleting(true)
    try {
      await deleteEvent(event.id)
      setShowDeleteModal(false)
      trackEvent(AnalyticsEvents.EVENT_SETTINGS_UPDATED, {
        event_id: event.id,
        action: 'delete_event',
      })
      // Navigate to organizer dashboard after deletion
      navigate('/my-events')
    } catch (err) {
      console.error('Error deleting event:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResendEmail = async (participantId: string) => {
    if (!event) return

    setIsResendingEmail(participantId)
    try {
      const participant = event.participants.find((p) => p.id === participantId)
      if (!participant || !participant.email) {
        setError('Participant email not found')
        return
      }

      const eventLink = `${window.location.origin}/event/${event.code}`
      const eventDateStr = typeof event.date === 'string' ? event.date : event.date.toISOString()

      // Check if draw has been completed
      if (event.status === 'drawn') {
        // Resend draw email
        const assignments = await getAssignments(event.id)
        const assignment = assignments.find((a) => a.giverId === participantId)
        if (assignment) {
          const receiver = event.participants.find((p) => p.id === assignment.receiverId)
          if (receiver) {
            await sendDrawEmail({
              participantEmail: participant.email,
              participantName: participant.name,
              receiverName: receiver.name,
              receiverWishlist: receiver.wishlist,
              eventName: event.name,
              eventDate: eventDateStr,
              eventLink,
            })
            trackEvent(AnalyticsEvents.EMAIL_RESENT, {
              event_id: event.id,
              email_type: 'draw',
              participant_id: participantId,
            })
          }
        }
      } else {
        // Resend welcome email
        await sendWelcomeEmail({
          participantEmail: participant.email,
          participantName: participant.name,
          eventName: event.name,
          eventCode: event.code,
          eventDate: eventDateStr,
          eventLink,
        })
        trackEvent(AnalyticsEvents.EMAIL_RESENT, {
          event_id: event.id,
          email_type: 'welcome',
          participant_id: participantId,
        })
      }
    } catch (err) {
      console.error('Error resending email:', err)
      setError(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setIsResendingEmail(null)
    }
  }

  const handleExportCSV = () => {
    if (!event) return

    // Create CSV content
    const headers = ['Name', 'Email', 'Wishlist', 'Ready', 'Joined At']
    const rows = event.participants.map((p) => [
      p.name,
      p.email || '',
      p.wishlist?.join('; ') || '',
      p.isReady ? 'Yes' : 'No',
      new Date(p.joinedAt).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `participants_${event.code}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    trackEvent(AnalyticsEvents.CSV_EXPORTED, {
      event_id: event.id,
      participant_count: event.participants.length,
    })
  }


  const readyCount = event?.participants.filter((p) => p.isReady).length || 0
  const totalCount = event?.participants.length || 0
  const readyPercentage = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <div className="text-center relative z-10">
          <div className="relative inline-block mb-6">
            <Gift className="h-16 w-16 text-gold mx-auto animate-float" />
            <Sparkles className="h-6 w-6 text-gold absolute -top-2 -right-2 animate-pulse-glow" />
          </div>
          <p className="text-snow-white/70 font-body">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <div className="bg-card/60 backdrop-blur-sm border border-gold/20 rounded-3xl p-8 text-center max-w-md relative z-10">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl text-gold mb-4">
            {error || 'Event Not Found'}
          </h2>
          <p className="text-snow-white/70 mb-6">
            {error || "The event you're looking for doesn't exist."}
          </p>
          <Button
            variant="hero"
            onClick={() => navigate('/')}
            className="shadow-gold"
          >
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  // Check if user is organizer (already checked in ProtectedRoute, but double-check here)
  if (!organizerId || !event || event.organizerId !== organizerId) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <div className="bg-card/60 backdrop-blur-sm border border-gold/20 rounded-3xl p-8 text-center max-w-md relative z-10">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display text-2xl text-gold mb-4">Access Denied</h2>
          <p className="text-snow-white/70 mb-6">
            You must be the event organizer to access this page.
          </p>
          <Button
            variant="hero"
            onClick={() => navigate(`/event/${code}`)}
            className="shadow-gold"
          >
            View Public Event
          </Button>
        </div>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Open for participants' }
      case 'drawn':
        return { color: 'text-gold', bg: 'bg-gold/20', label: 'Assignments generated' }
      case 'completed':
        return { color: 'text-snow-white', bg: 'bg-snow-white/20', label: 'Event finished' }
      case 'expired':
        return { color: 'text-destructive', bg: 'bg-destructive/20', label: 'Event cancelled' }
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted/20', label: 'Unknown' }
    }
  }

  const statusConfig = getStatusConfig(event.status)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowflakes />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">🔐</div>
      <div className="absolute top-40 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎁</div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-16 relative z-10">
        {/* Back Button & Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/event/${code}`)}
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors mb-4 font-body"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔒</span>
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-gradient-gold">
                Admin Dashboard
              </h1>
              <p className="text-snow-white/70 mt-1">
                Manage your Secret Santa event
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl p-6 hover:border-gold/40 transition-all shadow-gold">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold/20 rounded-lg">
                <Users className="h-5 w-5 text-gold" />
              </div>
              <span className="text-sm text-snow-white/60 font-body">Participants</span>
            </div>
            <div className="text-4xl font-display text-gold">{totalCount}</div>
            <p className="text-xs text-snow-white/50 mt-1 font-body">Real-time count</p>
          </div>

          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl p-6 hover:border-gold/40 transition-all shadow-gold">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-gold" />
              </div>
              <span className="text-sm text-snow-white/60 font-body">Ready</span>
            </div>
            <div className="text-4xl font-display text-gold">{readyCount}</div>
            <p className="text-xs text-snow-white/50 mt-1 font-body">{readyPercentage}% ready</p>
          </div>

          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl p-6 hover:border-gold/40 transition-all shadow-gold">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold/20 rounded-lg">
                <Activity className="h-5 w-5 text-gold" />
              </div>
              <span className="text-sm text-snow-white/60 font-body">Status</span>
            </div>
            <div className={`text-2xl font-display capitalize ${statusConfig.color}`}>
              {event.status}
            </div>
            <p className="text-xs text-snow-white/50 mt-1 font-body">{statusConfig.label}</p>
          </div>
        </div>

        {/* Event Details & Share */}
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-6 md:p-8 mb-8 shadow-gold">
          <h2 className="font-display text-2xl text-gold mb-6 flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Event Details
          </h2>
          
          {isEditing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="editName" className="block text-sm font-semibold text-snow-white/80 mb-2 font-body">
                  Event Name <span className="text-gold">*</span>
                </label>
                <input
                  id="editName"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-christmas-red-deep/50 border-2 border-gold/30 rounded-xl focus:border-gold focus:outline-none transition-colors text-snow-white font-body"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editDate" className="block text-sm font-semibold text-snow-white/80 mb-2 font-body">
                  Gift Exchange Date <span className="text-gold">*</span>
                </label>
                <input
                  id="editDate"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-christmas-red-deep/50 border-2 border-gold/30 rounded-xl focus:border-gold focus:outline-none transition-colors text-snow-white font-body"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editBudget" className="block text-sm font-semibold text-snow-white/80 mb-2 font-body">
                  Budget <span className="text-snow-white/50">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    id="editBudgetCurrency"
                    value={editFormData.budgetCurrency}
                    onChange={(e) => setEditFormData({ ...editFormData, budgetCurrency: e.target.value })}
                    className="bg-christmas-red-deep/50 border border-gold/30 text-snow-white rounded-lg px-3 py-2 focus:border-gold focus:ring-gold/20 focus:outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="LKR">LKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                    <option value="JPY">JPY</option>
                    <option value="INR">INR</option>
                  </select>
                  <input
                    id="editBudget"
                    type="number"
                    value={editFormData.budget}
                    onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                    placeholder="e.g., 25"
                    className="flex-1 px-4 py-3 bg-christmas-red-deep/50 border-2 border-gold/30 rounded-xl focus:border-gold focus:outline-none transition-colors text-snow-white font-body"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="editDescription" className="block text-sm font-semibold text-snow-white/80 mb-2 font-body">
                  Description <span className="text-snow-white/50">(optional)</span>
                </label>
                <textarea
                  id="editDescription"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-christmas-red-deep/50 border-2 border-gold/30 rounded-xl focus:border-gold focus:outline-none transition-colors text-snow-white font-body resize-none"
                  placeholder="Add any special instructions or rules..."
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-snow-white/80">
                <Sparkles className="h-4 w-4 text-gold/70" />
                <span className="text-snow-white/60">Name:</span>
                <span className="font-medium">{event.name}</span>
              </div>
              <div className="flex items-center gap-3 text-snow-white/80">
                <span className="text-2xl">🎫</span>
                <span className="text-snow-white/60">Code:</span>
                <span className="font-mono font-bold text-gold">{event.code}</span>
              </div>
              <div className="flex items-center gap-3 text-snow-white/80">
                <Calendar className="h-4 w-4 text-gold/70" />
                <span className="text-snow-white/60">Date:</span>
                <span>{(() => {
                  // Handle YYYY-MM-DD format strings correctly
                  if (typeof event.date === 'string' && event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = event.date.split('-').map(Number)
                    const date = new Date(year, month - 1, day)
                    return format(date, 'MMMM d, yyyy')
                  }
                  return format(new Date(event.date), 'MMMM d, yyyy')
                })()}</span>
              </div>
              {event.budget && (
                <div className="flex items-center gap-3 text-snow-white/80">
                  <DollarSign className="h-4 w-4 text-gold/70" />
                  <span className="text-snow-white/60">Budget:</span>
                  <span>{event.budgetCurrency || 'USD'} {event.budget}</span>
                </div>
              )}
            </div>
          )}

          {/* Share Section */}
          <div className="border-t border-gold/20 pt-6">
            <h3 className="font-display text-lg text-gold mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Share Event
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="flex-1 bg-secondary/50 border-gold/30 text-gold hover:bg-gold/20 hover:border-gold/50"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Code Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Event Code
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleCopyShareLink}
                variant="outline"
                className="flex-1 bg-secondary/50 border-gold/30 text-gold hover:bg-gold/20 hover:border-gold/50"
              >
                {shareLinkCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy Share Link
                  </>
                )}
              </Button>
            </div>

            {shareableLink && (
              <div className="bg-christmas-red-dark/30 rounded-xl p-4 border border-gold/10">
                <div className="text-xs text-snow-white/50 mb-2 font-body">Shareable Link:</div>
                <div className="text-sm font-mono text-gold break-all">{shareableLink}</div>
              </div>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-6 md:p-8 mb-8 shadow-gold">
          <h2 className="font-display text-2xl text-gold mb-6 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Participants ({totalCount})
          </h2>
          
            {totalCount === 0 ? (
            <p className="text-snow-white/60 text-center py-8 font-body">No participants yet.</p>
          ) : (
            <div className="space-y-3">
              {event.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 bg-christmas-red-dark/30 rounded-xl hover:bg-christmas-red-dark/50 transition-colors border border-gold/10 hover:border-gold/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-snow-white font-body">{participant.name}</div>
                      {participant.isOrganizer && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-christmas-gold-100 to-christmas-gold-200 text-christmas-gold-800 rounded-full text-xs font-semibold border border-christmas-gold-400">
                          <span className="text-xs">👑</span>
                          Organizer
                        </span>
                      )}
                    </div>
                    {participant.email ? (
                      <div className="text-sm text-snow-white/60 mt-1 flex items-center gap-2 font-body">
                        <Mail className="h-3 w-3" />
                        {participant.email}
                      </div>
                    ) : (
                      <div className="text-xs text-snow-white/40 mt-1 font-body">No email provided</div>
                    )}
                    {participant.wishlist && participant.wishlist.length > 0 && (
                      <div className="text-xs text-gold mt-1 flex items-center gap-2 font-body">
                        <ListChecks className="h-3 w-3" />
                        {participant.wishlist.length} wishlist item(s)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold font-body flex items-center gap-1 ${
                        participant.isReady
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-christmas-red-dark/50 text-snow-white/60 border border-gold/20'
                      }`}
                    >
                      {participant.isReady ? (
                        <>
                          <Check className="h-3 w-3" />
                          Ready
                        </>
                      ) : (
                        'Not Ready'
                      )}
                    </div>
                    {participant.email && (
                      <button
                        onClick={() => handleResendEmail(participant.id)}
                        disabled={isResendingEmail === participant.id}
                        className="p-2 text-gold hover:text-gold-light hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Resend email"
                        aria-label={`Resend email to ${participant.name}`}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Export CSV Button */}
          {totalCount > 0 && (
            <div className="mt-6 pt-6 border-t border-gold/20">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="w-full bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Participants (CSV)
              </Button>
            </div>
          )}
        </div>

        {/* Draw Actions */}
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-6 md:p-8 mb-8 shadow-gold">
          <h2 className="font-display text-2xl text-gold mb-6 flex items-center gap-2">
            <Shuffle className="h-6 w-6" />
            Draw Actions
          </h2>
          
          <div className="space-y-4">
            {canRunDraw ? (
              <Button
                onClick={handleRunDraw}
                disabled={isRunningDraw}
                variant="hero"
                size="lg"
                className="w-full shadow-gold-lg hover:scale-[1.02] transition-transform"
              >
                {isRunningDraw ? (
                  <>
                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    Running Draw...
                  </>
                ) : (
                  <>
                    <Shuffle className="mr-2 h-5 w-5" />
                    🎲 Start Draw
                  </>
                )}
              </Button>
            ) : (
              <div className="p-4 bg-christmas-red-dark/30 rounded-xl text-snow-white/60 text-center font-body border border-gold/20">
                {totalCount < 2
                  ? '⚠️ Need at least 2 participants to run draw'
                  : !event.participants.every((p) => p.isReady)
                  ? '⏳ All participants must be ready'
                  : event.status === 'drawn'
                  ? '✅ Draw has already been completed'
                  : '🚫 Cannot run draw at this time'}
              </div>
            )}

            {event.status === 'drawn' && (
              <Button
                onClick={() => navigate(`/results/${code}`)}
                variant="outline"
                size="lg"
                className="w-full bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
              >
                <Eye className="mr-2 h-5 w-5" />
                View Results
              </Button>
            )}
          </div>
        </div>

        {/* Event Settings */}
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-6 md:p-8 shadow-gold">
          <h2 className="font-display text-2xl text-gold mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Event Settings
          </h2>
          
          <div className="space-y-4">
            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  variant="outline"
                  className="flex-1 bg-christmas-red-dark/30 border-gold/30 text-snow-white hover:bg-christmas-red-dark/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editFormData.name || !editFormData.date}
                  variant="hero"
                  className="flex-1 shadow-gold"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Button
                    onClick={handleStartEdit}
                    disabled={isUpdating || event.status === 'drawn' || event.status === 'completed'}
                    variant="outline"
                    className="w-full bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Edit Event
                  </Button>
                </div>

                <div>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isDeleting || event.status === 'drawn' || event.status === 'completed'}
                    variant="outline"
                    className="w-full bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="mr-2 h-5 w-5" />
                    Delete Event
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-destructive/20 border border-destructive/40 text-destructive rounded-xl font-body">
            {error}
          </div>
        )}
      </main>

      {/* Delete Event Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-destructive/30 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-gold-lg">
            <h3 className="font-display text-2xl text-destructive mb-4 flex items-center gap-2">
              <X className="h-6 w-6" />
              Delete Event
            </h3>
            <p className="text-snow-white/70 mb-6 font-body">
              Are you sure you want to permanently delete this event? This action cannot be undone. 
              All event data, participants, and assignments will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                variant="outline"
                className="flex-1 bg-christmas-red-dark/30 border-gold/30 text-snow-white hover:bg-christmas-red-dark/50"
              >
                Keep Event
              </Button>
              <Button
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                variant="destructive"
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
