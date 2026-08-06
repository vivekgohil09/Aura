import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    open: true,

    proxy: {
      '/api': {
        target: 'https://aura-vdcq.onrender.com',
        changeOrigin: true,
        secure: true,
      },

      '/socket.io': {
        target: 'https://aura-vdcq.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: true,
      },

      '/ws': {
        target: 'https://aura-vdcq.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },

  define: {
    global: 'window',
  },
});