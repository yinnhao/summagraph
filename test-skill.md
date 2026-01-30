# 如何测试 baoyu-infographic Skill

## 问题说明
`baoyu-infographic` skill只能在Claude Code对话环境中通过Skill工具调用，不能直接在后端Node.js服务器中使用。

## 解决方案

### 方案1：在Claude Code中测试Skill（推荐）

在Claude Code对话中直接使用以下命令：

```
/skill content-skills:baoyu-infographic
```

然后提供你的文本内容和参数。

### 方案2：集成真实API（生产环境）

根据baoyu-infographic skill的底层API文档，需要：

1. 获取API访问权限
2. 在server/generator.js中配置API调用
3. 处理API返回的图像数据

### 方案3：使用当前Mock实现（开发测试）

当前的mock实现返回随机占位图像，适合：
- 前端UI开发
- 用户流程测试
- 布局和样式验证

## 当前项目状态

✅ 前端完全实现
✅ 后端API结构完整
✅ 使用mock数据可以完整测试用户流程
⏳ 等待集成真实的baoyu-infographic API

## 下一步

要集成真实的infographic生成，需要：
1. 确认baoyu-infographic skill的API访问方式
2. 获取必要的API密钥或认证
3. 更新server/generator.js实现真实API调用
