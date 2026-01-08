import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'heroGlow' | 'heroOutlineGlow' | 'navGlow' | 'hero' | 'outline' | 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  to?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild, to, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      heroGlow: 'bg-gradient-to-r from-christmas-gold-400 to-christmas-gold-600 text-christmas-red-900 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] hover:scale-105',
      heroOutlineGlow: 'border-2 border-christmas-gold-400 text-christmas-gold-300 bg-transparent hover:bg-christmas-gold-400/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]',
      navGlow: 'bg-christmas-gold-500/20 border border-christmas-gold-400/50 text-christmas-gold-300 hover:bg-christmas-gold-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      hero: 'bg-gradient-to-r from-christmas-gold-400 to-christmas-gold-600 text-christmas-red-900 shadow-gold hover:shadow-gold-lg hover:scale-105',
      outline: 'border-2 border-gold/40 text-gold bg-transparent hover:bg-gold/10',
      default: 'bg-christmas-red-500 text-white hover:bg-christmas-red-600',
      destructive: 'bg-destructive text-white hover:bg-destructive/90',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const classes = cn(baseStyles, variants[variant], sizes[size], className);

    if (to) {
      return (
        <Link to={to} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

