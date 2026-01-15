import santaImage from '../assets/Gemini_Generated_Image_3kcsmi3kcsmi3kcs-removebg-preview.png';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HeroSection = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleOrganizeEvent = () => {
    if (currentUser) {
      // User is logged in, go to dashboard
      navigate('/my-events');
    } else {
      // User is not logged in, redirect to signup first
      navigate('/signup');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Frame - Santa */}
          <div className="flex justify-center lg:justify-center order-2 lg:order-1">
            <div className="w-80 h-[450px] md:w-[450px] md:h-[550px] flex items-center justify-center animate-float">
              <img src={santaImage} alt="Santa Claus shushing" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>

          {/* Right Frame - Title and CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-2 space-y-6">
            {/* Main Title - Reduced Size */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-gold text-shadow-gold tracking-wide leading-none">
              ChrisCandle
            </h1>

            {/* Tagline */}
            <p className="font-body text-sm md:text-base text-snow-white/90 font-light whitespace-nowrap">
              A festive Secret Santa app for spreading holiday joy
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button 
                variant="heroGlow" 
                size="lg" 
                className="font-body text-lg px-8 py-6 bg-gradient-to-r from-gold via-gold-light to-gold hover:from-gold-light hover:via-gold hover:to-gold-light text-christmas-red-900 font-semibold shadow-gold-lg hover:shadow-gold-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden" 
                onClick={handleOrganizeEvent}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Settings className="h-5 w-5 transition-transform group-hover:rotate-90" />
                  Organize Event
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="font-body text-lg px-8 py-6 text-gold font-semibold animate-bulb-blink relative group transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <span className="relative z-10">How It Works</span>
                {/* Glow effect that pulses like a bulb */}
                <span className="absolute inset-0 bg-gold/20 rounded-lg blur-md -z-10 animate-bulb-glow" />
              </button>
            </div>

            {/* Additional info */}
            <p className="font-body text-sm text-snow-white/60"> Free to use • No sign-up required </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

