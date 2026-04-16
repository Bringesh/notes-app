import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'My AI Notes',
        short_name: 'Notes',
        description: 'Full-Stack College Notes App',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone', // This is what hides the browser URL bar!
        icons: [
          {
            src: '/vite.svg', 
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})