/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8',
        secondary: '#34a853',
        accent: '#fbbc04',
        error: '#ea4335',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
      },
      fontFamily: {
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Responsive button sizes
  screens: {
    sm: '640px',
  },
  extend: {
    minWidth: {
      button: '36px',
    },
    minHeight: {
      button: '36px',
    },
  },
};