import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: 'dist',      // OK
    emptyOutDir: true    // limpa a pasta dist antes do build
  },
  base: './'             // garante que o build funcione no Vercel (rota relativa)
});
