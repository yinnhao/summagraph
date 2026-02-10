# SummaGraph

> AI-powered infographic generator - Transform text into visual stories

SummaGraph 是一个现代化的信息图生成器，通过 AI 技术将文本内容转换为精美的视觉化信息图。用户只需输入文本，选择风格和布局，即可生成专业的信息图作品。

## 功能特性

- **智能文本处理**: AI 自动分析并总结文本内容
- **多种视觉风格**: 支持 17 种不同的视觉风格（craft-handmade、cyberpunk-neon、bold-graphic 等）
- **丰富布局选择**: 提供 20 种布局模板（bento-grid、comic-strip、linear-progression 等）
- **实时进度反馈**: SSE 流式传输，实时显示生成进度
- **多语言支持**: 支持中文和英文内容
- **图片下载**: 一键下载生成的高清信息图

### 配置生成模式（Mock vs Real）

项目支持两种生成模式：
- **Mock 模式（默认）**：快速返回模拟数据，不消耗 API Token，适合调试前端 UI。
- **Real 模式**：调用真实 AI API 生成图片，需要配置 API Key。

通过环境变量 `MOCK_GENERATION` 控制：

```bash
# 默认开启 Mock
npm run server

# 开启真实生成
MOCK_GENERATION=false npm run dev:all

MOCK_GENERATION=false npm run server
```

### 配置 API Key

使用真实模式前，请在 `api_config.py` 中配置：
- `doubao-pro-32k` (LLM)
- `doubao-t2i` (文生图)

### 独立运行后端脚本

也可以直接通过 Python 脚本测试生成逻辑：

```bash
python3 workflow.py "AI将会如何改变2026年的软件开发行业？"
```

## 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架

### 后端
- **Node.js + Express** - API 服务器
- **Python** - 核心生成逻辑 (Bridge + Workflow)
- **Doubao API** - LLM & T2I 服务

### 架构说明

前端通过 HTTP 请求调用 Node.js 后端，Node.js 后端通过 `server/bridge.py` 桥接调用 Python `workflow.py` 脚本，执行核心生成任务。

## 项目结构

```
summagraph/
├── src/                      # 前端源代码
│   ├── components/           # React 组件
│   │   ├── HeroInputForm.tsx      # 输入表单
│   │   ├── AlchemicalLoading.tsx  # 加载动画
│   │   └── ResultsGallery.tsx     # 结果展示
│   ├── services/            # API 服务
│   ├── types.ts             # TypeScript 类型定义
│   └── main.tsx             # 应用入口
├── server/                   # 后端服务器
│   ├── index.js             # Express 服务器
│   └── generator.js         # 信息图生成器
├── public/                   # 静态资源
├── baoyu-skills/            # Baoyu 技能集成
├── outputs/                 # 生成的图片输出目录
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 8.x
- Supabase 项目（用于用户认证和数据库）
- PayPal Developer 账号（用于订阅支付，可选）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

项目需要两个 `.env` 文件，分别用于前端（Vite）和后端（Express）。

#### 根目录 `.env`（前端 + 通用配置）

```bash
# 从示例文件复制
cp .env.production.example .env
```

填写以下关键配置：

```bash
# --- Server ---
PORT=3001

# --- Generation Mode ---
# true = Mock 模式（不调用 API，适合前端开发）
# false = 真实模式（调用 AI API 生成图片）
MOCK_GENERATION=true

# --- Supabase ---
# 从 Supabase 项目 Settings > API 获取
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# --- PayPal（可选，用于订阅支付）---
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_ID=your-webhook-id
PAYPAL_MODE=sandbox
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
VITE_PAYPAL_PRO_PLAN_ID=P-xxxxx
VITE_PAYPAL_PREMIUM_PLAN_ID=P-xxxxx
```

#### `server/.env`（后端专用配置）

```bash
# 从示例文件复制
cp server/.env.example server/.env
```

需要填写与根目录 `.env` 相同的 Supabase 和 PayPal 配置（后端需要通过 `dotenv` 读取自己的 `.env`）。

> **注意**: `.env` 文件包含敏感密钥，已在 `.gitignore` 中排除，请勿提交到公开仓库。

### 3. 配置 Supabase 数据库

在 Supabase Dashboard 的 SQL Editor 中运行数据库迁移脚本：

```bash
# 迁移脚本位于
supabase/migrations/001_initial_schema.sql
```

该脚本会创建以下表和功能：
- `profiles` - 用户资料表（自动在用户注册时创建）
- `generations` - 生成记录表
- `subscriptions` - 订阅管理表
- Row Level Security (RLS) 策略
- 自动触发器（新用户自动建档、时间戳自动更新）

### 4. 启动开发服务器

**一键启动前后端（推荐）**：

```bash
npm run dev:all
```

或者分别启动：

```bash
# 终端 1 - 启动前端开发服务器 (Vite, 端口 3000)
npm run dev

