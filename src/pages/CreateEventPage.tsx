import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Snowflakes from '../components/Snowflakes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Calendar, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createEvent as createFirebaseEvent } from '../lib/firebase';
import type { EventData } from '../types';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { organizerId, organizerName, currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    budget: '',
    budgetCurrency: 'USD',
    description: '',
  });
  const [joinAsParticipant, setJoinAsParticipant] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      if (!organizerId) {
        throw new Error('You must be logged in to create an event');
      }
      
      // Prepare event data for Firebase (no code needed - Firestore will generate ID)
      const eventData: Omit<EventData, 'createdAt'> = {
        name: formData.name,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        budget: formData.budget ? Number(formData.budget) : undefined,
        budgetCurrency: formData.budgetCurrency || undefined,
        description: formData.description,
        organizerId: organizerId,
        participants: [],
        exclusions: undefined,
        status: 'active' as const,
      };

      // Save to Firebase (organizer will be added as participant if checkbox is checked)
      // Firestore will auto-generate the document ID
      const eventId = await createFirebaseEvent(
        eventData,
        joinAsParticipant ? (currentUser?.email || undefined) : undefined,
        joinAsParticipant ? (organizerName || currentUser?.displayName || undefined) : undefined
      );
      
      setCreatedEventId(eventId);
      setStep(2);
    } catch (error) {
      console.error('Error creating event:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowflakes />
      
      {/* Decorative elements */}
      <div className="absolute top-32 left-10 text-6xl opacity-20 animate-float">🎅</div>
      <div className="absolute top-60 right-10 text-5xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>🦌</div>
      <div className="absolute bottom-20 left-1/4 text-4xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>🔔</div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                step >= 1 
                  ? 'bg-gold text-christmas-red-deep shadow-gold' 
                  : 'bg-christmas-red-dark/50 text-snow-white/50'
              }`}>
                {step >= 2 ? '✓' : '1'}
              </div>
              <span className={`text-sm mt-2 ${step >= 1 ? 'text-gold' : 'text-snow-white/50'}`}>
                {step >= 2 ? 'Complete' : 'Event Details'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-3xl p-8 md:p-10 shadow-gold">
            {step === 1 ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🎄</span>
                  <div>
                    <h2 className="font-display text-3xl text-gradient-gold">
                      Event Details
                    </h2>
                    <p className="text-snow-white/70 text-sm">
                      Set up the basic information for your Secret Santa event
                    </p>
                  </div>
                </div>

                {saveError && (
                  <div className="mb-6 p-4 bg-christmas-red-900/50 border-2 border-christmas-red-700 rounded-xl">
                    <p className="text-sm text-snow-white">{saveError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-snow-white">
                      Event Name <span className="text-gold">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Office Secret Santa 2026"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-christmas-red-deep/50 border-gold/30 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:ring-gold/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-snow-white">
                      Gift Exchange Date <span className="text-gold">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="bg-christmas-red-900/50 border-gold/30 text-snow-white focus:border-gold focus:ring-gold/20 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold pointer-events-none z-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-snow-white">
                      Time <span className="text-gold">*</span>
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="bg-christmas-red-deep/50 border-gold/30 text-snow-white focus:border-gold focus:ring-gold/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue" className="text-snow-white">
                      Venue <span className="text-gold">*</span>
                    </Label>
                    <Input
                      id="venue"
                      type="text"
                      placeholder="e.g., Community Center, 123 Main St"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      required
                      className="bg-christmas-red-deep/50 border-gold/30 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:ring-gold/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-snow-white">
                      Budget <span className="text-snow-white/50">(optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <select
                        id="budgetCurrency"
                        value={formData.budgetCurrency}
                        onChange={(e) => setFormData({ ...formData, budgetCurrency: e.target.value })}
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
                      <Input
                        id="budget"
                        type="number"
                        placeholder="e.g., 25"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="flex-1 bg-christmas-red-deep/50 border-gold/30 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:ring-gold/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-snow-white">
                      Description <span className="text-snow-white/50">(optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Add any special instructions or rules..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="bg-christmas-red-900/50 border-gold/30 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:ring-gold/20 resize-none"
                    />
                  </div>

                  {/* Join as Participant Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-christmas-red-dark/30 border border-gold/20 rounded-xl">
                    <input
                      type="checkbox"
                      id="joinAsParticipant"
                      checked={joinAsParticipant}
                      onChange={(e) => setJoinAsParticipant(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gold/50 bg-christmas-red-deep/50 text-gold focus:ring-gold focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor="joinAsParticipant" className="text-snow-white cursor-pointer font-medium">
                        Join as a participant
                      </Label>
                      <p className="text-snow-white/60 text-sm mt-1">
                        You'll be included in the participant list and can receive a Secret Santa match
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    disabled={isSaving}
                    className="w-full shadow-gold-lg hover:scale-[1.02] transition-transform"
                  >
                    {isSaving ? (
                      'Creating Event...'
                    ) : (
                      'Create Event →'
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* Step 2: Success Message */
              <div className="text-center py-6">
                <div className="relative inline-block mb-6">
                  <Gift className="h-20 w-20 text-gold mx-auto animate-float" />
                </div>

                <h2 className="font-display text-3xl text-gradient-gold mb-2">
                  Event Created Successfully! 🎉
                </h2>
                <p className="text-snow-white/70 mb-8">
                  You have successfully created your event.
                </p>

                <div className="flex flex-col gap-3 justify-center max-w-sm mx-auto">
                  {createdEventId && (
                    <Button 
                      variant="hero"
                      onClick={() => navigate(`/event/${createdEventId}/admin`)}
                      className="shadow-gold w-full"
                    >
                      View Event
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                      onClick={() => {
                        setStep(1);
                        setFormData({ name: '', date: '', time: '', venue: '', budget: '', budgetCurrency: 'USD', description: '' });
                        setJoinAsParticipant(true);
                        setCreatedEventId(null);
                      }}
                    className="border-gold/40 text-gold hover:bg-gold/10"
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEventPage;
