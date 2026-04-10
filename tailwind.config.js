/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#030712',
          darker: '#060d1f',
          dark: '#0a1628',
          card: '#0d1f3c',
          border: '#1a3a5c',
          green: '#00ff9d',
          'green-dim': '#00cc7a',
          red: '#ff2d55',
          'red-dim': '#cc2244',
          orange: '#ff6b00',
          blue: '#0088ff',
          purple: '#9d4edd',
          yellow: '#ffd60a',
          text: '#a8c0d6',
          'text-bright': '#e2eaf5',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Share Tech Mono"', 'monospace'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff9d, 0 0 10px #00ff9d40' },
          '50%': { boxShadow: '0 0 20px #00ff9d, 0 0 40px #00ff9d40' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        glow: {
          '0%': { textShadow: '0 0 5px #00ff9d' },
          '100%': { textShadow: '0 0 20px #00ff9d, 0 0 40px #00ff9d' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,255,157,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.03) 1px, transparent 1px)",
        'scanline': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
      },
    },
  },
  plugins: [],
}
