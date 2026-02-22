import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // FIX: Define Supabase environment variables for client-side access. This makes them available under `process.env` and avoids TypeScript errors related to `import.meta.env` when client types are not correctly configured.
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      },
      resolve: {
        alias: {
          // FIX: Replace `__dirname` with its ES module equivalent to resolve the "Cannot find name '__dirname'" error.
          '@': path.dirname(fileURLToPath(import.meta.url)),
        }
      }
    };
});
