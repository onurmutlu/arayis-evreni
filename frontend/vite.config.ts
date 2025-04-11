import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { presetUno, presetIcons, transformerVariantGroup } from 'unocss'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // BUNU ekle → bu, üretim ortamında tüm path'lerin doğru çalışmasını sağlar
  plugins: [
    react(),
    UnoCSS({
      presets: [presetUno(), presetIcons()],
      transformers: [transformerVariantGroup()]
    })
  ],
  server: {
    port: 5190,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'telegram-vendor': ['@twa-dev/types']
        }
      }
    }
  }
})
