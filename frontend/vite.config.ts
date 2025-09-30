import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:4000',
      '/supervisor': 'http://localhost:4000',
      '/teacher': 'http://localhost:4000',
      '/student': 'http://localhost:4000',
      '/notifications': 'http://localhost:4000',
      '/reports': 'http://localhost:4000',
      '/feature-flags': 'http://localhost:4000',
      '/push': 'http://localhost:4000'
    }
  }
});
