/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Christmas color palette
        christmas: {
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444', // Primary red
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e', // Primary green
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b', // Primary gold
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          white: {
            DEFAULT: '#ffffff',
            snow: '#fffafa',
            cream: '#fffef0',
          },
          dark: '#8B0000', // Dark red background
          'red-deep': '#1a0000', // Deep red
          'red-dark': '#4a0000', // Dark red
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFED4E',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'snow-white': '#fffafa',
        'christmas-red-deep': '#1a0000',
        'christmas-red-dark': '#4a0000',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(0, 0%, 3.9%)',
        },
        'muted-foreground': 'hsl(0, 0%, 45.1%)',
        input: 'hsl(0, 0%, 89.8%)',
        ring: 'hsl(43, 96%, 56%)',
      },
      fontFamily: {
        christmas: ['"Dancing Script"', 'cursive'],
        display: ['Georgia', '"Times New Roman"', 'serif'],
        body: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
      },
      textShadow: {
        'gold': '0 4px 12px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        snowfall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)' },
        },
        'snowfall-slow': {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)' },
          '100%': { transform: 'translateY(100vh) rotate(180deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        snowfall: 'snowfall linear infinite',
        'snowfall-slow': 'snowfall-slow linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'christmas': '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.1)',
        'christmas-lg': '0 10px 15px -3px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.1)',
        'gold-lg': '0 0 30px rgba(255, 215, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
