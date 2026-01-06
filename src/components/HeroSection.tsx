import santaImage from '../assets/Gemini_Generated_Image_3kcsmi3kcsmi3kcs-removebg-preview.png';
import { Button } from './ui/button';

const HeroSection = () => {
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
              <Button variant="heroGlow" size="lg" className="font-body text-lg px-8 py-6" to="/signup">
                Start Your Exchange
              </Button>
              <Button variant="heroOutlineGlow" size="lg" className="font-body text-lg px-8 py-6" to="/how-it-works">
                How It Works
              </Button>
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

