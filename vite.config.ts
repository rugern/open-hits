import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Repository is deployed at https://rugern.github.io/open-hits/
export default defineConfig({
  base: '/open-hits/',
  plugins: [react(), tailwindcss()],
  // Spotify rejects localhost as a redirect URI for new apps, so dev must run
  // on the IPv4 loopback to match the registered http://127.0.0.1:5173/open-hits/.
  server: {
    host: '127.0.0.1',
  },
})
