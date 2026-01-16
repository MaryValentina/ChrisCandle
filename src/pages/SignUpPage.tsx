import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Snowflakes from '../components/Snowflakes';
import { Gift, Heart } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      navigate('/my-events');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-8 md:py-12">
      {/* Snowflakes Background */}
      <Snowflakes />

      {/* Decorative Elements */}
      <div className="absolute top-10 left-4 md:left-10 text-gold opacity-20 animate-float">
        <Gift size={40} className="md:w-[60px] md:h-[60px]" />
      </div>
      <div className="absolute bottom-20 right-4 md:right-10 text-gold opacity-20 animate-float" style={{ animationDelay: '1s' }}>
        <Gift size={35} className="md:w-[50px] md:h-[50px]" />
      </div>
      <div className="absolute top-1/4 right-4 md:right-20 text-gold opacity-15 animate-float" style={{ animationDelay: '2s' }}>
        <Gift size={30} className="md:w-[40px] md:h-[40px]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4 mt-auto mb-auto">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 rounded-3xl blur-xl" />
        
        <div className="relative bg-christmas-red-dark/60 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-gold/20 shadow-gold-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-gradient-gold mb-4">
              Welcome to ChrisCandle
            </h1>
            <p className="text-snow-white/70 font-body text-sm">
              New to ChrisCandle? Join the party! 🎉
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-4 bg-red-500/20 border-2 border-red-400/50 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-red-200 text-center">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="name" className="text-snow-white font-body text-xs">
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Santa Claus"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-christmas-red-deep/50 border-gold/30 focus:border-gold focus:ring-gold/30 text-snow-white placeholder:text-snow-white/40 rounded-xl h-10 font-body transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-snow-white font-body text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="santa@northpole.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-christmas-red-deep/50 border-gold/30 focus:border-gold focus:ring-gold/30 text-snow-white placeholder:text-snow-white/40 rounded-xl h-10 font-body transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-snow-white font-body text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-christmas-red-deep/50 border-gold/30 focus:border-gold focus:ring-gold/30 text-snow-white placeholder:text-snow-white/40 rounded-xl h-10 font-body transition-all duration-300"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-snow-white font-body text-xs">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-christmas-red-deep/50 border-gold/30 focus:border-gold focus:ring-gold/30 text-snow-white placeholder:text-snow-white/40 rounded-xl h-10 font-body transition-all duration-300"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              variant="heroGlow"
              disabled={isLoading}
              className="w-full h-10 rounded-xl font-body text-sm mt-4 group"
            >
              <span className="flex items-center gap-2">
                {isLoading ? 'Creating Account...' : 'Create Account'}
                <Heart className="w-4 h-4 group-hover:scale-125 transition-transform duration-300 fill-current" />
              </span>
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <p className="text-snow-white/70 font-body text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="ml-2 text-gold font-bold hover:text-gold-light transition-colors duration-300 hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gold/70 hover:text-gold font-body text-sm transition-colors duration-300"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="flex justify-center mt-6 gap-2 opacity-60">
          <span className="text-2xl animate-float" style={{ animationDelay: '0s' }}>🎄</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.5s' }}>✨</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '1s' }}>🎁</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '1.5s' }}>⭐</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '2s' }}>🎄</span>
        </div>
      </div>
    </div>
  );
}
