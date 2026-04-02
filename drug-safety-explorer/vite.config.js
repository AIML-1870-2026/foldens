import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/foldens/drug-safety-explorer/',
  server: {
    port: 5173,
  },
})
