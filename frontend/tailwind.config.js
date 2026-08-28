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
          DEFAULT: '#1A6B72', // Restored for backward compatibility with old UI
          hover: '#134E53',   // Restored
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
      }
    },
  },
  plugins: [],
}
