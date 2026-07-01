import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /api calls get proxied to the backend (4000) — no CORS hassle.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
