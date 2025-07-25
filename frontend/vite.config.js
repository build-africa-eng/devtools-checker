import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Serve assets from root
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    manifest: true, // Generate manifest.json for debugging
    rollupOptions: {
      input: './index.html', // Explicitly set entry point
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    css: {
      devSourcemap: true,
    },
  },
});