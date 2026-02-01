import requests
import json

# API 地址
url = "https://ai.t8star.cn/v1/images/generations"

headers = {
    "Authorization": "Bearer sk-ne669OybjeDNXB8zHoBF2cC2g7iGtvcgBGF5fbmGLaKZsJFe",
    "Content-Type": "application/json"
}


def save_image_from_url(tar_img_file: str, url: str):
    """从 URL 下载图片并保存"""
    resp = requests.get(url)
    assert resp.status_code == 200, f"{resp.status_code}, {resp.text}"
    if resp.status_code == 200:
        with open(tar_img_file, "wb") as f:
            f.write(resp.content)
        print(f"✅ Image saved to {tar_img_file}")
    else:
        print(f"Download failed: {resp.status_code}")

def generate_image(prompt: str, tar_img_file: str, model="nano-banana-2", aspect_ratio="9:16", image_size="1K", images=None):
    """
    文生图调用
    :param prompt: 提示词
    :param tar_img_file: 保存的文件路径
    :param model: 模型名称, 可选 nano-banana, nano-banana-hd, nano-banana-2
    :param aspect_ratio: 图片比例 (4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 1:1, 4:5, 5:4, 21:9)
    :param image_size: 图片质量, 仅 nano-banana-2 支持: 1K, 2K, 4K
    :param images: 参考图数组 (可选), URL 或 base64
    """
    # 构建请求体
    data = {
        "model": model,
        "prompt": prompt,
        "response_format": "url",  # 可选值: url 或 b64_json
        "aspect_ratio": aspect_ratio
    }

    # 处理 nano-banana-2 特有的参数
    if model == "nano-banana-2":
        if image_size:
            data["image_size"] = image_size
    
    # 参考图
    if images:
        data["image"] = images

    # 发送 POST 请求 (JSON 格式)
    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        if 'data' in result and len(result['data']) > 0:
            image_url = result['data'][0]['url']
            save_image_from_url(tar_img_file, image_url)
        else:
            print("No image data found in response:", result)
    else:
        print("Error:", response.status_code, response.text)
        return None


