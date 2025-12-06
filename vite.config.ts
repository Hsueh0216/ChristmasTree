import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL for GitHub Pages: 
  // Sets assets to be loaded relatively (e.g. "./assets/index.js") instead of absolutely ("/assets/index.js")
  base: './', 
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})