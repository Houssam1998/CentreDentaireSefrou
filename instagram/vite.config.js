import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));

// Studio Instagram — servi par Vite, séparé du site Astro.
export default defineConfig({
  root: here,
  plugins: [react()],
  // Les photos du cabinet et le logo vivent dans le site : on les partage au lieu de les copier.
  resolve: { alias: { '@site': resolve(here, '../src'), '@public': resolve(here, '../public') } },
  server: { port: 5199, strictPort: false, fs: { allow: [resolve(here, '..')] } },
  // Pré-compile tout au démarrage (évite les rechargements en cours de route)
  optimizeDeps: {
    entries: ['index.html', 'render.html', 'regress.html', 'reel/outro.html'],
    include: [
      'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
      'zustand', 'zustand/middleware/immer', 'zundo', 'immer', 'moveable', 'selecto', 'nanoid', 'idb-keyval',
      'html-to-image', 'qrcode', 'gsap', 'fflate', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities',
    ],
  },
  build: {
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    // Seul l'éditeur est publié en ligne (render.html et reel/ servent aux scripts locaux)
    rolldownOptions: { input: { studio: resolve(here, 'index.html') } },
  },
});
