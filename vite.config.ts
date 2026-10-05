import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Defaults to the GitHub Pages sub-path (https://<user>.github.io/uk-isa-tracker/).
  // Cloudflare serves from the domain root, so its build sets BASE_PATH=/.
  base: process.env.BASE_PATH ?? '/uk-isa-tracker/',
  // Fixed port keeps the origin stable, so localStorage data survives dev-server restarts.
  server: { port: Number(process.env.PORT) || 5199, strictPort: true, host: true },
  test: { environment: 'node' },
})
