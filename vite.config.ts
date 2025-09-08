import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // dev: http://localhost:5173/api -> http://103.217.176.16:83/api
      '/api': {
        target: 'http://103.217.176.16:83',
        changeOrigin: true
      },
      '/public': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
