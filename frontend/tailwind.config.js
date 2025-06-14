module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#facc15',
        success: '#10b981', // For positive metrics
        warning: '#f59e0b', // For warnings
        error: '#ef4444', // For errors
      },
      minWidth: {
        button: '120px',
      },
      minHeight: {
        button: '40px',
      },
      maxWidth: {
        'card': '24rem', // For metric cards
        'chart': '40rem', // For performance charts
      },
      spacing: {
        'card-padding': '1.5rem', // Consistent padding for cards
      },
      fontSize: {
        'metric-lg': '1.25rem', // Larger font for key metrics
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow for cards
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Supported in v3.4.1
};