import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode so we can read them
  // at config-build time (e.g. VITE_API_URL for proxy target decision)
  const env = loadEnv(mode, process.cwd(), '');

  // Vite dev proxy: forwards /api/* → backend in development.
  // In production the VITE_API_URL env var is set at build time
  // so the frontend calls the backend directly (no proxy needed).
  const backendTarget = env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],

    // All env vars prefixed with VITE_ are exposed to the browser bundle.
    envPrefix: 'VITE_',

    build: {
      // Output static files to frontend/dist (default, explicit for clarity)
      outDir: 'dist',
      // Generate source maps in production for easier debugging
      sourcemap: false,
      // Raise chunk size warning threshold (recharts + leaflet are large)
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Split vendor libraries into separate chunks for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts'],
            map: ['leaflet'],
          },
        },
      },
    },

    server: {
      port: 5173,
      // Dev proxy: all /api requests go to the FastAPI backend.
      // This avoids CORS issues during local development.
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      // Port for `vite preview` (serves the production build locally)
      port: 4173,
    },
  };
});
