import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'OverlayPreact',
      fileName: 'overlay-preact',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        dir: '../../../dist/overlay/overlay-preact',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: '../../../dist/overlay/overlay-preact',
    emptyOutDir: true
  },
  base: './'
});