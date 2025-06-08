/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Scans your React components for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1db954', // Matches --color-primary in index.css
        secondary: '#1ed760', // Optional: matches --color-secondary
        accent: '#ff4444', // Optional: matches --color-accent
      },
    },
  },
  plugins: [],
};