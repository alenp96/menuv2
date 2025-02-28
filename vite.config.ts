import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      crypto: 'crypto-js',
      path: 'path-browserify',
      stream: 'stream-browserify',
      util: 'util'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['aws-sdk']
    }
  }
})
