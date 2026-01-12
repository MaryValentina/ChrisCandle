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
      heroGlow: 'bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep shadow-gold-lg hover:shadow-gold-lg hover:scale-105 transition-transform',
      heroOutlineGlow: 'border-2 border-gold text-gold bg-transparent hover:bg-gold/10 shadow-gold hover:shadow-gold-lg',
      navGlow: 'bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30 shadow-gold',
      hero: 'bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep shadow-gold hover:shadow-gold-lg hover:scale-105 transition-transform',
      outline: 'border-2 border-gold/40 text-gold bg-transparent hover:bg-gold/10 hover:border-gold/60',
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

