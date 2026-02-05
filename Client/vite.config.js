import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // For local dev only
    },
  },
  build: {
    outDir: 'dist', // required for Netlify
  },
  base: '/', // ensures paths work correctly on Netlify
});
