# Summagraph - 使用说明

## 项目已成功创建！✅

Summagraph 是一个现代化的web应用，可以将用户输入的文字转换为精美的infographic图像。

## 🎯 功能特性

- ✨ **简洁高级的UI设计** - 采用现代科技感的设计风格
- 🎨 **多种视觉风格** - 支持极简、现代、活泼、专业四种风格
- 📐 **灵活的布局选项** - 垂直滚动、网格布局、故事格式
- 🔢 **自定义图像数量** - 可生成1-9张图像
- 🌍 **多语言支持** - 支持英文和中文
- ⚡ **实时加载状态** - 优雅的加载动画和进度提示
- 📥 **便捷下载功能** - 单张下载或批量下载

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器

方式一：同时启动前端和后端（推荐）
```bash
npm run dev:all
```

方式二：分别启动
```bash
# 终端1 - 启动前端（端口3000）
npm run dev

# 终端2 - 启动后端API（端口3001）
npm run server
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
summagraph/
├── src/
│   ├── components/
│   │   ├── InputForm.tsx       # 输入表单组件
│   │   ├── LoadingState.tsx    # 加载状态组件
│   │   └── ResultsDisplay.tsx  # 结果展示组件
│   ├── services/
│   │   └── api.ts              # API服务
│   ├── types.ts                # TypeScript类型定义
│   ├── App.tsx                 # 主应用组件
│   ├── main.tsx                # 入口文件
│   └── index.css               # 全局样式
├── server/
│   ├── index.js                # Express服务器
│   └── generator.js            # 图像生成逻辑
├── public/                     # 静态资源
├── package.json
└── vite.config.ts
```

## 🎨 设计特点

### 视觉风格
- 深色主题（Slate 900背景）
- 毛玻璃效果（Glass morphism）
- 渐变色彩（Primary blue）
- 流畅的动画过渡

### 组件设计
- **InputForm**: 直观的表单界面，包含所有配置选项
- **LoadingState**: 动态加载动画，实时显示进度
- **ResultsDisplay**: 网格布局展示结果，支持交互操作

## 🔧 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式方案**: Tailwind CSS 3
- **后端服务**: Express.js + Node.js
- **图像生成**: baoyu-xhs-images skill集成

## 📝 API集成说明

当前项目中，`/server/generator.js` 包含了图像生成的逻辑。目前使用的是模拟实现（mock implementation），返回的是占位图像。

要集成真实的 `baoyu-xhs-images` skill，需要：

1. 在 `server/generator.js` 中取消注释真实实现部分
2. 配置相应的API密钥和环境变量
3. 根据skill的API文档调整请求参数

示例集成代码已在 `generator.js` 中以注释形式提供。

## 🏗️ 生产环境部署

### 构建项目
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

### 部署注意事项

1. **前端部署**：
   - 构建后的文件在 `dist/` 目录
   - 可以部署到任何静态托管服务（Vercel, Netlify等）

2. **后端部署**：
   - 需要部署到Node.js环境
   - 配置环境变量（端口、API密钥等）
   - 确保CORS配置正确

3. **域名配置**：
   - 更新前端API请求地址为生产环境URL
   - 在 `src/App.tsx` 中修改 `fetch('/api/generate')` 的base URL

## 🐛 开发提示

### 添加新的视觉风格
编辑 `src/components/InputForm.tsx` 中的 `STYLES` 数组

### 添加新的布局选项
编辑 `src/components/InputForm.tsx` 中的 `LAYOUTS` 数组

### 修改主题颜色
编辑 `tailwind.config.js` 中的 `colors.primary` 配置

## 📄 许可证

MIT License

## 🌐 网站

[www.summagraph.com](https://www.summagraph.com)

---

**祝您使用愉快！** 🎉
