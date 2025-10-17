import path from 'node:path';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/sdk/index.ts'),
      name: 'scordi-extension',
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.js',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      ],
    },
    outDir: 'dist/sdk',
  },
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
});