# 终端 2 - 启动后端 API 服务器 (Express, 端口 3001)
npm run server
```

启动成功后会看到：

```
[0]   VITE v5.4.21  ready in XXX ms
[0]   ➜  Local:   http://localhost:3000/
[1] XX:XX:XX info: Summagraph server started {"port":"3001","env":"development"}
[1] XX:XX:XX info: Health check available at http://localhost:3001/api/health
```

### 5. 访问应用

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **健康检查**: http://localhost:3001/api/health

### 常见启动问题

#### 端口被占用

如果 3000 或 3001 端口被其他进程占用：

```bash
# 查看占用端口的进程
fuser 3000/tcp 3001/tcp

# 强制释放端口
fuser -k 3000/tcp
fuser -k 3001/tcp

# 重新启动
npm run dev:all
```

#### 后端启动失败（Supabase 未配置）

如果后端崩溃且没有明显报错，可能是 Supabase 环境变量未正确配置。单独运行后端查看详细错误：

```bash
node server/index.js
```

#### Vite 提示 NODE_ENV 警告

`.env` 中的 `NODE_ENV=production` 在开发模式下会被 Vite 忽略并产生警告，这是正常的。如需消除警告，可注释掉该行（生产部署时通过 Docker 环境变量设置）。

## 可用命令

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run server           # 启动后端 API 服务器
npm run dev:all          # 同时启动前后端服务器
npm run server:prod      # 以生产模式启动后端服务器

# 构建
npm run build            # 构建生产版本
npm run preview          # 预览生产构建

# 代码质量
npm run lint             # 运行 ESLint 检查

# 日志查看
npm run logs             # 实时查看所有日志
npm run logs:error       # 实时查看错误日志
```

## API 端点

### GET /api/health
健康检查端点

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

### GET /api/options
获取可用的风格和布局选项

**响应示例**:
```json
{
  "defaults": {
    "aspect": "landscape",
    "layout": "bento-grid",
    "style": "craft-handmade"
  },
  "layouts": [...],
  "styles": [...]
}
```

### POST /api/generate
生成信息图（非流式）

**请求体**:
```json
{
  "text": "要转换的文本内容",
  "style": "craft-handmade",
  "layout": "bento-grid",
  "imageCount": 4,
  "language": "zh"
}
```

### POST /api/generate-stream
生成信息图（流式，支持实时进度）

**请求体**: 同 `/api/generate`

**响应**: Server-Sent Events (SSE) 流
```
data: {"type":"start","message":"Starting generation..."}

data: {"type":"progress","data":{"progress":25,"message":{"zh":"处理中...","en":"Processing..."},"step":1,"total":4}}

data: {"type":"complete","data":{...}}
```

## 配置说明

### 前端代理配置

`vite.config.ts` 中已配置 API 代理：

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
  '/outputs': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

### 后端端口配置

通过环境变量配置后端端口：

```bash
# 默认端口 3001
PORT=3001 npm run server
```

### 日志配置

项目使用 **Winston** 日志库，支持自动日志轮转和分级记录。

#### 日志文件位置

所有日志文件保存在 `logs/` 目录：

```
logs/
├── combined-YYYY-MM-DD.log      # 所有日志（info 及以上）
├── error-YYYY-MM-DD.log         # 错误日志（error 及以上）
├── exceptions-YYYY-MM-DD.log    # 未捕获的异常
└── rejections-YYYY-MM-DD.log    # 未处理的 Promise 拒绝
```

#### 日志保留策略

- **combined 日志**: 保留 14 天，单文件最大 20MB
- **error 日志**: 保留 30 天，单文件最大 20MB
- **exceptions/rejections**: 保留 30 天，单文件最大 20MB

#### 日志级别

- **error**: 错误信息
- **warn**: 警告信息
- **info**: 一般信息（服务器启动、请求处理等）
- **debug**: 调试信息

#### 查看日志

```bash
# 实时查看今天的所有日志
npm run logs

# 实时查看今天的错误日志
npm run logs:error

# 或直接使用 tail 命令
tail -f logs/combined-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log

# 查看特定日期的日志
cat logs/combined-2025-01-27.log
```

