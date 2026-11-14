/// <reference types="vitest" />
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [preact()],
  resolve: {
    alias: {
      // Alias React → Preact/compat for third-party packages (e.g. Norigin spatial nav)
      // that import 'react' as a peer dependency. @preact/preset-vite does this for
      // user code but not for pre-compiled node_modules; explicit alias covers both.
      react: path.resolve('./node_modules/preact/compat'),
      'react-dom': path.resolve('./node_modules/preact/compat'),
      'react/jsx-runtime': path.resolve('./node_modules/preact/jsx-runtime'),
    },
  },
  build: { target: 'es2019', outDir: 'dist', rollupOptions: { input: { app: path.resolve('index.html'), remote: path.resolve('remote.html') } } },
  server: {
    // Proxy DEV UNIQUEMENT : contourne le CORS en développement local.
    // En production (app webOS packagée), les appels Xtream sont directs.
    proxy: {
      '/dev-xtream': {
        target: 'http://your-xtream-host:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/dev-xtream/, ''),
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    passWithNoTests: true,
    // URL nécessaire pour que jsdom active localStorage (origine non-opaque)
    environmentOptions: { jsdom: { url: 'http://localhost' } },
    server: {
      deps: {
        // Inline Norigin so Vite rewrites its `import 'react'` through the
        // react→preact/compat alias above (default externalization bypasses aliases).
        inline: ['@noriginmedia/norigin-spatial-navigation', '@noriginmedia/norigin-spatial-navigation-react'],
      },
    },
  },
})
