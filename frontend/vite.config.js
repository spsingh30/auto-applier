import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /api calls backend (4000) ko proxy ho jaayenge — CORS jhanjhat nahi.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
