import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['@reduxjs/toolkit', '@reduxjs/toolkit/query/react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/0_app'),
      '@entities': path.resolve(__dirname, './src/4_entities'),
      '@features': path.resolve(__dirname, './src/3_features'),
      '@shared': path.resolve(__dirname, './src/5_shared'),
      '@pages': path.resolve(__dirname, './src/1_pages'),
      '@widgets': path.resolve(__dirname, './src/2_widgets'),
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
