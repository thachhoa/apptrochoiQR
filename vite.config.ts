import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Dùng esbuild để transpile TypeScript (nhanh, không cần tsc)
      // Type checking được tsc --noEmit xử lý riêng
      target: 'es2022',
      outDir: 'dist',
      // Tránh lỗi chunk size warning
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Tách vendor chunks để tối ưu cache
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
