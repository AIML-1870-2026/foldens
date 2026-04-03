import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'src',
  base: '/foldens/drug-safety-explorer/',
  build: {
    outDir: '..',       // outputs to drug-safety-explorer/
    emptyOutDir: false, // don't delete src/ on build
  },
  server: {
    port: 5173,
  },
})
