# ✅ baoyu-infographic Skill 正确使用方法

## ❌ 错误的使用方式

```bash
# 这些都不起作用：
/baoyu-infographic
/baoyu-infographic file.md
/skill baoyu-infographic
```

## ✅ 正确的使用方式

### 方式1：在Claude Code对话中（推荐）

直接在对话中告诉我要生成infographic，例如：

```
请用baoyu-infographic skill为我生成一个信息图，内容是：
[你的内容]

要求：
- 布局：linear-progression
- 风格：technical-schematic
- 语言：中文
```

**我会自动使用 Skill 工具调用该skill。**

### 方式2：直接提供文件路径

如果你已经准备好了markdown文件，直接告诉我：

```
使用baoyu-infographic skill处理这个文件：/path/to/your/content.md
使用linear-progression布局和technical-schematic风格
```

## 🎯 给Summagraph项目的实际方案

由于这个skill只能在Claude Code对话环境中使用，我为你的Web应用创建了以下方案：

### 当前实现（Mock数据）✅

你的Summagraph网站已经可以运行：
```bash
npm run dev:all
# 访问 http://localhost:3000
# 完整测试所有功能（使用占位图像）
```

### 集成真实skill的步骤

**Step 1: 准备内容文件**

在 `server/generator.js` 中创建临时文件：

```javascript
import fs from 'fs';
import path from 'path';

export async function generateInfographics({ text, style, layout, imageCount, language }) {
  // 创建临时文件
  const tempDir = '/tmp/infographic-requests';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const timestamp = Date.now();
  const tempFile = path.join(tempDir, `request-${timestamp}.md`);
  fs.writeFileSync(tempFile, text);

  // 返回文件路径，告诉用户在Claude Code中使用
  return {
    success: true,
    requiresManualAction: true,
    message: `请在Claude Code对话中粘贴以下指令：

使用baoyu-infographic skill生成信息图
文件路径：${tempFile}
布局：${layout}
风格：${style}
语言：${language}`,
    tempFile
  };
}
```

**Step 2: 用户工作流**

1. 用户在Web界面输入内容并提交
2. 后端保存内容到临时文件
3. 返回指令给用户
4. 用户在Claude Code对话中粘贴指令
5. skill生成图像并保存到本地
6. 用户将生成的图像上传到Web应用查看

## 📋 可用的布局和风格

### 布局 (Layout)
- `linear-progression` - 时间线/流程
- `binary-comparison` - A vs B对比
- `bento-grid` - 多主题网格
- `hierarchical-layers` - 层级结构
- `funnel` - 漏斗/转化
- `dashboard` - 仪表板
- 等20种选项...

### 风格 (Style)
- `craft-handmade` - 手工艺（默认）
- `corporate-memphis` - 企业扁平
- `technical-schematic` - 技术蓝图
- `kawaii` - 可爱卡哇伊
- `cyberpunk-neon` - 赛博朋克
- 等17种选项...

完整列表见：`~/.claude/plugins/cache/baoyu-skills/content-skills/0e571b72fb71/skills/baoyu-infographic/SKILL.md`

## 🚀 现在就测试

**1. 测试当前Web应用（Mock实现）**
```bash
npm run dev:all
# 打开 http://localhost:3000
```

**2. 测试真实skill生成**

在对话中直接告诉我：

> "请使用baoyu-infographic skill为我生成一个关于人工智能发展的信息图，使用linear-progression布局和technical-schematic风格，内容保存在/tmp/test-infographic.md"

我会立即为你生成！

## 💡 重要说明

- ✅ Skill已经正确安装
- ✅ Skill可以正常工作（通过Skill工具）
- ❌ 不能使用 `/baoyu-infographic` 命令
- ✅ 只能通过对话请求我使用Skill工具调用

**最简单的使用方式：直接在对话中告诉你要生成信息图，我会帮你调用skill！**
