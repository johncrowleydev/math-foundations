import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { lessonMdxOptions } from './lesson-mdx-options';
import { lessonFiles } from './lesson-mdx-plugins';
import { VitePWA } from 'vite-plugin-pwa';
const apiTarget = process.env.FOUNDATIONS_API_TARGET || 'https://foundations.johncrowley.dev';
const proxy: Record<string, ProxyOptions> = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    configure(server) {
      server.on('proxyReq', (outgoing, incoming) => {
        // The loopback preview is a trusted same-origin development bridge.
        // Never translate a cross-site Origin into an authorized one.
        const origin = incoming.headers.origin;
        if (
          apiTarget === 'https://foundations.johncrowley.dev' &&
          origin &&
          (origin === 'http://' + incoming.headers.host ||
            origin === 'https://' + incoming.headers.host)
        )
          outgoing.setHeader('Origin', apiTarget);
      });
    },
  },
};
export default defineConfig({
  define: { __LESSON_FILES__: JSON.stringify(lessonFiles) },
  resolve: { dedupe: ['react', 'react-dom'] },
  plugins: [
    mdx(lessonMdxOptions),
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
