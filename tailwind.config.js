/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0F0F0F',
          100: '#1A1A1A',
          200: '#2A2A2A'
        },
        accent: {
          purple: '#8B5CF6',
          blue: '#3B82F6'
        }
      }
    },
  },
  plugins: [],
};