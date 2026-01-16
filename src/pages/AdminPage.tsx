import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getEvent, subscribeToEvent, updateEvent, deleteEvent, saveAssignments, getAssignments, updateParticipantWishlist } from '../lib/firebase'
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
import { Textarea } from '../components/ui/textarea'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
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
  ListChecks,
  Download,
  Send,
} from 'lucide-react'
import type { Event } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
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
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null)
  const [showShareMessageModal, setShowShareMessageModal] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [shareMessageCopied, setShareMessageCopied] = useState(false)
  const [showEditWishlistModal, setShowEditWishlistModal] = useState(false)
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null)
  const [wishlistText, setWishlistText] = useState('')
  const [isEditingWishlist, setIsEditingWishlist] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const isEditingRef = useRef(false)
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    budget: '',
    budgetCurrency: 'USD',
    description: '',
  })

  // Sync isEditing ref with state
  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  // Fetch event and set up real-time subscription
  useEffect(() => {
    if (!id) {
      setError('No event ID provided')
      setIsLoading(false)
      return
    }

    const fetchAndSubscribe = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initial fetch by ID
        const fetchedEvent = await getEvent(id)
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
            const updatedEvent = await getEvent(id)
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
            // Update edit form data if in edit mode (using ref to avoid dependency)
            if (isEditingRef.current) {
              setEditFormData({
                name: updatedEvent.name,
                date: typeof updatedEvent.date === 'string' ? updatedEvent.date : updatedEvent.date.toISOString().split('T')[0],
                time: updatedEvent.time || '',
                venue: updatedEvent.venue || '',
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
        unsubscribeRef.current = null
      }
    }
  }, [id])

  const handleRunDraw = async () => {
    if (!event) return

    // Prevent running draw if already drawn
    if (event.status === 'drawn' || event.status === 'completed') {
      setError('Draw has already been completed for this event.')
      return
    }

    setIsRunningDraw(true)
    setError(null)
    try {
      // Generate assignments (algorithm ensures consistency)
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
      const eventLink = `${window.location.origin}/event/${event.id}`
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
        participant_count: event.participants.length,
      })

      // Navigate to results
      navigate(`/results/${event.id}`)
    } catch (err) {
      console.error('Error running draw:', err)
      setError(err instanceof Error ? err.message : 'Failed to run draw')
    } finally {
      setIsRunningDraw(false)
    }
  }

  const canRunDraw = event
    ? event.participants.length >= 2 &&
      event.status !== 'drawn' &&
      event.status !== 'completed' &&
      event.status !== 'expired'
    : false

  const shareableLink = event ? `${window.location.origin}/event/${event.id}` : ''

  const formatTime = (timeString: string): string => {
    // Convert HH:mm format (e.g., "18:00") to 12-hour format (e.g., "6:00 PM")
    if (!timeString) return ''
    
    const [hours, minutes] = timeString.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    
    return `${displayHours}:${displayMinutes} ${period}`
  }

  const generateShareMessage = () => {
    if (!event) return ''
    
    const eventDate = typeof event.date === 'string' 
      ? event.date 
      : event.date.toISOString().split('T')[0]
    
    // Format date nicely
    const dateObj = new Date(eventDate + 'T00:00:00')
    const formattedDate = format(dateObj, 'MMMM d, yyyy')
    
    // Format time from HH:mm to 12-hour format
    const formattedTime = formatTime(event.time || '')
    
    return `Dear friends,

You are warmly invited to join our Secret Santa event:
🎄 Event: ${event.name}
📅 Date: ${formattedDate}
🕒 Time: ${formattedTime}
📍 Venue: ${event.venue}

Whoever wants to join, please click the link below and join:
${shareableLink}

Looking forward to celebrating together!`
  }

  const handleShareEvent = () => {
    if (!event) return
    
    const message = generateShareMessage()
    setShareMessage(message)
    setShowShareMessageModal(true)
    setShareMessageCopied(false)
    
    // Delay clipboard copy by 2 seconds to show the message first
    setTimeout(() => {
      navigator.clipboard.writeText(message).then(() => {
        setShareMessageCopied(true)
        setTimeout(() => setShareMessageCopied(false), 3000)
      }).catch((err) => {
        console.error('Failed to copy message:', err)
      })
    }, 2000)
  }

  const handleCopyShareMessage = async () => {
    if (!shareMessage) return
    try {
      await navigator.clipboard.writeText(shareMessage)
      setShareMessageCopied(true)
      setTimeout(() => setShareMessageCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy share message:', err)
    }
  }

  const handleEditWishlist = (participantId: string) => {
    if (!event) return
    const participant = event.participants.find(p => p.id === participantId)
    if (participant) {
      setEditingParticipantId(participantId)
      setWishlistText(participant.wishlist?.join('\n') || '')
      setShowEditWishlistModal(true)
    }
  }

  const handleSaveWishlist = async () => {
    if (!event || !editingParticipantId) return

    setIsEditingWishlist(true)
    try {
      // Split wishlist by newlines or commas
      const wishlistItems = wishlistText
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      await updateParticipantWishlist(event.id, editingParticipantId, wishlistItems)
      
      // Refresh event data
      const updatedEvent = await getEvent(event.id)
      if (updatedEvent) {
        setEvent(updatedEvent)
      }
      
      setShowEditWishlistModal(false)
      setEditingParticipantId(null)
      setWishlistText('')
      setError(null)
    } catch (err) {
      console.error('Error updating wishlist:', err)
      setError(err instanceof Error ? err.message : 'Failed to update wishlist')
    } finally {
      setIsEditingWishlist(false)
    }
  }

  const handleStartEdit = () => {
    if (!event) return
    setIsEditing(true)
    setEditFormData({
      name: event.name,
      date: typeof event.date === 'string' ? event.date : event.date.toISOString().split('T')[0],
      time: event.time || '',
      venue: event.venue || '',
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
      time: '',
      venue: '',
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
        time: editFormData.time,
        venue: editFormData.venue,
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

      const eventLink = `${window.location.origin}/event/${event.id}`
      const eventDateStr = typeof event.date === 'string' ? event.date : event.date.toISOString()
      
      // Format time from HH:mm to 12-hour format
      const formatTime = (timeString: string): string => {
        if (!timeString) return ''
        const [hours, minutes] = timeString.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, '0')
        return `${displayHours}:${displayMinutes} ${period}`
      }

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
          eventDate: eventDateStr,
          eventTime: formatTime(event.time || ''),
          eventVenue: event.venue || '',
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
    link.setAttribute('download', `participants_${event.id}_${new Date().toISOString().split('T')[0]}.csv`)
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
            onClick={() => navigate(`/event/${event.id}`)}
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
        return { color: 'text-gold', bg: 'bg-gold/20', label: 'Open for participants' }
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
      <div className="absolute top-20 left-4 md:left-10 text-3xl md:text-6xl opacity-20 animate-float">🔐</div>
      <div className="absolute top-40 right-4 md:right-20 text-2xl md:text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-4 md:left-20 text-2xl md:text-5xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎁</div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-16 relative z-10">
        {/* Back Button & Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/event/${event.id}`)}
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

        {/* Share Event Message Section - Moved to Top */}
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-6 md:p-8 mb-8 shadow-gold">
          <h2 className="font-display text-2xl md:text-3xl text-gradient-gold mb-3 text-center">
            🎁 Share this event with your friends!
          </h2>
          <p className="text-snow-white/70 mb-6 text-center text-sm md:text-base">
            Copy and share the invitation message to invite participants to your Secret Santa event.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleShareEvent}
              variant="hero"
              size="lg"
              className="w-full sm:w-auto shadow-gold hover:scale-105 transition-transform"
            >
              <Send className="mr-2 h-5 w-5" />
              Share Event
            </Button>
          </div>
        </div>

        {/* Event Details */}
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
                <div className="relative">
                  <input
                    id="editDate"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-christmas-red-deep/50 border-2 border-gold/30 rounded-xl focus:border-gold focus:outline-none transition-colors text-snow-white font-body pr-10"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label htmlFor="editTime" className="block text-sm font-semibold text-snow-white/80 mb-2 font-body">
                  Time <span className="text-gold">*</span>
                </label>
                <input
                  id="editTime"
                  type="time"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-christmas-red-deep/50 border-2 border-gold/30 rounded-xl focus:border-gold focus:outline-none transition-colors text-snow-white font-body"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editVenue" className="block text-sm font-semibold text-snow-white/80 mb-2 font-body">
                  Venue <span className="text-gold">*</span>
                </label>
                <input
                  id="editVenue"
                  type="text"
                  value={editFormData.venue}
                  onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
                  placeholder="e.g., Community Center, 123 Main St"
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
                    {/* Email hidden for privacy - organizer can use resend button if needed */}
                    <div className="text-xs text-snow-white/40 mt-1 font-body">
                      Email hidden for privacy
                    </div>
                    {participant.wishlist && participant.wishlist.length > 0 && (
                      <div className="text-xs text-gold mt-1 flex items-center gap-2 font-body">
                        <ListChecks className="h-3 w-3" />
                        {participant.wishlist.length} wishlist item(s)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit Wishlist button - only show if event hasn't been drawn */}
                    {event.status !== 'drawn' && event.status !== 'completed' && (
                      <button
                        onClick={() => handleEditWishlist(participant.id)}
                        className="p-2 text-gold hover:text-gold-light hover:bg-gold/10 rounded-lg transition-colors"
                        title="Edit wishlist"
                        aria-label={`Edit wishlist for ${participant.name}`}
                      >
                        <ListChecks className="h-4 w-4" />
                      </button>
                    )}
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
                    Run Draw
                  </>
                )}
              </Button>
            ) : (
              <div className="p-4 bg-christmas-red-dark/30 rounded-xl text-snow-white/60 text-center font-body border border-gold/20">
                {totalCount < 2
                  ? '⚠️ Need at least 2 participants to run draw'
                  : event.status === 'drawn'
                  ? '✅ Draw has already been completed'
                  : '🚫 Cannot run draw at this time'}
              </div>
            )}

            {event.status === 'drawn' && (
              <Button
                onClick={() => navigate(`/results/${event.id}`)}
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
                {/* For drawn/completed events, only show Delete Event */}
                {event.status === 'drawn' || event.status === 'completed' ? (
                  <div>
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeleting}
                      variant="outline"
                      className="w-full bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Delete Event
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Button
                        onClick={handleStartEdit}
                        disabled={isUpdating}
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
                        disabled={isDeleting}
                        variant="outline"
                        className="w-full bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="mr-2 h-5 w-5" />
                        Delete Event
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-destructive/20 border border-destructive/40 text-destructive rounded-xl font-body text-center">
            {error}
          </div>
        )}
      </main>

      {/* Share Message Modal */}
      {showShareMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-8">
          <div className="bg-christmas-red-dark/95 backdrop-blur-sm border-2 border-gold/40 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-gold-lg flex flex-col relative">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="font-display text-2xl text-gradient-gold flex items-center gap-2">
                <Send className="h-6 w-6" />
                Share Event Message
              </h3>
              <button
                onClick={() => {
                  setShowShareMessageModal(false)
                  setShareMessage('')
                  setShareMessageCopied(false)
                }}
                className="text-snow-white/70 hover:text-snow-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-snow-white/70 mb-4 text-sm flex-shrink-0">
              {shareMessageCopied 
                ? '✅ Message copied to clipboard! You can edit it below before sending:'
                : 'The message will be copied to your clipboard in a moment. You can edit it below before sending:'}
            </p>
            
            <div className="mb-4">
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={12}
                className="bg-christmas-red-deep/50 border-gold/30 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:ring-gold/20 resize-none font-body"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 pt-4 border-t border-gold/20">
              <Button
                onClick={handleCopyShareMessage}
                variant="outline"
                className="flex-1 bg-secondary/50 border-gold/30 text-gold hover:bg-gold/20 hover:border-gold/50"
              >
                {shareMessageCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Message Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Message
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowShareMessageModal(false)
                  setShareMessage('')
                  setShareMessageCopied(false)
                }}
                variant="hero"
                className="flex-1 shadow-gold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Wishlist Modal */}
      {showEditWishlistModal && editingParticipantId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-gold-lg max-w-md w-full">
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl text-gradient-gold mb-4">Edit Wishlist</h2>
              <p className="text-snow-white/70 mb-4 text-sm">
                Enter wishlist items, one per line or separated by commas.
              </p>
              
              <textarea
                value={wishlistText}
                onChange={(e) => setWishlistText(e.target.value)}
                placeholder="e.g., Books, Coffee, Art supplies"
                rows={6}
                className="w-full px-4 py-3 border-2 border-gold/30 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:outline-none transition-colors resize-none"
                disabled={isEditingWishlist}
              />
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowEditWishlistModal(false)
                    setEditingParticipantId(null)
                    setWishlistText('')
                  }}
                  variant="outline"
                  className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                  disabled={isEditingWishlist}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveWishlist}
                  disabled={isEditingWishlist}
                  variant="hero"
                  className="flex-1 shadow-gold"
                >
                  {isEditingWishlist ? 'Saving...' : 'Save Wishlist'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
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
