import path from 'node:path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest.config.js';
import { displayName, name, version } from './package.json';

const extensionName = displayName || name;

export default defineConfig({
  build: {
    emptyOutDir: false, // SDK 디렉토리를 보존
  },
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    react(),
    crx({ manifest }) as any,
    zip({ outDir: 'release', outFileName: `crx-${extensionName}-${version}.zip` }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
