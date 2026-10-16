/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          900: '#0E1117',
          800: '#161B22',
          700: '#21262D',
          600: '#30363D',
          accent: '#00F0FF',
          amd: '#ED1C24',
          critical: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
        },
        'bg-primary': '#0E1117',
        'bg-surface': '#161B22',
        'bg-elevated': '#21262D',
        'text-primary': '#E6EDF3',
        'text-secondary': '#8B949E',
        'border-color': '#21262D',
        'iot-accent': '#00F0FF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-amd': 'pulseAmd 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scan-line': 'scanLine 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)' },
        },
        pulseAmd: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(237, 28, 36, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(237, 28, 36, 0.7)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.3)',
        'glow-amd': '0 0 15px rgba(237, 28, 36, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.3)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
}
