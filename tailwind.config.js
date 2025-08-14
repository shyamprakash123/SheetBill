/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/DatePickerComponent*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradient 15s ease infinite',
        'hide': 'hide 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'roll-down-and-fade': 'rollDownAndFade 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'roll-up-and-fade': 'rollUpAndFade 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down-and-fade': 'slideDownAndFade 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left-and-fade': 'slideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up-and-fade': 'slideUpAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right-and-fade': 'slideRightAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'drawer-slide-left-and-fade': 'drawerSlideLeftAndFade 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'drawer-slide-right-and-fade': 'drawerSlideRightAndFade 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        hide: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideDownAndFade: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeftAndFade: {
          from: { opacity: '0', transform: 'translateX(2px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUpAndFade: {
          from: { opacity: '0', transform: 'translateY(2px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRightAndFade: {
          from: { opacity: '0', transform: 'translateX(-2px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        rollDownAndFade: {
          '0%': {
            opacity: '0',
            transform: 'scaleY(0.7)',
            transformOrigin: 'top',
          },
          '100%': {
            opacity: '1',
            transform: 'scaleY(1)',
            transformOrigin: 'top',
          },
        },
        rollUpAndFade: {
          '0%': {
            opacity: '1',
            transform: 'scaleY(1)',
            transformOrigin: 'top',
          },
          '100%': {
            opacity: '0',
            transform: 'scaleY(0.7)',
            transformOrigin: 'top',
          },
        },
        drawerSlideLeftAndFade: {
            from: { 
              opacity: '0', 
              transform: 'translateX(100%) scale(0.95)', 
              transformOrigin: 'right',
            },
            to: { 
              opacity: '1', 
              transform: 'translateX(0) scale(1)', 
              transformOrigin: 'right',
            },
          },
        drawerSlideRightAndFade: {
          from: { 
            opacity: '1', 
            transform: 'translateX(0) scale(1)', 
            transformOrigin: 'right',
          },
          to: { 
            opacity: '0', 
            transform: 'translateX(100%) scale(0.95)', 
            transformOrigin: 'right',
          },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '9999': '9999'
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ['aria-selected'],
      textColor: ['aria-selected'],
    },
  },
  plugins: [],
};