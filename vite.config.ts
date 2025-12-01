import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      // Custom middleware to mimic Vercel's /api/proxy function locally
      configureServer(server) {
        server.middlewares.use('/api/proxy', async (req, res, next) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const targetUrl = url.searchParams.get('url');

          if (targetUrl) {
            try {
              const fetchRes = await fetch(targetUrl);
              const text = await fetchRes.text();
              res.setHeader('Content-Type', 'text/plain');
              res.end(text);
            } catch (e: any) {
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
});