import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        'wallet-create': resolve(__dirname, 'wallet-create.html'),
        'wallet-unlock': resolve(__dirname, 'wallet-unlock.html'),
        send: resolve(__dirname, 'send.html'),
        receive: resolve(__dirname, 'receive.html'),
        history: resolve(__dirname, 'history.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});

