/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#0b0f17',
          light: '#f8fafc'
        },
        surface: {
          50: '#1e2638',
          100: '#161e2e',
          200: '#121824',
          300: '#0d131f',
          card: '#121824',
          hover: '#182030'
        },
        maritime: {
          cyan: '#06b6d4',
          blue: '#2563eb',
          navy: '#0f172a',
          teal: '#14b8a6',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.25)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.25)',
        'subtle-card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'light-card': '0 2px 12px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
