#!/bin/bash
# Infographic生成脚本
# 使用方法: ./generate-infographic.sh "内容" [布局] [风格] [语言]

CONTENT="$1"
LAYOUT="${2:-bento-grid}"
STYLE="${3:-craft-handmade}"
LANGUAGE="${4:-zh}"
ASPECT="${5:-portrait}"

# 创建临时文件
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEMP_FILE="/tmp/infographic-input-${TIMESTAMP}.md"

# 写入内容
echo "$CONTENT" > "$TEMP_FILE"

# 调用Claude Code API（需要在Claude Code环境中运行）
# 注意：这需要通过Claude Code的Skill工具调用

echo "✅ 已准备内容: $TEMP_FILE"
echo "📋 布局: $LAYOUT"
echo "🎨 风格: $STYLE"
echo "🌐 语言: $LANGUAGE"
echo "📐 宽高比: $ASPECT"
echo ""
echo "⚠️  请在Claude Code对话中使用以下命令："
echo "/baoyu-infographic $TEMP_FILE --layout $LAYOUT --style $STYLE --lang $LANGUAGE --aspect $ASPECT"
