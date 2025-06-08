/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',           // Include HTML if used
    './src/**/*.{js,jsx,ts,tsx}', // Scan React components
    './*.css',               // Scan index.css directly
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1db954', // Define primary color matching --color-primary
        secondary: '#1ed760', // Optional: matches --color-secondary
        accent: '#ff4444', // Optional: matches --color-accent
      },
    },
  },
  plugins: [],
};