import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: "Lahfa'h",
        short_name: "Lahfa'h",
        description: 'Admin Dashboard',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    legacy({
      targets: ['defaults', 'not IE 11', 'ios >= 11'],
    }),
  ],
  build: {
    target: 'es2015',
    minify: 'terser',
  },
  server: {
    proxy: {
      '/api/olivraison': {
        target: 'https://partners.olivraison.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/olivraison/, '')
      },
      '/api/sendit': {
        target: 'https://app.sendit.ma/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sendit/, '')
      }
    }
  }
})
