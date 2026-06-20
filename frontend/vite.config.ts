import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // Enable content hashing for cache busting
    // Files get unique hashes when content changes, safe to cache forever
    rollupOptions: {
      output: {
        // Main entry point
        entryFileNames: 'assets/[name]-[hash].js',
        // Code splitting chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        // Images, fonts, etc
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    },
    // Generate manifest for server to reference correct filenames
    manifest: true,
    outDir: 'dist'
  },
  // Optional: Pass CloudFront URL to app (set via environment variable)
  define: {
    __VITE_CLOUDFRONT_URL__: JSON.stringify(
      process.env.VITE_CLOUDFRONT_URL || ''
    )
  }
})
