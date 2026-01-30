# 为什么出现 "Unknown skill" 错误及解决方案

## 🔍 问题原因

你遇到的错误是因为：
1. ✅ `baoyu-infographic` skill **已经安装**
2. ❌ 但这个skill **只能在Claude Code对话环境**中通过 `/skill` 命令使用
3. ❌ **不能直接**在你的Web后端服务器（Node.js/Express）中调用

## 📌 正确的使用方式

### 方式1：在Claude Code对话中使用（适合测试）

直接在对话中输入：
```
/skill content-skills:baoyu-infographic
```

然后粘贴你的文本内容，skill会：
1. 分析内容
2. 推荐布局和风格组合
3. 生成infographic图像
4. 保存到本地文件

### 方式2：通过代理服务器集成到Web应用（推荐用于生产）

我已经为你创建了 `proxy-server.cjs`，这是一个运行在Claude Code环境中的代理服务器。

#### 设置步骤：

**1. 启动代理服务器**
```bash
# 在Summagraph项目目录下
node proxy-server.cjs
```

输出示例：
```
🎨 baoyu-infographic Proxy Server
📡 Running on: http://localhost:3002
🔗 Health check: http://localhost:3002/health
✅ Ready to accept requests!
```

**2. 修改你的主后端服务器**

更新 `server/generator.js`：

```javascript
export async function generateInfographics({ text, style, layout, imageCount, language }) {
  try {
    // Map frontend options to skill parameters
    const styleMap = {
      'minimalist': 'craft-handmade',
      'modern': 'corporate-memphis',
      'playful': 'kawaii',
      'professional': 'technical-schematic'
    };

    const layoutMap = {
      'vertical': 'linear-progression',
      'grid': 'bento-grid',
      'story': 'story-mountain'
    };

    const skillStyle = styleMap[style] || 'craft-handmade';
    const skillLayout = layoutMap[layout] || 'bento-grid';

    // Call proxy server
    const response = await fetch('http://localhost:3002/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        layout: skillLayout,
        style: skillStyle,
        aspect: 'portrait',
        language
      })
    });

    const result = await response.json();

    if (result.success) {
      // Return image URLs
      return {
        success: true,
        images: [{
          url: `http://localhost:3002${result.data.imageUrl}`,
          index: 0
        }]
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Generator error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**3. 启动完整系统**

在三个不同的终端中：

```bash
# 终端1: 代理服务器（必须运行在Claude Code环境）
node proxy-server.cjs

# 终端2: 主后端服务器
npm run server

# 终端3: 前端开发服务器
npm run dev
```

## 🎨 baoyu-infographic Skill 参数说明

### 布局选项 (Layout)
- `linear-progression` - 时间线、流程
- `binary-comparison` - A vs B对比
- `comparison-matrix` - 多因素比较
- `hierarchical-layers` - 层级结构
- `bento-grid` - 多主题网格（默认）
- `venn-diagram` - 韦恩图
- `funnel` - 漏斗/转化
- `dashboard` - 仪表板
- 等20种选项...

### 风格选项 (Style)
- `craft-handmade` - 手工艺风格（默认）
- `corporate-memphis` - 企业扁平风格
- `kawaii` - 可爱卡哇伊
- `technical-schematic` - 技术蓝图
- `cyberpunk-neon` - 赛博朋克霓虹
- `chalkboard` - 黑板粉笔
- 等17种选项...

### 宽高比 (Aspect)
- `landscape` - 横向 (16:9)
- `portrait` - 纵向 (9:16)
- `square` - 正方形 (1:1)

## ⚠️ 重要限制

1. **代理服务器必须运行在Claude Code环境中**
   - 因为只有那里才能访问 `/skill` 命令

2. **每次生成需要时间**
   - skill需要分析内容、生成prompt、调用图像生成
   - 通常需要30-120秒

3. **生成的图像保存在本地**
   - 默认在 `infographic/` 目录
   - 需要通过HTTP服务访问

## 🚀 快速测试

**1. 测试skill是否可用：**
在Claude Code对话中输入：
```
/skill content-skills:baoyu-infographic
```

**2. 测试代理服务器：**
```bash
# 启动代理服务器
node proxy-server.cjs

# 在另一个终端测试
curl -X POST http://localhost:3002/api/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"测试内容","layout":"bento-grid","style":"craft-handmade"}'
```

**3. 测试完整Web应用：**
```bash
# 启动所有服务
npm run dev:all
```

## 📚 更多资源

- Skill文档：`~/.claude/plugins/cache/baoyu-skills/content-skills/*/skills/baoyu-infographic/`
- 布局参考：`references/layouts/`
- 风格参考：`references/styles/`

## ❓ 常见问题

**Q: 为什么不直接在后端调用skill？**
A: Skill只能在Claude Code环境中通过命令行接口使用。

**Q: 可以部署到生产环境吗？**
A: 需要一个运行Claude Code的服务器，或者找到skill的底层API直接调用。

**Q: 有其他替代方案吗？**
A: 可以使用DALL-E、Midjourney等图像生成API直接集成。

需要帮助实现哪个部分？请告诉我！
