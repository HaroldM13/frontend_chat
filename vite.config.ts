import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['LogoJHT.jpeg', 'icon-*.png'],
      manifest: {
        name: 'JHT Chat',
        short_name: 'JHT Chat',
        description: 'Aplicación de chat en tiempo real',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpeg,jpg,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
  }
})
