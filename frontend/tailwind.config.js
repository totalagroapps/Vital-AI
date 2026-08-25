/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#F8F9FB',
        surface: '#FFFFFF',
        brand: {
          DEFAULT: '#1A6B72',
          hover: '#134E53',
        },
        content: {
          primary: '#1A1D21',
          secondary: '#6B7280',
        },
        border: {
          subtle: '#E5E7EB',
        },
        semantic: {
          success: { text: '#2F7D5C', bg: '#ECFDF5' },
          info: { text: '#3B6EA5', bg: '#EFF6FF' },
          warning: { text: '#92400E', bg: '#FFFBEB' },
          danger: { text: '#B91C1C', bg: '#FEF2F2' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
