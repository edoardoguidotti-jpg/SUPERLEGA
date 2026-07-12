import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['superlega-logo.jpg', 'superlega-og.jpg'],
      manifest: {
        name: 'SUPERLEGA',
        short_name: 'SUPERLEGA',
        description: 'Il calcetto del lunedì: formazioni, risultati, classifica e presenze.',
        theme_color: '#07111f',
        background_color: '#07111f',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/superlega-logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
