import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://aura-vdcq.onrender.com',
          changeOrigin: true,
          secure: true,
        },
        '/socket.io': {
          target: env.VITE_API_URL || 'https://aura-vdcq.onrender.com',
          ws: true,
          changeOrigin: true,
          secure: true,
        },
        '/ws': {
          target: env.VITE_API_URL || 'https://aura-vdcq.onrender.com',
          ws: true,
          changeOrigin: true,
          secure: true,
        },
      },
    },

    define: {
      global: 'window',
    },
  };
});