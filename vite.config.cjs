const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig({
  root: 'window',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'window/src'),
      '@services': path.resolve(__dirname, 'services'),
    },
  },
  base: './',
  build: {
    outDir: '../dist/window',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
});
