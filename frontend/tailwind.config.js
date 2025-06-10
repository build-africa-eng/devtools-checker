module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#facc15',
      },
      minWidth: {
        button: '120px',
      },
      minHeight: {
        button: '40px',
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
};