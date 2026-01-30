from typing import Optional

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api_config import LLM_CONFIG
from volcenginesdkarkruntime import Ark


DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"


def chat_completion(
    prompt: str,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 60,
) -> str:
    api_key = api_key or LLM_CONFIG.get("api_key")
    if not api_key:
        raise RuntimeError("缺少 LLM API Key，请在 api_config.py 中配置。")
    model = model or LLM_CONFIG.get("model", "doubao-pro-32k")
    base_url = (base_url or LLM_CONFIG.get("base_url") or DEFAULT_BASE_URL).rstrip("/")
    client = Ark(base_url=base_url, api_key=api_key, timeout=timeout)
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "你是严谨的内容编辑。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return completion.choices[0].message.content


if __name__ == "__main__":
    test_prompt = "请用一句话总结：信息图是一种将信息可视化的内容形式。"
    result = chat_completion(test_prompt)
    print(result)
