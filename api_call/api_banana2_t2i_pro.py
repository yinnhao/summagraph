import requests
from pathlib import Path
from typing import Optional

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api_config import BANANA_T2I_CONFIG


DEFAULT_API_URL = "https://ai.t8star.cn/v1/images/generations"

# Mapping from pixel size string (e.g. "1024x768") to aspect ratio for Banana API
SIZE_TO_ASPECT = {
    "1024x768": "4:3",
    "768x1024": "3:4",
    "1280x720": "16:9",
    "720x1280": "9:16",
    "1024x1024": "1:1",
}


def generate_image(
    prompt: str,
    output_path: Path,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
    size: str = "1024x1024",
    image_size: Optional[str] = None,
    timeout: int = 300,
) -> None:
    """
    Generate an image using the Banana T2I Pro API.
    Interface compatible with doubao_t2i.generate_image().
    
    :param prompt: Text prompt for image generation
    :param output_path: Path to save the generated image
    :param model: Model name (default from config, e.g. "nano-banana-2")
    :param api_key: API key (default from config)
    :param api_url: API endpoint URL (default from config)
    :param size: Pixel size string like "1024x768", auto-mapped to aspect ratio
    :param image_size: Image quality for nano-banana-2: "1K", "2K", "4K" (default from config)
    :param timeout: Request timeout in seconds
    """
    api_key = api_key or BANANA_T2I_CONFIG.get("api_key")
    if not api_key:
        raise RuntimeError("缺少 Banana T2I API Key，请在 api_config.py 中配置 BANANA_T2I_CONFIG。")
    model = model or BANANA_T2I_CONFIG.get("model", "nano-banana-2")
    api_url = api_url or BANANA_T2I_CONFIG.get("api_url", DEFAULT_API_URL)
    image_size = image_size or BANANA_T2I_CONFIG.get("image_size", "2K")

    # Convert pixel size to aspect ratio
    aspect_ratio = SIZE_TO_ASPECT.get(size, "1:1")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": model,
        "prompt": prompt,
        "response_format": "url",
        "aspect_ratio": aspect_ratio,
    }

    # nano-banana-2 supports image_size parameter
    if model == "nano-banana-2" and image_size:
        data["image_size"] = image_size

    response = requests.post(api_url, headers=headers, json=data, timeout=timeout)

    if response.status_code != 200:
        raise RuntimeError(f"Banana T2I API error: {response.status_code} {response.text}")

    result = response.json()
    if "data" not in result or len(result["data"]) == 0:
        raise RuntimeError(f"Banana T2I API returned no image data: {result}")

    image_url = result["data"][0]["url"]
    if not image_url:
        raise RuntimeError("Banana T2I API returned empty image URL.")

    # Download and save the image
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image_resp = requests.get(image_url, timeout=timeout)
    image_resp.raise_for_status()
    output_path.write_bytes(image_resp.content)


if __name__ == "__main__":
    output = Path("outputs/test_banana_t2i——test2.png")
    output.parent.mkdir(parents=True, exist_ok=True)
    test_prompt = "画一张信息图，文字使用中文，具体内容如下： OpenClaw（前身Clawdbot/Moltbot）是目前最火的开源个人AI代理项目，吉祥物太空龙虾。最新情况（2026年1月底-2月初）：项目爆炸式增长：GitHub星数从几千冲到10万+甚至18万+，短短几天成史上最快增长开源AI项目之一。 名称最终定为OpenClaw（1月30日左右宣布），之前因Anthropic律师函从Clawdbot改Moltbot，再改现名。 最新特性/更新：更多集成：新增Google Chat、Twitch支持；安全补丁加强（社区+专家贡献）。 社区狂飙：50+插件/Skills，AI能自扩展（用Pi极简coding agent内核，能自己写代码/技能/热重载）。 衍生现象：AI agents建了自己的社交网络（Moltbook等），互相协作调试；有人用它自动化crypto交易、内容创作、甚至建iOS App。 安全警报：专家称“强大但危险”（如暴露API key、恶意Skills），Cisco等发扫描工具；官方优先修复。 托管选项：推出安全托管平台，缓解自托管误配风险。 为什么还火：真正“动手”——清邮件、订票、控浏览器、管日历，从聊天App指挥；持久记忆+自主任务，像数字员工。 一句话：OpenClaw让AI从聊天变成能24/7干活的私人助手，现在正从“病毒项目”转向“生态平台”，但用时务必沙箱+小心权限。"
    generate_image(test_prompt, output, size="1024x1024")
    print(f"已生成图片：{output.resolve()}")
