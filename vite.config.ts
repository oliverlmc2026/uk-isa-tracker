import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version waits until the user taps Update (see UpdatePrompt).
      registerType: 'prompt',
      // public/manifest.webmanifest is hand-written and already linked from index.html.
      manifest: false,
      includeAssets: ['*.png', '*.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            // Google Fonts: cache so the app keeps its typography offline.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
    }),
  ],
  // Defaults to the GitHub Pages sub-path (https://<user>.github.io/uk-isa-tracker/).
  // Cloudflare serves from the domain root, so its build sets BASE_PATH=/.
  base: process.env.BASE_PATH ?? '/uk-isa-tracker/',
  // Fixed port keeps the origin stable, so localStorage data survives dev-server restarts.
  server: { port: Number(process.env.PORT) || 5199, strictPort: true, host: true },
  test: { environment: 'node' },
})
