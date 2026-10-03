import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables (including server-only ones without VITE_ prefix) into process.env
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'api-server-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (req.url === '/api/admin' || req.url.startsWith('/api/admin?'))) {
              try {
                // Ensure process.env is refreshed with local environment variables
                const currentEnv = loadEnv(mode, process.cwd(), '');
                Object.assign(process.env, currentEnv);

                const handlerModule = await server.ssrLoadModule('./api/admin.ts');
                const handler = handlerModule.default;
                await handler(req, res);
              } catch (err: any) {
                console.error('API Middleware Error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: false,
                    error: err.message || 'Internal Server Error',
                  })
                );
              }
              return;
            }
            next();
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
  };
});


