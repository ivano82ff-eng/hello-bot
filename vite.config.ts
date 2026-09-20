import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const pagesBase = process.env.GITHUB_PAGES === 'true' ? '/hello-bot/' : '/';

export default defineConfig({
  base: pagesBase,
  server: {
    host: '127.0.0.1',
    port: 43317,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 43318,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        planning: resolve(__dirname, 'planning/index.html'),
      },
    },
  },
});
