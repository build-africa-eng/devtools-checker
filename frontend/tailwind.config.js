/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1db954', // A Spotify-like green for accents
        secondary: '#1ed760', // Lighter green for hover states
        background: '#ffffff', // Light mode background
        'background-dark': '#121212', // Dark mode background
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enables dark mode via class toggle
};