import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 代理配置：将 /feilian-api 开头的请求转发到目标服务器
      '/feilian-api': {
        target: 'https://corplink.isealsuite.com/api',
        changeOrigin: true, // 修改 Host 头，欺骗后端服务器
        rewrite: (path) => path.replace(/^\/feilian-api/, ''), // 重写路径，去掉前缀
      }
    }
  }
});