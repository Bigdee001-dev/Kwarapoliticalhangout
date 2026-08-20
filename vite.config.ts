import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            id: '/?source=pwa',
            name: 'KPH News',
            short_name: 'KPH News',
            description: 'The leading platform for breaking news, political analysis, and government reporting in Kwara State.',
            theme_color: '#8B0000',
            background_color: '#F8F9FA',
            start_url: '/?source=pwa',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
              {
                src: '/logo192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/logo512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/maskable-icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: '/maskable-icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: command === 'serve' ? [] : ['**/*.{js,css,html,ico,png,svg}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/ajqzyygzgjrydxilzzto\.supabase\.co\/rest\/v1\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 // <== 1 day
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'image-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          }
        })
      ],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
