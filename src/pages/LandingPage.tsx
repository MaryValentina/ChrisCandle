import Snowflakes from '../components/Snowflakes';
import SnowflakePattern from '../components/SnowflakePattern';
import HeroSection from '../components/HeroSection';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Navbar */}
      <Navbar />
      
      {/* Background pattern layer */}
      <SnowflakePattern />
      
      {/* Animated snowflakes */}
      <Snowflakes />
      
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(0,70%,12%)_100%)] pointer-events-none" />
      
      {/* Main content */}
      <main className="relative z-20">
        <HeroSection />
      </main>
      
      {/* Footer accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
    </div>
  );
};

export default LandingPage;
