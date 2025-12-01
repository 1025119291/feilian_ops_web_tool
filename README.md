# Feilian OpsTool (飞连运维工具)

这是一个基于 React 开发的综合运维在线工具集，旨在为运维人员提供便捷的日常工具，包括编码转换、网络查询、代码审计以及飞连特定的业务查询功能。

## 🛠 功能列表

1.  **Unix 时间戳转换**: 支持当前时间实时刷新，双向转换（时间戳 <-> 日期时间）。
2.  **编码/解码工具**:
    *   Base64 编码/解码
    *   URL 编码/解码
    *   JWT Token 解析（Header/Payload 可视化）
3.  **公网 IP 归属地查询**: 查询 IP 的地理位置、运营商及 ASN 信息。
4.  **正则在线测试**: 支持正则匹配测试，并集成 AI 解释功能（Hyperscan 语法兼容）。
5.  **Shell 脚本语法检查**: 集成 Google Gemini AI，对 Shell 脚本进行语法和安全性审计。
6.  **文本对比**: 简单的行级文本差异对比工具。
7.  **JSON 格式化**: JSON 校验、美化与压缩。
8.  **飞连企业识别码查询**: 查询飞连企业门户域名、证书信息及公钥配置。

## 🏗 技术栈

*   **核心框架**: [React](https://react.dev/) (TypeScript)
*   **构建工具**: [Vite](https://vitejs.dev/) (推荐)
*   **样式库**: [Tailwind CSS](https://tailwindcss.com/)
*   **路由**: [React Router](https://reactrouter.com/)
*   **图标**: [Lucide React](https://lucide.dev/)
*   **AI 能力**: [Google GenAI SDK](https://ai.google.dev/) (Gemini 2.5 Flash)

## 🚀 快速开始

### 本地开发

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **配置 API Key**
    由于项目使用了 Google Gemini AI 功能（用于 Shell 审计和正则解释），需要在环境变量中配置 API Key。
    
    如果是使用 Vite，请创建 `.env` 文件：
    ```env
    VITE_API_KEY=your_google_gemini_api_key
    ```
    *(注意：本项目示例代码使用 process.env.API_KEY，在 Vite 环境中请配置 define 或使用 import.meta.env)*

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```

### 生产环境部署 (Docker + Nginx)

本项目为纯静态前端应用，推荐使用 Docker 容器化部署，由 Nginx 提供静态文件服务。

#### 1. 编写 Dockerfile

```dockerfile
# 阶段 1: 构建
FROM node:20-alpine as builder
WORKDIR /app

# 注入环境变量（如果在构建时需要，或者在运行时注入）
# ARG VITE_API_KEY
# ENV VITE_API_KEY=$VITE_API_KEY

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2: 运行
FROM nginx:alpine
# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Nginx 配置 (nginx.conf)
关键配置在于解决 SPA (Single Page Application) 路由刷新导致的 404 问题：

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        # 路由重定向到 index.html
        try_files $uri $uri/ /index.html;
    }
    
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

#### 3. 构建并运行镜像
```bash
# 构建镜像
docker build -t feilian-ops-tool .

# 运行容器
docker run -d -p 8080:80 feilian-ops-tool
```
访问 `http://localhost:8080` 即可使用。

## ⚠️ 注意事项

*   **CORS (跨域资源共享)**: 飞连企业识别码查询功能依赖于第三方接口 (`https://corplink.isealsuite.com/api/match`)。在浏览器端直接调用可能会遇到 CORS 限制。
    *   **解决方案**: 在生产环境中，建议在 Nginx 层配置 `proxy_pass` 反向代理，将请求转发至目标服务器，以绕过浏览器的同源策略限制。
*   **API Key 安全**: AI 功能依赖 API Key。在纯前端项目中，Key 会被打包进客户端代码中。在公网环境部署时，建议通过后端中间层转发 AI 请求，以免 Key 泄露。

## 目录结构

```
.
├── components/      # 公共 UI 组件 (侧边栏等)
├── services/        # 业务逻辑与 API 服务 (Gemini AI)
├── views/           # 各个功能页面的视图组件
├── types.ts         # TypeScript 类型定义
├── App.tsx          # 路由配置与主布局
├── index.tsx        # 应用入口
├── index.html       # HTML 模板
└── README.md        # 项目说明
```