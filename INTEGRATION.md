# Summagraph × baoyu-infographic 集成指南

## 🎯 核心问题

`baoyu-infographic` skill只能在Claude Code环境中通过 `/skill` 命令调用，不能直接在Web后端API中使用。

## ✅ 当前解决方案

### 方案A：使用Mock实现（当前，用于开发测试）

**优点：**
- ✅ 完整的前端UI测试
- ✅ 用户流程验证
- ✅ 快速迭代开发

**缺点：**
- ❌ 使用占位图像（Picsum）
- ❌ 不是真实的infographic生成

**当前状态：** 已实现，可以运行 `npm run dev:all` 测试完整流程

---

## 🚀 生产环境解决方案

### 方案1：创建Claude Code代理服务（推荐）

在Claude Code环境中运行一个代理服务器，可以调用baoyu-infographic skill：

```javascript
// proxy-server.js - 在Claude Code环境中运行
import express from 'express';
import { exec } from 'child_process';

const app = express();
app.use(express.json());

app.post('/api/generate-infographic', async (req, res) => {
  const { text, layout, style, aspect, language } = req.body;

  // 1. 将text保存为临时文件
  const tempFile = `/tmp/temp-${Date.now()}.md`;
  fs.writeFileSync(tempFile, text);

  // 2. 调用baoyu-infographic skill
  const command = `/baoyu-infographic ${tempFile} --layout ${layout} --style ${style} --aspect ${aspect} --lang ${language}`;

  try {
    const { stdout, stderr } = await execAsync(command);
    // 3. 返回生成的图像路径
    res.json({ success: true, imagePath: extractImagePath(stdout) });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(3002);
```

**部署步骤：**
1. 在Claude Code环境中启动代理服务器
2. 你的主后端服务器调用这个代理服务器
3. 代理服务器调用baoyu-infographic skill

---

### 方案2：直接集成底层图像生成API

baoyu-infographic skill实际上调用了图像生成API。你可以：

1. 查看skill的源码：
   ```bash
   cat ~/.claude/plugins/cache/baoyu-skills/content-skills/*/skills/baoyu-infographic/skill.js
   ```

2. 找到它使用的图像生成服务

3. 在你的后端直接调用该API

---

### 方案3：使用Claude API或类似的图像生成服务

如果你有访问权限，可以：
- 使用DALL-E API
- 使用Midjourney API
- 使用其他AI图像生成服务

---

## 📝 当前项目使用说明

### 开发测试（当前可用）

```bash
# 1. 启动开发服务器
npm run dev:all

# 2. 访问 http://localhost:3000

# 3. 测试完整流程
- 输入文字
- 选择选项
- 点击生成
- 查看结果（使用占位图像）
```

### 集成真实生成（需要额外配置）

**选项1：修改后端generator.js**

```javascript
// server/generator.js
export async function generateInfographics({ text, style, layout, imageCount, language }) {
  // 调用代理服务器或直接API
  const response = await fetch('http://localhost:3002/api/generate-infographic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, style, layout, imageCount, language })
  });

  return await response.json();
}
```

**选项2：使用Claude Code手动生成**

1. 在Claude Code对话中使用 `/skill content-skills:baoyu-infographic`
2. 按照skill提示提供内容
3. 获取生成的图像
4. 手动上传到你的应用

---

## 🎨 baoyu-infographic Skill 参数映射

Summagraph选项 → Skill参数：

| Summagraph | baoyu-infographic |
|-----------|-------------------|
| 极简风格 | craft-handmade, ikea-manual |
| 现代风格 | corporate-memphis, bold-graphic |
| 活泼风格 | kawaii, claymation |
| 专业风格 | technical-schematic, aged-academia |
| 垂直布局 | portrait |
| 网格布局 | bento-grid |
| 故事格式 | linear-progression, story-mountain |

完整映射见：`~/.claude/plugins/cache/baoyu-skills/content-skills/*/skills/baoyu-infographic/`

---

## 🚀 下一步行动

1. **立即可用：** 使用当前mock实现完成前端开发和测试
2. **短期方案：** 设置Claude Code代理服务器
3. **长期方案：** 直接集成底层API或使用生产级图像生成服务

需要帮助实现哪个方案？请告诉我！
