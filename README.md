# summagraph

一个简易的 Infographic 生成器：输入文本 → LLM 总结 → 文生图生成信息图。

## 快速开始

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

配置 API（`api_config.py`）：

```python
LLM_CONFIG = {
    "api_key": "YOUR_DOUBAO_LLM_API_KEY",
    "model": "doubao-pro-32k",
    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
}

T2I_CONFIG = {
    "api_key": "YOUR_DOUBAO_T2I_API_KEY",
    "model": "doubao-t2i",
    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
    "size": "1024x1024",
}
```

如本地没有 references 目录，可在 `api_config.py` 中配置：

```python
REFERENCE_CONFIG = {
    "references_dirs": [
        "你的 references 路径",
    ]
}
```

启动服务：

```bash
python app.py
```

浏览器访问：`http://localhost:8000`
