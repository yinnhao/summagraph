LLM_CONFIG = {
    "api_key": "64785b58-cc0c-4013-967c-e4c762f5f5ae",
    "model": "doubao-seed-1-6-251015",
    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
}

T2I_CONFIG = {
    "api_key": "64785b58-cc0c-4013-967c-e4c762f5f5ae",
    "model": "doubao-seedream-3-0-t2i-250415",
    "base_url": "https://ark.cn-beijing.volces.com/api/v3",
    "size": "1024x1024",
}

BANANA_T2I_CONFIG = {
    "api_key": "sk-ne669OybjeDNXB8zHoBF2cC2g7iGtvcgBGF5fbmGLaKZsJFe",
    "model": "nano-banana-2",
    "api_url": "https://ai.t8star.cn/v1/images/generations",
    "image_size": "2K",  # nano-banana-2 支持: 1K, 2K, 4K
}

# 生图后端选择: "doubao" 或 "banana"
T2I_BACKEND = "banana"

REFERENCE_CONFIG = {
    "references_dirs": [
        "references",
        "/Users/zhuyinghao/.claude/plugins/cache/baoyu-skills/ai-generation-skills/0e571b72fb71/skills/baoyu-infographic/references",
    ]
}
