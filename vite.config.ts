import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    },
    plugins: [
      react(),
      {
        name: 'configure-server',
        // Custom middleware to mimic Vercel's /api/proxy function locally
        configureServer(server) {
          server.middlewares.use('/api/proxy', async (req, res, next) => {
            const urlObj = new URL(req.url!, `http://${req.headers.host}`);
            const targetUrl = urlObj.searchParams.get('url');

            if (targetUrl) {
              try {
                // Forward the request to the target URL
                const fetchOptions: RequestInit = {
                  method: req.method,
                  headers: {
                    // Forward minimal headers needed
                    'User-Agent': req.headers['user-agent'] || 'FeilianOpsTool/Dev',
                  },
                };

                // If it's a PUT/POST, pass the request stream as the body
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                  // @ts-ignore - Node native fetch supports stream as body with duplex: 'half'
                  fetchOptions.body = req;
                  // @ts-ignore
                  fetchOptions.duplex = 'half';
                }

                const fetchRes = await fetch(targetUrl, fetchOptions);
                const text = await fetchRes.text();
                
                res.statusCode = fetchRes.status;
                res.setHeader('Content-Type', 'text/plain');
                res.end(text);
              } catch (e: any) {
                console.error('Proxy Error:', e);
                res.statusCode = 500;
                res.end(e.toString());
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    server: {
      proxy: {
        // Proxy for the main Feilian API
        '/feilian-api': {
          target: 'https://corplink.isealsuite.com/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/feilian-api/, ''),
        }
      }
    }
  };
});