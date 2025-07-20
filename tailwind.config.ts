/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'primary-blue': '#2563eb',
        'primary-blue-dark': '#1d4ed8',
        'secondary-gray': '#f8fafc',
        'border-light': '#e2e8f0',
        'text-primary': '#0f172a',
        'text-secondary': '#64748b',
        'success-green': '#059669',
        'warning-orange': '#d97706',
        'error-red': '#dc2626',
        'accent-purple': '#7c3aed',
      }
    },
  },
  plugins: [],
}