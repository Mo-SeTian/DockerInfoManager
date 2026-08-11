/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f172a',
        'bg-card': '#1e293b',
        'bg-card-hover': '#253452',
        'accent': '#38bdf8',
        'accent-hover': '#0ea5e9',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'border-subtle': '#334155',
        'green-dot': '#22c55e',
        'yellow-dot': '#eab308',
        'red-dot': '#ef4444',
        'gray-dot': '#6b7280',
      },
    },
  },
  plugins: [],
};
