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
        trading: {
          dark: '#0b0f19',
          card: '#111827',
          cardLight: '#1e293b',
          border: '#1f293d',
          accent: '#06b6d4',
          wind: '#10b981',
          forecast: '#38bdf8',
          thermal: '#f59e0b',
          deficit: '#f43f5e',
          surplus: '#6366f1',
          demand: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
