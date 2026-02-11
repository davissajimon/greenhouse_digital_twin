import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for production (set to false for smaller builds)
    sourcemap: false,

    // Minification
    minify: 'esbuild',

    // Target modern browsers for smaller bundles
    target: 'es2015',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'animation-vendor': ['framer-motion', '@react-spring/three'],
          'ui-vendor': ['bootstrap', 'react-bootstrap'],
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            extType = 'images';
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            extType = 'fonts';
          } else if (/\.(glb|gltf)$/i.test(assetInfo.name)) {
            extType = 'models';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Asset optimization
    assetsInlineLimit: 4096, // 4kb - inline small assets as base64
  },

  // Dev server optimizations
  server: {
    // Enable CORS
    cors: true,

    // Faster HMR
    hmr: {
      overlay: true,
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'framer-motion',
    ],
    exclude: ['leva'], // Exclude dev-only dependencies
  },
})
