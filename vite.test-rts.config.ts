import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/stratix-rts/test'),
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5174,
    open: true,
  },

  define: {
    'process.env': {}
  }
});
