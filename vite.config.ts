import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Served from https://<user>.github.io/uk-isa-tracker/ on GitHub Pages.
  base: '/uk-isa-tracker/',
  // Fixed port keeps the origin stable, so localStorage data survives dev-server restarts.
  server: { port: Number(process.env.PORT) || 5199, strictPort: true, host: true },
  test: { environment: 'node' },
})