if __name__ == "__main__":
    # 文生图示例调用
    # prompt = "Cinematic shot, back view of Santa Claus standing on a snowy rooftop at night, heavy snow storm, carrying a massive heavy sack, exhausted posture, gloomy atmosphere, cold blue and dark teal lighting, cyberpunk city background in distance, hyper-realistic, 8k, movie still "
    # prompt = "电影级镜头，一个胖乎乎的圣诞老人背影，穿着毛绒绒的红色经典圣诞服，背着一个巨大的塞满礼物的红袋子。他站在覆盖着厚厚白雪的屋顶上，一只脚正准备跨进红砖烟囱里。周围是宁静的冬夜，天空中有一轮满月和璀璨星空，屋顶的积雪反射着月光，窗户里透出温馨的暖黄色灯光。画面风格为写实风格，光影细腻，8k分辨率，极度治愈，节日氛围浓厚。"
    prompt = """Create a professional infographic following these specifications:

## Image Specifications

- **Type**: Infographic
- **Layout**: bento-grid
- **Style**: craft-handmade
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

# craft-handmade (DEFAULT)

Hand-drawn and paper craft aesthetic with warm, organic feel.

## Color Palette

- Primary: Warm pastels, soft saturated colors, craft paper tones
- Background: Light cream (#FFF8F0), textured paper (#F5F0E6)
- Accents: Bold highlights, construction paper colors

## Variants

| Variant | Focus | Visual Emphasis |
|---------|-------|-----------------|
| **Hand-drawn** | Cartoon illustration | Simple icons, slightly imperfect lines |
| **Paper-cutout** | Layered paper craft | Drop shadows, torn edges, texture |

## Visual Elements

- Hand-drawn or cut-paper quality
- Organic, slightly imperfect shapes
- Layered depth with shadows (paper variant)
- Simple cartoon elements and icons
- Character illustrations (people, personalities in cartoon form)
- Ample whitespace, clean composition
- Keywords and core concepts highlighted
- **Strictly hand-drawn—no realistic or photographic elements**

## Style Enforcement

- All imagery must maintain cartoon/illustrated aesthetic
- Replace real photos or realistic figures with hand-drawn equivalents
- Maintain consistent line weight and illustration style throughout

## Typography

- Hand-drawn or casual font style
- Clear, readable labels
- Keywords emphasized with larger/bolder text
- Cut-out letter style for paper variant

## Best For

Educational content, general explanations, friendly infographics, children's content, playful hierarchies

---

Generate the infographic based on the content below:

## Overview
2026年两大核心对比梗，分别从「面对世界崩坏的态度」和「创作方式的冲突」两个维度，探讨极致对立下的社会情绪共鸣。

## Section 1：林黛玉 vs. 卡皮巴拉
### Key Concept
「精神离家出走」vs「肉体强制待机」
### Content（verbatim）
2026年新梗核心：「精神离家出走」vs「肉体强制待机」。升级点：不再只是情绪稳定，而是探讨面对世界崩坏时的两种极致态度。画面感：林黛玉在焚稿断痴情，哭得梨花带雨；卡皮巴拉头顶着一个橘子，在温水里一动不动，眼神涣散。核心Game点（冲突）：林黛玉（极度敏感）：这里的每一片落花都在刺痛我的心！卡皮巴拉（极度钝感）：（嚼草）……啊？世界末日了吗？哦，那再泡五分钟。弹幕预判：「演我精神状态的两位祖宗。」
### Visual Element描述
左侧：林黛玉坐于案前焚稿，周围散落花瓣，面部带泪（梨花带雨效果）；右侧：卡皮巴拉浸在温水池，头顶放橘子，眼神涣散，嘴中嚼草。左右画面用虚线分隔，强化对比。
### Text Labels
核心冲突对话、弹幕预判、梗核心短语

## Section 2：达芬奇 vs. AI博主
### Key Concept
「人类手工最后的倔强」vs「电子垃圾制造者」
### Content（verbatim）
2026年新梗核心：「人类手工最后的倔强」vs「电子垃圾制造者」。升级点：2026年人们已经厌倦了完美的AI图，开始追求有瑕疵的「人味儿」。画面感：达芬奇满手油彩，在解剖尸体研究肌肉纹理；AI博主戴着Vision Pro眼镜，手指在虚空点两下，瞬间生成了1000张完美的蒙娜丽莎。核心Game点（冲突）：达芬奇：这微笑的角度我调整了三年。AI博主：家人们，这1000张图我都不满意，因为它们没有「灵魂的瑕疵感」，我得让AI加点噪点进去。弹幕预判：「赛博时代的买椟还珠。」
### Visual Element描述
左侧：达芬奇身着文艺复兴服饰，满手油彩，面前摆放解剖图与尸体模型，旁附「三年」时间标识；右侧：AI博主戴Vision Pro眼镜，虚空操作手势，身后浮现大量蒙娜丽莎图像，旁附「1000张」数量标识。左右画面用虚线分隔。
### Text Labels
核心冲突对话、弹幕预判、梗核心短语、关键数据（三年/1000张）

Text labels (in 中文):
- 2026年度爆梗对决
- 精神离家出走
- 肉体强制待机
- 林黛玉：这里的每一片落花都在刺痛我的心！
- 卡皮巴拉：（嚼草）……啊？世界末日了吗？哦，那再泡五分钟。
- 演我精神状态的两位祖宗。
- 人类手工最后的倔强
- 电子垃圾制造者
- 达芬奇：这微笑的角度我调整了三年。
- AI博主：家人们，这1000张图我都不满意，因为它们没有「灵魂的瑕疵感」，我得让AI加点噪点进去。
- 赛博时代的买椟还珠。
- 三年
- 1000张
- 2026
"""
    output_path = "test_nano_bn.png"
    
    generate_image(
        prompt=prompt, 
        tar_img_file=output_path, 
        model="nano-banana-2", 
        aspect_ratio="1:1", 
        image_size="2K"
    )