# 部署文档

本文档说明如何将嘿哈项目部署到生产环境。

## 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 腾讯云账号（用于 COS、VOD 等服务）

## 构建生产版本

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_DATA=false
VITE_COS_SECRET_ID=your_secret_id
VITE_COS_SECRET_KEY=your_secret_key
VITE_COS_BUCKET=your_bucket
VITE_COS_REGION=ap-guangzhou
# ... 其他配置
```

### 3. 构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 部署方案

### 方案一：腾讯云 COS + CDN（推荐）

#### 1. 上传到 COS

```bash
# 安装 COS CLI
npm install -g coscmd

# 配置 COS
coscmd config -a <SecretId> -s <SecretKey> -b <Bucket> -r <Region>

# 上传文件
coscmd upload -rs dist/ /
```

#### 2. 配置 CDN

1. 在腾讯云 CDN 控制台添加域名
2. 配置源站为 COS 存储桶
3. 配置 HTTPS 证书
4. 配置缓存规则

#### 3. 配置自定义域名

在 COS 控制台配置静态网站托管，并绑定自定义域名。

### 方案二：Nginx

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/heiha`：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/heiha/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理（如果需要）
    location /api {
        proxy_pass https://api.yourdomain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/heiha /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. 部署文件

```bash
sudo cp -r dist/* /var/www/heiha/dist/
```

### 方案三：Docker

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 3. 构建和运行

```bash
docker build -t heiha:latest .
docker run -d -p 80:80 heiha:latest
```

## 环境变量配置

### 开发环境

使用 `.env.development` 文件。

### 生产环境

使用 `.env.production` 文件，或通过服务器环境变量配置。

**注意**：不要在代码仓库中提交包含敏感信息的 `.env` 文件。

## HTTPS 配置

### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com
```

### 使用腾讯云 SSL 证书

1. 在腾讯云 SSL 证书控制台申请证书
2. 下载证书文件
3. 在 Nginx 中配置：

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;
    # ...
}
```

## 性能优化

### 1. 启用 Gzip 压缩

已在 Nginx 配置中启用。

### 2. CDN 加速

使用腾讯云 CDN 加速静态资源。

### 3. 代码分割

Vite 已自动进行代码分割，如需手动配置，修改 `vite.config.ts`：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

## 监控和日志

### 1. 错误监控

建议集成 Sentry 或其他错误监控服务。

### 2. 性能监控

使用 Google Analytics 或腾讯云监控。

### 3. 日志收集

配置 Nginx 访问日志和错误日志。

## 回滚方案

### 使用 Git 标签

```bash
# 创建发布标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 回滚到指定版本
git checkout v1.0.0
npm run build
# 重新部署
```

### 使用 Docker 镜像版本

```bash
# 构建带版本号的镜像
docker build -t heiha:v1.0.0 .

# 回滚
docker run -d -p 80:80 heiha:v1.0.0
```

## 常见问题

### 1. 路由 404 问题

确保配置了 SPA 路由支持（`try_files $uri $uri/ /index.html;`）。

### 2. 静态资源 404

检查资源路径是否正确，确保使用相对路径。

### 3. API 请求跨域

配置 CORS 或使用 Nginx 代理。

## 安全检查清单

- [ ] 使用 HTTPS
- [ ] 配置安全响应头
- [ ] 隐藏服务器版本信息
- [ ] 配置防火墙规则
- [ ] 定期更新依赖
- [ ] 配置访问日志
- [ ] 设置备份策略

---

**注意**：部署前请确保所有环境变量已正确配置，并测试所有功能。
