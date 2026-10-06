import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Em "npm run dev:mock" o app usa dados de exemplo locais, sem Supabase.
// Serve para desenvolver e revisar telas offline; nunca vai para produção.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@api': fileURLToPath(new URL(
        mode === 'mock' ? './src/lib/api.mock.js' : './src/lib/api.js', import.meta.url)),
    },
  },
}))
