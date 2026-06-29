import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev port so the app URL stays stable across restarts (CLIENT_ORIGIN
    // in server/.env already allows 5173/5174).
    port: 5173,
    // Proxy API calls to the Express server so the browser sees one origin.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
