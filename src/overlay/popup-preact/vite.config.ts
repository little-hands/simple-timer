import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'PopupPreact',
      fileName: 'popup-preact',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        dir: '../../../dist/overlay/popup-preact',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: '../../../dist/overlay/popup-preact',
    emptyOutDir: true
  },
  base: './'
});