import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Snowflakes from '../components/Snowflakes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Calendar, Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createEvent as createFirebaseEvent } from '../lib/firebase';
import type { EventData } from '../types';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { organizerId } = useAuth();
  const [step, setStep] = useState(1);
  const [eventCode, setEventCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    budget: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      if (!organizerId) {
        throw new Error('You must be logged in to create an event');
      }

      // Generate event code
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const code = generateCode();
      
      // Prepare event data for Firebase
      const eventData: Omit<EventData, 'createdAt'> = {
        name: formData.name,
        code: code,
        date: formData.date,
        budget: formData.budget ? Number(formData.budget) : undefined,
        description: formData.description,
        organizerId: organizerId,
        participants: [],
        exclusions: undefined,
        status: 'active' as const,
      };

      // Save to Firebase
      await createFirebaseEvent(eventData);
      
      setEventCode(code);
      setStep(2);
    } catch (error) {
      console.error('Error creating event:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                1
              </div>
              <span className={`text-sm mt-2 ${step >= 1 ? 'text-gold' : 'text-snow-white/50'}`}>
                Event Details
              </span>
            </div>
            
            <div className={`h-1 w-24 md:w-32 rounded-full transition-all ${
              step >= 2 ? 'bg-gold' : 'bg-christmas-red-dark/50'
            }`} />
            
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                step >= 2 
                  ? 'bg-gold text-christmas-red-deep shadow-gold' 
                  : 'bg-christmas-red-dark/50 text-snow-white/50'
              }`}>
                2
              </div>
              <span className={`text-sm mt-2 ${step >= 2 ? 'text-gold' : 'text-snow-white/50'}`}>
                Share Code
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
                        className="bg-christmas-red-900/50 border-gold/30 text-snow-white focus:border-gold focus:ring-gold/20"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-snow-white">
                      Budget <span className="text-snow-white/50">(optional)</span>
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="e.g., 25"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="bg-christmas-red-deep/50 border-gold/30 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:ring-gold/20"
                    />
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
                      'Create Event & Get Code →'
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* Step 2: Share Code */
              <div className="text-center py-6">
                <div className="relative inline-block mb-6">
                  <Gift className="h-20 w-20 text-gold mx-auto animate-float" />
                  <CheckCircle2 className="h-8 w-8 text-green-400 absolute -bottom-1 -right-1" />
                </div>

                <h2 className="font-display text-3xl text-gradient-gold mb-2">
                  Event Created! 🎉
                </h2>
                <p className="text-snow-white/70 mb-8">
                  Share this code with your participants to join the fun!
                </p>

                <div className="bg-christmas-red-deep/60 border-2 border-gold/40 rounded-2xl p-6 mb-6 max-w-sm mx-auto">
                  <p className="text-snow-white/70 text-sm mb-2">Your Event Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-display text-4xl text-gold tracking-widest">
                      {eventCode}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 rounded-lg bg-gold/20 hover:bg-gold/30 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5 text-gold" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-green-400 text-sm mt-2 animate-fade-in">
                      Copied to clipboard!
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="hero"
                    onClick={() => navigate('/my-events')}
                    className="shadow-gold"
                  >
                    View My Events
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setFormData({ name: '', date: '', budget: '', description: '' });
                      setEventCode('');
                    }}
                    className="border-gold/40 text-gold hover:bg-gold/10"
                  >
                    Create Another Event
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
