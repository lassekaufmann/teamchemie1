import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: 'Teamchemie',
        short_name: 'Teamchemie',
        description: 'Die Mannschaft optimal aufstellen – Taktik, Kommunikation & Spielerchemie',
        start_url: '/',
        display: 'standalone',
        theme_color: '#c84aff',
        background_color: '#12122a',
        orientation: 'portrait-primary',
        icons: [], // Icons können später hinzugefügt werden
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
        ],
      },
      registerType: 'autoUpdate',
    }),
  ],
})
