import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Repository is deployed at https://rugern.github.io/open-hits/
export default defineConfig({
  base: '/open-hits/',
  plugins: [react(), tailwindcss()],
})
