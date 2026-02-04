# LLM Prompts for Summagraph

# Analysis Prompt
INFOGRAPHIC_ANALYSIS_PROMPT = """你是一位世界级的教学设计师和信息图专家。你的任务是将用户提供的源文本转换成结构化的信息图设计方案。

### 核心原则
1. **数据原样保留**：所有的统计数据、引用和关键术语必须原封不动地保留，不得概括或改写数字。
2. **视觉思维**：不仅是总结文字，要思考如何将信息分块并转化为视觉元素（如图表、图标、层级）。
3. **教学设计**：定义清晰的学习目标，确保信息图能帮助用户快速理解核心概念。

### 输出要求
请只返回一个严格的 JSON 对象，包含以下字段（所有内容使用{lang}）：
- "title": 一个吸引人且准确的标题
- "analysis_markdown": 参照以下框架进行分析：
  - 学习目标（viewer will understand...）
  - 核心数据点（原样列出）
  - 视觉机会映射（哪些部分可以图形化）
- "structured_content_markdown": 参照以下模板进行结构化：
  - Overview
  - 各个 Section（每个 Section 包含 Key Concept, Content(verbatim), Visual Element 描述, Text Labels）
- "text_labels": 数组，包含要在图中直接显示的短文本（标题、标签、关键数值等）

### 用户源文本：
{source}
"""

# Image Generation Base Prompt Template
# This combines layout, style, and content into a final prompt for the image generation model
IMAGE_GENERATION_TEMPLATE = """
Create a professional infographic following these specifications:

## Image Specifications

- **Type**: Infographic
- **Layout**: {layout}
- **Style**: {style}
- **Aspect Ratio**: {aspect}
- **Language**: {language}

## Core Principles

- Follow the layout structure precisely for information architecture
- Apply style aesthetics consistently throughout
- If content involves sensitive or copyrighted figures, create stylistically similar alternatives
- Keep information concise, highlight keywords and core concepts
- Use ample whitespace for visual clarity
- Maintain clear visual hierarchy

## Text Requirements

- All text must match the specified style treatment
- Main titles should be prominent and readable
- Key concepts should be visually emphasized
- Labels should be clear and appropriately sized
- Use the specified language for all text content

## Layout Guidelines

{layout_guidelines}

## Style Guidelines

{style_guidelines}

---

Generate the infographic based on the content below:

{content}

Text labels (in {language}):
{text_labels}
"""
