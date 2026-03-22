import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            // When Express is not running, the default error often shows as HTTP 500 in the browser.
            configure(proxy) {
              proxy.on('error', (err: NodeJS.ErrnoException, _req, res) => {
                const out = res as import('http').ServerResponse;
                if (typeof out?.writeHead === 'function' && !out.headersSent) {
                  out.writeHead(503, { 'Content-Type': 'application/json' });
                  out.end(
                    JSON.stringify({
                      success: false,
                      error: 'API server unreachable (port 3001)',
                      hint: 'Start the backend: npm run server — or run both: npm run dev:full',
                      code: err?.code ?? null,
                    })
                  );
                }
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
