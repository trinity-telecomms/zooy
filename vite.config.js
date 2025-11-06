// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'zooy',
      fileName: (format) => `zooy.${format}.js`,
      formats: ['es', 'cjs']
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Suppress warnings for intentional design patterns
      onwarn(warning, warn) {
        // Ignore eval warning - used intentionally in evalScripts for dynamic script execution
        if (warning.code === 'EVAL' && warning.id?.includes('src/dom/utils.js')) {
          return;
        }
        // Ignore mixed exports warning - main.js intentionally exports both named and default for backward compatibility
        if (warning.code === 'MIXED_EXPORTS' && warning.id?.includes('src/main.js')) {
          return;
        }
        // Use default warning handler for all other warnings
        warn(warning);
      },
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
      }
    },
    minify: 'esbuild'
  }
});
