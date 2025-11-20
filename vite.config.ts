import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env with all loaded env variables
      // This allows access via process.env.VITE_... as a fallback
      'process.env': JSON.stringify(env),
      // Explicitly define API_KEY for Gemini SDK compliance if needed specifically
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
    },
  };
});