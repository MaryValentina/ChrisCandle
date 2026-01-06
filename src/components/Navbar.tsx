import { Button } from './ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Create Event', href: '/create-event' },
    { name: 'My Events', href: '/my-events' },
  ];

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

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-transparent backdrop-blur-md border-b border-gold/20 z-50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-bold text-gradient-gold">
            ChrisCandle
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
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
            })}
          </div>

          {/* Auth Button */}
          {currentUser ? (
            <Button 
              variant="navGlow" 
              size="sm" 
              className="font-body"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="navGlow" size="sm" className="font-body">
                Login / Sign Up
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