#### 环境变量

```bash
# 设置日志级别（默认: info）
LOG_LEVEL=debug npm run server

# 生产模式（只记录 warn 及以上）
NODE_ENV=production npm run server
```

#### 日志示例

```
2025-01-27 12:00:00 [INFO]: Summagraph server started {"port":3001,"env":"development"}
2025-01-27 12:00:01 [INFO]: Health check available at http://localhost:3001/api/health
2025-01-27 12:01:23 [INFO]: Starting infographic generation {"textLength":150,"style":"craft-handmade","layout":"bento-grid","imageCount":4,"language":"zh"}
2025-01-27 12:01:25 [ERROR]: Error generating infographics (stream) {"error":"API timeout","stack":"..."}
```

## 视觉风格选项

项目支持 17 种视觉风格：

- **craft-handmade** (默认) - 手工纸质风格，温暖有机的感觉
- **bold-graphic** - 高对比度漫画风格，粗线条和戏剧性视觉效果
- **cyberpunk-neon** - 霓虹发光，未来主义美学
- **chalkboard** - 黑板背景，彩色粉笔绘画风格
- **claymation** - 3D 粘土人偶美学
- **corporate-memphis** - 平面矢量人物，鲜艳的几何填充
- **aged-academia** - 历史科学插图风格
- **ikea-manual** - 极简线条艺术组装说明风格
- **kawaii** - 日式可爱风格
- **knolling** - 有组织的俯拍排列
- **lego-brick** - 积木拼装风格
- **origami** - 折纸几何美学
- **pixel-art** - 复古 8 位游戏美学
- **storybook-watercolor** - 柔和手绘插图风格
- **subway-map** - 地铁图风格
- **technical-schematic** - 技术图表风格
- **ui-wireframe** - 灰度界面线框风格

## 布局选项

项目支持 20 种布局模板：

- **bento-grid** - 模块化网格布局，不同大小的单元格
- **binary-comparison** - 两个项目、状态或概念的并排比较
- **bridge** - 连接问题到解决方案的桥梁结构
- **circular-flow** - 显示连续或循环步骤的循环过程
- **comic-strip** - 讲述故事或解释概念的顺序叙事面板
- **comparison-matrix** - 多项目的多因素网格比较
- **dashboard** - 多指标显示，包含图表、数字和 KPI
- **funnel** - 显示转换、过滤或细化过程的 narrowing 阶段
- **hierarchical-layers** - 嵌套层，显示重要性、影响力级别
- **hub-spoke** - 中心概念与相关项目的辐射连接
- **iceberg** - 表面 vs 隐藏深度
- **isometric-map** - 3D 空间布局
- **jigsaw** - 显示各部分如何组合的拼图碎片
- **linear-progression** - 显示步骤、时间线的顺序进展
- **periodic-table** - 分类元素的网格
- **story-mountain** - 情节结构可视化
- **structural-breakdown** - 带标签的部分或层的内部结构
- **tree-branching** - 分层结构，从根到叶的分支
- **venn-diagram** - 重叠圆圈显示关系
- **winding-roadmap** - 显示旅程里程碑的曲线路径

## 开发指南

### 添加新的视觉风格

1. 在 `server/index.js` 中的 `styles` 数组添加新风格
2. 更新 `src/components/HeroInputForm.tsx` 中的风格选择器（如需要）

### 添加新的布局

1. 在 `server/index.js` 中的 `layouts` 数组添加新布局
2. 确保后端生成器支持该布局逻辑

### 修改主题颜色

编辑 `tailwind.config.js` 中的主题配置：

```javascript
theme: {
  extend: {
    colors: {
      // 自定义颜色
    }
  }
}
```

## 常见问题

### Q: 前端无法连接到后端 API？
A: 确保后端服务器正在运行（`npm run server`），并检查端口 3001 是否被占用。

### Q: 生成的图片在哪里？
A: 图片保存在 `outputs/` 目录中，并通过 `/outputs` 路由提供访问。

### Q: 日志保存在哪里？
A: 日志保存在 `logs/` 目录，按日期自动分割。使用 `npm run logs` 查看实时日志。

### Q: 如何更改默认语言？
A: 在前端组件的 `language` state 中设置默认值，或修改 `HeroInputForm.tsx`。

### Q: 如何查看历史日志？
A: 日志文件按日期命名，如 `combined-2025-01-27.log`，可以直接查看或使用 `cat`、`less` 等命令。

