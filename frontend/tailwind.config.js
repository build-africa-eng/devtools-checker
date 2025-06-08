/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.css', // Ensures index.css is scanned
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8', // DevTools-like blue
        secondary: '#34a853',
        accent: '#fbbc04',
        error: '#ea4335',
      },
    },
  },
  plugins: [],
};