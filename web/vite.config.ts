import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
const proxy = {
  '/api': {
    target: process.env.FOUNDATIONS_API_TARGET || 'https://foundations.johncrowley.dev',
    changeOrigin: true,
  },
};
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Foundations',
        short_name: 'Foundations',
        description: 'A place to read, think, and practise mathematics.',
        theme_color: '#315fa0',
        background_color: '#f5f6f8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,woff,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 16000000,
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
});
