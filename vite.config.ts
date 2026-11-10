import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'IPT Check 2.0', short_name: 'IPT Check', description: 'Verifica locale delle agevolazioni auto per persone con disabilità',
      theme_color: '#080b10', background_color: '#080b10', display: 'standalone', lang: 'it',
      icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }, { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }, { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,wasm,mjs}'], navigateFallback: 'index.html', cleanupOutdatedCaches: true, runtimeCaching: [{ urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//, handler: 'CacheFirst', options: { cacheName: 'ocr-runtime', cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 12, maxAgeSeconds: 31536000 } } }] }
  })],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }
});
