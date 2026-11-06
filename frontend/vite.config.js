import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Where the APIs live. Locally they are on localhost; inside Docker
// (docker-compose.dev.yml) these env vars point at the service names.
const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:3000';
const ALERTS_URL = process.env.ALERTS_URL || 'http://localhost:3001';

// In dev, proxy API calls the same way Nginx does in production.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on all interfaces (needed inside a container)
    port: 5173,
    // File-change events don't cross Docker bind mounts on Windows/macOS; polling fixes hot reload.
    watch: process.env.CHOKIDAR_USEPOLLING ? { usePolling: true } : undefined,
    proxy: {
      '/api/inventory': { target: INVENTORY_URL, rewrite: (p) => p.replace(/^\/api\/inventory/, '') },
      '/api/alerts': { target: ALERTS_URL, rewrite: (p) => p.replace(/^\/api\/alerts/, '') },
    },
  },
});
