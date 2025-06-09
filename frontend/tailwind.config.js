/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
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
      minWidth: {
        button: '36px',
      },
      minHeight: {
        button: '36px',
      },
      boxShadow: {
        soft: '0 2px 6px rgba(0,0,0,0.08)',
        focus: '0 0 0 2px rgba(26, 115, 232, 0.5)',
      },
      spacing: {
        '1.25': '0.3125rem',
        '4.5': '1.125rem',
        '7': '1.75rem',
      },
    },
    screens: {
      sm: '640px',
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.bg-stripes': {
          backgroundImage:
            'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent)',
          backgroundSize: '1rem 1rem',
        },
      });
    }),
  ],
};