import { useState } from 'react';
import { Button } from './ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Determine nav links based on login status and role
  // If logged in, user is an organizer (participants don't have accounts)
  const getNavLinks = () => {
    if (!currentUser) {
      // Before login: No links in center (How It Works goes to right corner)
      return [];
    } else {
      // After login (organizer): Full nav
      return [
        { name: 'Home', href: '/' },
        { name: 'Create Event', href: '/create-event' },
        { name: 'My Events', href: '/dashboard' },
      ];
    }
  };

  const navLinks = getNavLinks();

  const NavLink = ({ link }: { link: { name: string; href: string } }) => {
    const active = isActive(link.href);
    return (
      <Link
        to={link.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`font-body transition-all duration-300 relative group ${
          active
            ? 'text-gold'
            : 'text-snow-white/80 hover:text-gold'
        }`}
      >
        <span className="relative z-10">{link.name}</span>
        {/* Active indicator - subtle glow and underline */}
        {active && (
          <>
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-gold via-gold-light to-gold transition-all duration-300" />
            <span className="absolute inset-0 bg-gold/10 rounded-lg blur-sm -z-10" />
          </>
        )}
        {/* Hover underline for non-active links */}
        {!active && (
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300" />
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-transparent backdrop-blur-md border-b border-gold/20 z-50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="font-display text-2xl font-bold text-gradient-gold hover:opacity-90 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            ChrisCandle
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <NavLink key={link.name} link={link} />
            ))}
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* How It Works - Only show on landing page */}
            {location.pathname === '/' && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/how-it-works');
                }}
                className="font-body text-gold font-semibold animate-bulb-blink relative group px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <span className="relative z-10">How It Works</span>
                {/* Glow effect that pulses like a bulb */}
                <span className="absolute inset-0 bg-gold/20 rounded-lg blur-md -z-10 animate-bulb-glow" />
              </button>
            )}
            
            {currentUser && (
              <Button 
                variant="navGlow" 
                size="sm" 
                className="font-body"
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser && (
              <Button 
                variant="navGlow" 
                size="sm" 
                className="font-body"
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gold hover:text-gold-light transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gold/20">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <NavLink key={link.name} link={link} />
              ))}
              {/* How It Works in mobile menu - Only show on landing page */}
              {location.pathname === '/' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/how-it-works');
                  }}
                  className="font-body text-gold font-semibold animate-bulb-blink relative group py-2 px-3 rounded-lg text-left w-full"
                >
                  <span className="relative z-10">How It Works</span>
                  <span className="absolute inset-0 bg-gold/20 rounded-lg blur-md -z-10 animate-bulb-glow" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
