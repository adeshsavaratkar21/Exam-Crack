/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F0F2F6',
        surface: '#FFFFFF',
        accentYellow: '#FCE34D',
        accentYellowHover: '#EBD238',
        accentNavy: '#181926',
        navyCard: '#1C1D2A',
        softBorder: '#E5E7EB',
        softGreen: '#E8F8EE',
        softYellow: '#FEF9E7',
        softBlue: '#EBF5FF',
        softRose: '#FEE8E8',
        charcoal: {
          900: '#111827',
          800: '#1F2937',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 8px 24px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 16px 36px rgba(0, 0, 0, 0.07)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
