import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },

  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'moment', 'socket.io-client', 'framer-motion'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});

