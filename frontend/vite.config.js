import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('@tailwindcss/postcss'), // Use the new PostCSS plugin
        require('autoprefixer'),
      ],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});