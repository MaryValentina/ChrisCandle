import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Snowflakes from '../components/Snowflakes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Gift, Plus, Calendar, Users, Key, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDb, getEventByCode } from '../lib/firebase';
import { convertFirestoreEvent } from '../lib/firebase';
import { format } from 'date-fns';

const OrganizerDashboard = () => {
  const { organizerId } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  useEffect(() => {
    if (organizerId) {
      fetchEvents(organizerId);
    } else {
      setError('Please sign in to view your events');
      setIsLoading(false);
    }
  }, [organizerId]);

  const handleButtonClick = () => {
    if (!showInput) {
      setShowInput(true);
      setEventCode('');
      setIsValidCode(false);
    }
  };

  const validateEventCode = async (code: string) => {
    if (!code.trim() || code.trim().length < 3) {
      setIsValidCode(false);
      return;
    }

    setIsValidating(true);
    try {
      const normalizedCode = code.toUpperCase().trim();
      const event = await getEventByCode(normalizedCode);
      setIsValidCode(!!event);
    } catch (error) {
      console.error('Error validating code:', error);
      setIsValidCode(false);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (showInput && eventCode.trim()) {
      const timeoutId = setTimeout(() => {
        validateEventCode(eventCode);
      }, 500); // Debounce validation

      return () => clearTimeout(timeoutId);
    } else {
      setIsValidCode(false);
    }
  }, [eventCode, showInput]);

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (showInput && eventCode.trim()) {
      isSwiping.current = true;
      if ('touches' in e) {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
      } else {
        touchStartX.current = e.clientX;
        touchStartY.current = e.clientY;
      }
    }
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping.current || !showInput || !eventCode.trim()) return;

    let currentX: number;
    if ('touches' in e) {
      currentX = e.touches[0].clientX;
    } else {
      currentX = e.clientX;
    }

    const deltaX = currentX - touchStartX.current;
    const buttonWidth = buttonRef.current?.offsetWidth || 200;
    const progress = Math.min(Math.max((deltaX / buttonWidth) * 100, 0), 100);
    setSwipeProgress(progress);
  };

  const handleSwipeEnd = () => {
    if (isSwiping.current && swipeProgress >= 80 && eventCode.trim()) {
      // Swipe completed - navigate to event
      navigate(`/event/${eventCode.trim().toUpperCase()}`);
      setShowInput(false);
      setEventCode('');
      setSwipeProgress(0);
    } else {
      // Reset swipe progress
      setSwipeProgress(0);
    }
    isSwiping.current = false;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && eventCode.trim()) {
      navigate(`/event/${eventCode.trim().toUpperCase()}`);
      setShowInput(false);
      setEventCode('');
    }
  };

  const fetchEvents = async (orgId: string) => {
    try {
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
        fetchedEvents.push(event);
      });

      // Sort by createdAt in descending order (newest first)
      fetchedEvents.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order
      });

      setEvents(fetchedEvents);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-snow-white">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowflakes />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">🎄</div>
      <div className="absolute top-40 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎁</div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
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
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.code}/admin`}
                className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl p-6 hover:border-gold/40 transition-all hover:shadow-gold group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-xl text-gold">{event.name}</h3>
                  <span className="text-2xl group-hover:animate-float">🎁</span>
                </div>
                <div className="space-y-2 text-snow-white/70 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold/70" />
                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gold/70" />
                    <span>{event.participants.length} participants</span>
                  </div>
                  {event.budget && (
                    <div className="flex items-center gap-2">
                      <span>${event.budget} budget</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gold/20">
                    <span className="font-mono text-xs text-gold">Code: {event.code}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gold/20">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'active'
                      ? 'bg-green-500/20 text-green-300'
                      : event.status === 'drawn'
                      ? 'bg-christmas-red-500/20 text-christmas-red-300'
                      : event.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State - Two Boxes Side by Side */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* No Events Yet Box */}
            <div className="bg-christmas-red-dark/30 backdrop-blur-sm border border-gold/20 rounded-3xl p-12 text-center flex flex-col">
              <div className="relative inline-block mb-6">
                <Gift className="h-20 w-20 text-gold mx-auto animate-float" />
              </div>
              
              <h2 className="font-display text-3xl text-gold mb-3">
                No Events Yet
              </h2>
              <p className="text-snow-white/70 mb-8">
                Create your first Secret Santa event to spread the holiday cheer!
              </p>
              
              <div className="mt-auto">
                <Link to="/create-event">
                  <Button 
                    variant="hero" 
                    size="lg"
                    className="shadow-gold-lg hover:scale-105 transition-transform w-full"
                  >
                    Create Your First Event
                  </Button>
                </Link>
              </div>
            </div>

            {/* Access Your Event Box */}
            <div className="bg-christmas-red-dark/30 backdrop-blur-sm border border-gold/20 rounded-3xl p-12 text-center flex flex-col">
              <div className="relative inline-block mb-6">
                <Key className="h-20 w-20 text-gold mx-auto animate-float" />
              </div>
              
              <h2 className="font-display text-3xl text-gold mb-3">
                Access Your Event
              </h2>
              <p className="text-snow-white/70 mb-8">
                Enter your event code to access it
              </p>
              
              <div className="mt-auto space-y-3">
                <div className="relative overflow-hidden rounded-full">
                  {!showInput ? (
                    <button
                      onClick={handleButtonClick}
                      className="relative w-full h-14 bg-gradient-to-r from-gold to-gold-light text-christmas-red-900 font-body font-semibold rounded-full flex items-center justify-center transition-all duration-300 shadow-gold-lg hover:scale-105 cursor-pointer"
                    >
                      Access Event
                    </button>
                  ) : (
                    <>
                      {/* Input as button */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="enter your code"
                          value={eventCode}
                          onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                          onKeyPress={handleKeyPress}
                          className="w-full h-14 bg-transparent border-2 rounded-full text-center font-mono text-lg text-snow-white/40 placeholder:text-snow-white/30 focus:outline-none focus:border-gold/50 transition-all duration-300 pr-10"
                          style={{
                            borderImage: isValidCode 
                              ? 'conic-gradient(from 0deg, #f59e0b, #fbbf24, #f59e0b, #fbbf24, #f59e0b) 1'
                              : undefined,
                            borderColor: isValidCode ? 'transparent' : 'rgba(245, 158, 11, 0.3)',
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            setShowInput(false);
                            setEventCode('');
                            setIsValidCode(false);
                            setSwipeProgress(0);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-snow-white/60 hover:text-snow-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        {isValidating && (
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Button with special effects when code is valid */}
                      {isValidCode && (
                        <div className="relative w-full h-14 rounded-full p-[2px] overflow-hidden" style={{
                          background: 'conic-gradient(from 0deg, #f59e0b, #fbbf24, #f59e0b, #fbbf24, #f59e0b)',
                          animation: 'spin 3s linear infinite',
                        }}>
                          <button
                            ref={buttonRef}
                            onTouchStart={handleSwipeStart}
                            onTouchMove={handleSwipeMove}
                            onTouchEnd={handleSwipeEnd}
                            onMouseDown={handleSwipeStart}
                            onMouseMove={handleSwipeMove}
                            onMouseUp={handleSwipeEnd}
                            onMouseLeave={handleSwipeEnd}
                            onClick={() => {
                              if (eventCode.trim()) {
                                navigate(`/event/${eventCode.trim().toUpperCase()}`);
                              }
                            }}
                            className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 group bg-christmas-red-dark/90"
                          >
                            <span className="relative z-10 flex items-center gap-2 text-gold font-body font-semibold">
                              {swipeProgress < 80 ? (
                                <>
                                  Access Event
                                  <ArrowRight className="w-5 h-5 transition-transform" style={{ transform: `translateX(${swipeProgress * 0.3}px)` }} />
                                </>
                              ) : (
                                <>
                                  Release to Go!
                                  <ArrowRight className="w-5 h-5 animate-pulse" />
                                </>
                              )}
                            </span>
                            
                            {/* Glow bar on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
                            
                            {/* Swipe progress overlay */}
                            {swipeProgress > 0 && (
                              <div
                                className="absolute inset-0 bg-gradient-to-r from-christmas-red-500/80 to-christmas-red-600/80 transition-all duration-300 rounded-full"
                                style={{ width: `${swipeProgress}%` }}
                              />
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {showInput && isValidCode && swipeProgress > 0 && swipeProgress < 100 && (
                  <p className="text-xs text-snow-white/60 text-center">
                    {swipeProgress < 80
                      ? `Swipe right → (${Math.round(swipeProgress)}%)`
                      : 'Release to access event!'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrganizerDashboard;
