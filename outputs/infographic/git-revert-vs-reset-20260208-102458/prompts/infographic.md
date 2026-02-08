
Create a professional infographic following these specifications:

## Image Specifications

- **Type**: Infographic
- **Layout**: bento-grid
- **Style**: corporate-memphis
- **Aspect Ratio**: landscape
- **Language**: 中文

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

# bento-grid

Modular grid layout with varied cell sizes, like a bento box.

## Structure

- Grid of rectangular cells
- Mixed cell sizes (1x1, 2x1, 1x2, 2x2)
- No strict symmetry required
- Hero cell for main point
- Supporting cells around it

## Best For

- Multiple topic overview
- Feature highlights
- Dashboard summaries
- Portfolio displays
- Mixed content types

## Visual Elements

- Clear cell boundaries
- Varied cell backgrounds
- Icons or illustrations per cell
- Consistent padding/margins
- Visual hierarchy through size

## Text Placement

- Main title at top
- Cell titles within each cell
- Brief content per cell
- Minimal text, maximum visual
- CTA or summary in prominent cell

## Recommended Pairings

- `craft-handmade`: Friendly overviews (default)
- `corporate-memphis`: Business summaries
- `pixel-art`: Retro feature grids


## Style Guidelines

# corporate-memphis

Flat vector people with vibrant geometric fills

## Color Palette

- Primary: Bright, saturated - purple, orange, teal, yellow
- Background: White or light pastels
- Accents: Gradient fills, geometric patterns

## Visual Elements

- Flat vector illustration
- Disproportionate human figures
- Abstract body shapes
- Floating geometric elements
- No outlines, solid fills
- Plant and object accents

## Typography

- Clean sans-serif
- Bold headings
- Professional but friendly
- Minimal decoration

## Best For

Business presentations, tech products, marketing materials, corporate training


---

Generate the infographic based on the content below:

- Overview
  - Key Concept：Git中安全撤销代码的两种核心命令
  - Content：git revert通过创建新提交抵消旧改动，git reset移动HEAD指针改写历史
  - Visual Element：顶部标题栏+两个命令的图标（如revert用反向箭头，reset用回退箭头）
  - Text Labels：Git Revert vs Reset
- Section 1：git revert核心原理
  - Key Concept：通过新提交抵消旧改动
  - Content：假设提交历史是A→B→C，执行git revert B生成新提交D，历史变为A→B→C→D，D的状态=C的状态-B的改动
  - Visual Element：流程图展示提交链变化，用箭头和节点表示
  - Text Labels：提交历史、A→B→C、git revert B、生成D、A→B→C→D
- Section 2：git revert vs git reset对比
  - Key Concept：操作方式、历史记录、安全性、适用场景的区别
  - Content：
    |特性|git revert|git reset|
    |---|---|---|
    |操作方式|增加新提交抵消旧提交|移动HEAD指针丢弃提交|
    |历史记录|保留完整历史|抹除历史|
    |安全性|高|中/低|
    |适用场景|已推送远程分支|本地未推送分支|
  - Visual Element：左右分栏的对比表格，每一行用图标辅助
  - Text Labels：特性对比表
- Section 3：金律提示
  - Key Concept：远程分支必须用revert
  - Content：如果代码已推送到团队共享远程仓库，永远使用revert，reset会导致冲突
  - Visual Element：红色警告框+感叹号图标
  - Text Labels：金律：远程分支用revert，避免冲突

Text labels (in 中文):
- Git Revert vs Reset
- 提交历史
- A→B→C
- git revert B
- 生成D
- A→B→C→D
- 特性对比表
- 操作方式
- 历史记录
- 安全性
- 适用场景
- 增加新提交抵消旧提交
- 移动HEAD指针丢弃提交
- 保留完整历史
- 抹除历史
- 高
- 中/低
- 已推送远程分支
- 本地未推送分支
- 金律：远程分支用revert，避免冲突
