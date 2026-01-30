import base64
from pathlib import Path
from typing import Optional

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api_config import T2I_CONFIG
from volcenginesdkarkruntime import Ark


DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"


def generate_image(
    prompt: str,
    output_path: Path,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    size: str = "1024x1024",
    timeout: int = 120,
) -> None:
    api_key = api_key or T2I_CONFIG.get("api_key")
    if not api_key:
        raise RuntimeError("缺少 T2I API Key，请在 api_config.py 中配置。")
    model = model or T2I_CONFIG.get("model", "doubao-t2i")
    base_url = (base_url or T2I_CONFIG.get("base_url") or DEFAULT_BASE_URL).rstrip("/")
    size = size or T2I_CONFIG.get("size", "1024x1024")
    client = Ark(base_url=base_url, api_key=api_key, timeout=timeout)
    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
    )

    url = response.data[0].url
    print(f"Image URL: {url}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    import requests
    image_resp = requests.get(url, timeout=timeout)
    image_resp.raise_for_status()
    output_path.write_bytes(image_resp.content)

    if not url:
        raise RuntimeError("文生图返回结果为空，未生成图片。")


if __name__ == "__main__":
    output = Path("outputs/test_t2i.png")
    output.parent.mkdir(parents=True, exist_ok=True)
    test_prompt = "鱼眼镜头，一只猫咪的头部，画面呈现出猫咪的五官因为拍摄方式扭曲的效果。"
    generate_image(test_prompt, output, model="doubao-seedream-3-0-t2i-250415")
    print(f"已生成图片：{output.resolve()}")
