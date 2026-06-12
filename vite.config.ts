import { defineConfig } from 'vite';

// Static single-page build, served fully offline. No backend, no env.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // never inline; keep scene.json/images as files
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
