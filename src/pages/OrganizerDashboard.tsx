import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Snowflakes from '../components/Snowflakes';
import { Button } from '../components/ui/button';
import { Calendar, Users, Plus, Gift, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { convertFirestoreEvent } from '../lib/firebase';
import { format } from 'date-fns';

const OrganizerDashboard = () => {
  const { organizerId, loading: authLoading } = useAuth();
  // const navigate = useNavigate(); // Commented out - not used when empty state is disabled
  const [events, setEvents] = useState<Event[]>([]);
  const [isReady, setIsReady] = useState(false); // Single state: true only when fully loaded
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const fetchInProgressRef = useRef(false);
  // Commented out - empty state UI temporarily disabled
  // const [showInput, setShowInput] = useState(false);
  // const [eventCode, setEventCode] = useState('');
  // const [isValidCode, setIsValidCode] = useState(false);
  // const [isValidating, setIsValidating] = useState(false);
  // const [swipeProgress, setSwipeProgress] = useState(0);
  // const buttonRef = useRef<HTMLButtonElement>(null);
  // const touchStartX = useRef<number>(0);
  // const touchStartY = useRef<number>(0);
  // const isSwiping = useRef<boolean>(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking organizerId
    if (authLoading) {
      setIsReady(false);
      fetchInProgressRef.current = false;
      return;
    }
    
    // Only set error if auth is done and there's no organizerId
    // Don't set error prematurely while auth is loading
    if (!organizerId && !authLoading) {
      setEvents([]);
      setError('Please sign in to view your events');
      setIsReady(true);
      setHasFetchedOnce(true); // Mark as fetched so error state can show
      fetchInProgressRef.current = false;
      return;
    }
    
    // Prevent multiple simultaneous fetches
    if (fetchInProgressRef.current) {
      return;
    }
    
    // Fetch events for the organizer
    setError(null);
    setIsReady(false); // Set loading state
    fetchInProgressRef.current = true;
    fetchEvents(organizerId!);
  }, [organizerId, authLoading]);

  // Debug: Log when events state changes
  useEffect(() => {
    console.log('📊 Events state changed:', {
      count: events.length,
      isReady,
      eventIds: events.map(e => e.id),
      eventNames: events.map(e => e.name)
    });
  }, [events, isReady]);

  // Commented out - empty state UI handlers temporarily disabled
  // const handleButtonClick = () => {
  //   if (!showInput) {
  //     setShowInput(true);
  //     setEventCode('');
  //     setIsValidCode(false);
  //   }
  // };

  // const validateEventCode = async (code: string) => {
  //   if (!code.trim() || code.trim().length < 3) {
  //     setIsValidCode(false);
  //     return;
  //   }

  //   setIsValidating(true);
  //   try {
  //     const normalizedCode = code.toUpperCase().trim();
  //     const event = await getEventByCode(normalizedCode);
  //     setIsValidCode(!!event);
  //   } catch (error) {
  //     console.error('Error validating code:', error);
  //     setIsValidCode(false);
  //   } finally {
  //     setIsValidating(false);
  //   }
  // };

  // useEffect(() => {
  //   if (showInput && eventCode.trim()) {
  //     const timeoutId = setTimeout(() => {
  //       validateEventCode(eventCode);
  //     }, 500); // Debounce validation

  //     return () => clearTimeout(timeoutId);
  //   } else {
  //     setIsValidCode(false);
  //   }
  // }, [eventCode, showInput]);

  // const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
  //   if (showInput && eventCode.trim()) {
  //     isSwiping.current = true;
  //     if ('touches' in e) {
  //       touchStartX.current = e.touches[0].clientX;
  //       touchStartY.current = e.touches[0].clientY;
  //     } else {
  //       touchStartX.current = e.clientX;
  //       touchStartY.current = e.clientY;
  //     }
  //   }
  // };

  // const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
  //   if (!isSwiping.current || !showInput || !eventCode.trim()) return;

  //   let currentX: number;
  //   if ('touches' in e) {
  //     currentX = e.touches[0].clientX;
  //   } else {
  //     currentX = e.clientX;
  //   }

  //   const deltaX = currentX - touchStartX.current;
  //   const buttonWidth = buttonRef.current?.offsetWidth || 200;
  //   const progress = Math.min(Math.max((deltaX / buttonWidth) * 100, 0), 100);
  //   setSwipeProgress(progress);
  // };

  // const handleSwipeEnd = () => {
  //   if (isSwiping.current && swipeProgress >= 80 && eventCode.trim()) {
  //     navigate(`/event/${eventCode.trim().toUpperCase()}`);
  //     setShowInput(false);
  //     setEventCode('');
  //     setSwipeProgress(0);
  //   } else {
  //     setSwipeProgress(0);
  //   }
  //   isSwiping.current = false;
  // };

  // const handleKeyPress = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter' && eventCode.trim()) {
  //     navigate(`/event/${eventCode.trim().toUpperCase()}`);
  //     setShowInput(false);
  //     setEventCode('');
  //   }
  // };

  const fetchEvents = async (orgId: string) => {
    try {
      setError(null);
      console.log('🔄 Fetching events for organizer:', orgId);
      
      const db = getDb();
      if (!db) {
        throw new Error('Firebase is not configured');
      }

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('organizerId', '==', orgId)
      );
      const querySnapshot = await getDocs(q);

      const fetchedEvents: Event[] = [];
      querySnapshot.forEach((doc) => {
        const event = convertFirestoreEvent(doc.data(), doc.id);
        console.log('🔄 Converted event:', { id: event.id, name: event.name, participants: event.participants.length, status: event.status });
        fetchedEvents.push(event);
      });

      console.log(`✅ Fetched ${fetchedEvents.length} events`);

      // Sort by createdAt in descending order (newest first)
      fetchedEvents.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order
      });

      // Update both states together - React 18 batches these automatically
      // This ensures no intermediate render with empty events
      fetchInProgressRef.current = false;
      // Batch updates: set events and ready state together
      // React 18 will batch these in the same render cycle
      setEvents(fetchedEvents);
      setIsReady(true); // Only set ready AFTER events are set
      setHasFetchedOnce(true); // Mark that we've completed at least one fetch
      console.log('✅ Events state updated, isReady set to true');
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      fetchInProgressRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setIsReady(true); // Set ready even on error so we can show error state
      setHasFetchedOnce(true); // Mark that we've completed at least one fetch attempt
    }
  };

  // Show loading state: during auth loading OR before data fetch completes OR before first fetch
  // This prevents empty state from rendering during SSR/first hydration
  // Only show content when auth is done AND we're ready AND at least one fetch has completed
  if (authLoading || !isReady || !hasFetchedOnce) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <Navbar />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-snow-white">Loading your events...</p>
        </div>
      </div>
    );
  }

  // Only show error state after at least one fetch attempt has completed
  if (error && hasFetchedOnce) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-christmas-red-600 via-christmas-red-800 to-christmas-red-900 relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <Navbar />
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-8 text-center max-w-md relative z-10">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl text-gold mb-4">Error</h2>
          <p className="text-snow-white/70 mb-6">{error}</p>
          <Link to="/">
            <Button variant="hero" className="shadow-gold">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show empty state only AFTER fetch completes and events are truly empty
  if (events.length === 0 && hasFetchedOnce) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <Snowflakes />
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-12 text-center">
              <Gift className="h-24 w-24 text-gold mx-auto animate-float mb-6" />
              <h2 className="font-display text-3xl text-gradient-gold mb-3">
                No Events Yet
              </h2>
              <p className="text-snow-white/70 mb-8 text-lg">
                Create your first Secret Santa event to spread the holiday cheer!
              </p>
              <Link to="/create-event">
                <Button
                  variant="hero"
                  size="lg"
                  className="shadow-gold-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Event
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Otherwise show events grid
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowflakes />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">🎄</div>
      <div className="absolute top-40 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎁</div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Header with Create Button */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎄</span>
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-gradient-gold">
                My Events
              </h1>
              <p className="text-snow-white/70 mt-1">
                Manage your Secret Santa events and view participant activity
              </p>
            </div>
          </div>
          
          {/* Create New Event Button */}
          <Link to="/create-event">
            <Button 
              variant="hero" 
              size="lg"
              className="shadow-gold-lg hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/event/${event.code}/admin`}
              className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl p-6 hover:border-gold/40 hover:shadow-gold transition-all duration-300 group cursor-pointer flex flex-col"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display text-xl md:text-2xl text-gold group-hover:text-gold-light transition-colors flex-1 pr-2">
                  {event.name}
                </h3>
                <span className="text-2xl group-hover:animate-float flex-shrink-0">🎁</span>
              </div>

              {/* Event Details */}
              <div className="space-y-3 text-snow-white/80 text-sm mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gold flex-shrink-0" />
                  <span className="font-medium">{format(new Date(event.date), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gold flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-gold">{event.participants.length}</span>
                    {' '}participant{event.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {event.budget && (
                  <div className="flex items-center gap-2">
                    <span className="text-gold">💰</span>
                    <span>Budget: <span className="font-semibold">${event.budget}</span></span>
                  </div>
                )}
                
                {/* Event Code */}
                <div className="pt-3 border-t border-gold/20 mt-3">
                  <div className="flex items-center gap-2">
                    <Copy className="h-3 w-3 text-gold/70 flex-shrink-0" />
                    <span className="font-mono text-xs text-gold/90">Code: {event.code}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-auto pt-4 border-t border-gold/20">
                <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full ${
                  event.status === 'active'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : event.status === 'drawn'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : event.status === 'completed'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
