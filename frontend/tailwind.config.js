/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#F4F7FB',
        surface: '#FFFFFF',
        brand: {
          DEFAULT: '#1A6B72',
          hover: '#134E53',
          purple: '#6B46C1', 
          purpleLight: '#8B5CF6',
          purpleDark: '#4C1D95',
          green: '#10B981', 
          blue: '#3B82F6',  
          orange: '#F97316', 
          dark: '#0B1120',  
          teal: '#14B8A6',
        },
        content: {
          primary: '#1E293B',
          secondary: '#64748B',
        },
        border: {
          subtle: '#E2E8F0',
        },
        semantic: {
          success: { text: '#166534', bg: '#DCFCE7' },
          info: { text: '#1E40AF', bg: '#DBEAFE' },
          warning: { text: '#9A3412', bg: '#FFEDD5' },
          danger: { text: '#991B1B', bg: '#FEE2E2' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(107, 70, 193, 0.5)',
        'card-hover': '0 10px 25px -5px rgba(107, 70, 193, 0.15), 0 8px 10px -6px rgba(107, 70, 193, 0.1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
