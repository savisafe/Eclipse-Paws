import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const aliases = {
  '@core': './src/core',
  '@application': './src/application',
  '@adapters': './src/adapters',
  '@ui': './src/ui',
  '@content': './src/content',
  '@shared': './src/shared',
};

export default defineConfig({
  plugins: [react()],
  build: {
    // Phaser is an isolated lazy-loaded engine chunk; 1.3 MB keeps its expected size warning-free.
    chunkSizeWarningLimit: 1300,
  },
  resolve: {
    alias: Object.fromEntries(
      Object.entries(aliases).map(([key, path]) => [
        key,
        fileURLToPath(new URL(path, import.meta.url)),
      ]),
    ),
  },
  test: {
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
});