### Q: 日志文件太大怎么办？
A: 日志已配置自动轮转，单个文件最大 20MB，会自动创建新文件。旧日志会根据保留策略自动删除。

---

## 部署指南

项目提供两种部署方式：**Docker 部署**（推荐）和**手动部署**。

当前生产环境地址：**https://www.summagraph.com/**

### 生产环境架构

```
                    ┌─────────────┐
   用户 HTTPS ──────►│ Cloudflare  │  CDN + SSL 终端
                    │   (CDN)     │
                    └──────┬──────┘
                           │ HTTP (端口 80)
                    ┌──────▼──────┐
                    │   Nginx     │  Docker 容器 (summagraph-nginx)
                    │  反向代理    │  端口 80/443
                    └──────┬──────┘
                           │ HTTP (内部网络)
                    ┌──────▼──────┐
                    │  Node.js    │  Docker 容器 (summagraph)
                    │  Express    │  端口 3001（仅容器内部）
                    │  + 前端静态  │
                    └──────┬──────┘
                           │ spawn
                    ┌──────▼──────┐
                    │   Python    │
                    │  workflow   │
                    └──────┬──────┘
                           │ API calls
                  ┌────────▼────────┐
                  │ Doubao / Banana │
                  │    T2I API      │
                  └─────────────────┘
```

**关键说明**：
- 域名 DNS 指向 Cloudflare（非源站 IP），Cloudflare 以 **Flexible SSL** 模式运行
- Cloudflare 负责面向用户的 HTTPS 加密，通过 HTTP 连接到源站 Nginx（端口 80）
- Nginx 在端口 80 上直接代理到应用（**不做 HTTP→HTTPS 重定向**，否则会造成重定向循环）
- Nginx 同时监听 443 端口并配有 Let's Encrypt SSL 证书，用于直接 IP 访问的场景
- 应用端口 3001 不对外暴露，仅在 Docker 内部网络中通信

---

### 方式一：Docker 部署（推荐）

#### 前置要求

- Docker >= 20.x
- Docker Compose >= 2.x
- 域名已在 Cloudflare 配置好 DNS（指向服务器 IP）

#### 首次部署：完整步骤

```bash
# ==========================================
# 步骤 1：克隆项目
# ==========================================
git clone <your-repo-url> summagraph
cd summagraph

# ==========================================
# 步骤 2：配置 API Key
# ==========================================
# 编辑 api_config.py，填入真实的 API Key
vim api_config.py

# ==========================================
# 步骤 3：获取 SSL 证书（首次需要）
# ==========================================
# 安装 certbot
apt-get update && apt-get install -y certbot

# 确保端口 80 没有被其他服务占用
ss -tlnp | grep :80

# 获取 Let's Encrypt 证书（替换为你的域名和邮箱）
certbot certonly --standalone \
  -d summagraph.com \
  -d www.summagraph.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

# 验证证书文件已生成
ls /etc/letsencrypt/live/summagraph.com/

# ==========================================
# 步骤 4：启动服务
# ==========================================
docker compose up -d

# ==========================================
# 步骤 5：验证部署
# ==========================================
# 查看容器状态（应显示两个容器均为 healthy/running）
docker compose ps

# 测试健康检查
curl -s http://localhost/api/health
# 应返回: {"status":"ok","timestamp":"..."}

# 测试 HTTPS（通过域名）
curl -sI https://www.summagraph.com/
# 应返回: HTTP/2 200
```

#### 日常运维命令

```bash
# 查看所有容器状态
docker compose ps

# 查看实时日志（所有服务）
docker compose logs -f

# 只看应用日志
docker compose logs -f summagraph

# 只看 Nginx 日志
docker compose logs -f nginx

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart summagraph
docker compose restart nginx

# 停止所有服务
docker compose down

# 更新代码后重新构建并启动
git pull
docker compose up -d --build

# 修改 api_config.py 后重启（无需重新构建，因为是 volume 挂载）
docker compose restart summagraph

# 重新加载 Nginx 配置（无需重启容器）
docker exec summagraph-nginx nginx -t && docker exec summagraph-nginx nginx -s reload

# 进入应用容器排查问题
docker exec -it summagraph /bin/bash

# 清理旧镜像释放磁盘
docker image prune -f
```

#### SSL 证书续期

Let's Encrypt 证书有效期 90 天，certbot 安装后会自动设置定时任务续期。

```bash
# 手动续期（需先停止 Nginx 释放端口 80）
docker compose stop nginx
certbot renew
docker compose start nginx

# 检查证书到期时间
certbot certificates

# 也可设置 crontab 自动续期
# 编辑 crontab: crontab -e
# 添加以下行（每月 1 日凌晨 3 点自动续期）:
# 0 3 1 * * cd /root/summagraph && docker compose stop nginx && certbot renew --quiet && docker compose start nginx
```

---

### 方式二：手动部署（PM2）

适合不使用 Docker 的场景。

#### 前置要求

- Node.js >= 18.x
- Python 3.x + pip
- PM2（会自动安装）

#### 步骤

```bash
# 1. 克隆项目
git clone <your-repo-url> summagraph
cd summagraph

# 2. 配置 API Key
vim api_config.py

# 3. 配置环境变量
cp .env.production.example .env
vim .env

# 4. 安装 Python 依赖
pip install volcengine-python-sdk[ark] requests

# 5. 一键部署
chmod +x deploy.sh
./deploy.sh
```

#### PM2 管理命令

```bash
pm2 status              # 查看状态
pm2 logs summagraph     # 查看日志
pm2 restart summagraph  # 重启
pm2 stop summagraph     # 停止

# 设置开机自启
pm2 startup
pm2 save
```

---

### 项目文件说明

```
summagraph/
├── docker-compose.yml         # Docker Compose 编排（应用 + Nginx）
├── Dockerfile                 # 应用镜像构建
├── nginx/
│   └── default.conf           # Nginx 反向代理配置（支持 Cloudflare）
├── api_config.py              # API Key 配置（⚠️ 不要提交到公开仓库）
├── requirements.txt           # Python 依赖
├── outputs/                   # 生成的图片（持久化挂载）
└── logs/                      # 应用日志（持久化挂载）
```

### 关键配置说明

| 配置项 | 文件 | 说明 |
|--------|------|------|
| API Key | `api_config.py` | LLM 和 T2I 的 API 密钥（volume 挂载，修改后重启即生效） |
| T2I 后端 | `api_config.py` | `T2I_BACKEND`: `"doubao"` 或 `"banana"` |
| 生成模式 | `docker-compose.yml` | `MOCK_GENERATION`: `false`（真实）/ `true`（模拟） |
| Nginx 配置 | `nginx/default.conf` | 反向代理规则，修改后执行 `docker exec summagraph-nginx nginx -s reload` |
| SSL 证书 | `/etc/letsencrypt/live/summagraph.com/` | Let's Encrypt 证书，由 certbot 管理 |
| Cloudflare | Cloudflare Dashboard | SSL 模式须为 **Flexible**（或改为 Full 后调整 Nginx 配置） |

### 常见部署问题

#### Q: `docker compose up -d` 构建失败，提示 Python 包找不到？
A: 确保 `requirements.txt` 中使用 `volcengine-python-sdk[ark]>=5.0.0`（不是 `volcenginesdkarkruntime`）。

#### Q: 域名访问出现 ERR_TOO_MANY_REDIRECTS（重定向循环）？
A: 这是 Cloudflare SSL 模式与 Nginx 配置不匹配导致的。Cloudflare 使用 Flexible SSL 时，以 HTTP 连接源站，所以 Nginx 在端口 80 上**不能**做 HTTP→HTTPS 重定向，必须直接代理到应用。检查 `nginx/default.conf` 中端口 80 的 server 块是否直接 `proxy_pass` 而非 `return 301`。

#### Q: 通过 IP 可以访问但域名不行？
A: 检查 Cloudflare DNS 是否已正确配置，确认 DNS 记录指向服务器 IP。

#### Q: SSL 证书过期了怎么办？
A: 运行 `docker compose stop nginx && certbot renew && docker compose start nginx`。

#### Q: 修改了 api_config.py 后需要重新构建镜像吗？
A: 不需要。`api_config.py` 通过 Docker volume 挂载，只需 `docker compose restart summagraph` 即可。

### 安全注意事项

- **API Key 安全**：`api_config.py` 包含密钥，已在 `.gitignore` 中，确保不要提交到公开仓库
- **HTTPS**：Cloudflare 负责面向用户的 HTTPS，源站也配有 Let's Encrypt 证书作为双重保障
- **防火墙**：只暴露 80/443 端口，应用端口 3001 仅在 Docker 内部网络中通信，不对外暴露
- **日志**：定期检查 `logs/` 目录中的错误日志
- **证书续期**：建议设置 crontab 自动续期 Let's Encrypt 证书

## 许可证

本项目遵循 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**SummaGraph** - 让信息可视化变得简单优雅
