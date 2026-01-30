import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

from api_call.doubao_llm import chat_completion
from api_call.doubao_t2i import generate_image
from api_config import REFERENCE_CONFIG


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_REFERENCE_DIRS = [
    (BASE_DIR / "references"),
]

for ref_path in REFERENCE_CONFIG.get("references_dirs", []):
    DEFAULT_REFERENCE_DIRS.append(Path(ref_path).expanduser())


def _pick_reference_dir() -> Path:
    for path in DEFAULT_REFERENCE_DIRS:
        if path and path.exists():
            return path
    raise FileNotFoundError(
        "找不到 infographic references 目录。请在 api_config.py 的 "
        "REFERENCE_CONFIG.references_dirs 中配置路径，或在仓库中提供 references/ 目录。"
    )


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _parse_title_and_summary(markdown: str) -> Tuple[str, str]:
    lines = [line.strip() for line in markdown.splitlines()]
    title = ""
    summary = ""
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            continue
        if line and not summary:
            summary = line
            break
    return title, summary


def list_reference_options() -> Dict[str, List[Dict[str, str]]]:
    ref_dir = _pick_reference_dir()
    layouts = []
    styles = []
    for item in sorted((ref_dir / "layouts").glob("*.md")):
        title, summary = _parse_title_and_summary(_read_text(item))
        layouts.append({"id": item.stem, "title": title or item.stem, "summary": summary})
    for item in sorted((ref_dir / "styles").glob("*.md")):
        title, summary = _parse_title_and_summary(_read_text(item))
        styles.append({"id": item.stem, "title": title or item.stem, "summary": summary})
    return {
        "layouts": layouts,
        "styles": styles,
        "defaults": {"layout": "bento-grid", "style": "craft-handmade", "aspect": "landscape"},
    }


def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text


def _extract_json(text: str) -> Dict:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("LLM 返回内容不是有效 JSON。")
    return json.loads(text[start : end + 1])


def _build_llm_prompt(source_text: str, language: str) -> str:
    lang_name = "中文" if language == "zh" else "英文"
    return (
        "你是一位世界级的教学设计师和信息图专家。你的任务是将用户提供的源文本转换成结构化的信息图设计方案。\n\n"
        "### 核心原则\n"
        "1. **数据原样保留**：所有的统计数据、引用和关键术语必须原封不动地保留，不得概括或改写数字。\n"
        "2. **视觉思维**：不仅是总结文字，要思考如何将信息分块并转化为视觉元素（如图表、图标、层级）。\n"
        "3. **教学设计**：定义清晰的学习目标，确保信息图能帮助用户快速理解核心概念。\n\n"
        "### 输出要求\n"
        "请只返回一个严格的 JSON 对象，包含以下字段（所有内容使用{lang}）：\n"
        '- "title": 一个吸引人且准确的标题\n'
        '- "analysis_markdown": 参照以下框架进行分析：\n'
        '  - 学习目标（viewer will understand...）\n'
        '  - 核心数据点（原样列出）\n'
        '  - 视觉机会映射（哪些部分可以图形化）\n'
        '- "structured_content_markdown": 参照以下模板进行结构化：\n'
        '  - Overview\n'
        '  - 各个 Section（每个 Section 包含 Key Concept, Content(verbatim), Visual Element 描述, Text Labels）\n'
        '- "text_labels": 数组，包含要在图中直接显示的短文本（标题、标签、关键数值等）\n\n'
        "### 用户源文本：\n"
        "{source}\n"
    ).format(lang=lang_name, source=source_text)


def _build_prompt(
    layout: str,
    style: str,
    language: str,
    aspect: str,
    structured_content: str,
    text_labels: List[str],
) -> str:
    ref_dir = _pick_reference_dir()
    base_prompt = _read_text(ref_dir / "base-prompt.md")
    layout_guide = _read_text(ref_dir / "layouts" / f"{layout}.md")
    style_guide = _read_text(ref_dir / "styles" / f"{style}.md")

    labels_block = "\n".join(f"- {label}" for label in text_labels) or "- (无)"
    prompt = (
        base_prompt.replace("{{LAYOUT}}", layout)
        .replace("{{STYLE}}", style)
        .replace("{{ASPECT_RATIO}}", aspect)
        .replace("{{LANGUAGE}}", "中文" if language == "zh" else "英文")
        .replace("{{LAYOUT_GUIDELINES}}", layout_guide.strip())
        .replace("{{STYLE_GUIDELINES}}", style_guide.strip())
        .replace("{{CONTENT}}", structured_content.strip())
        .replace("{{TEXT_LABELS}}", labels_block)
    )
    return prompt


def _prepare_output_dir(output_root: Path, title: str) -> Path:
    slug_base = _slugify(title)
    if not slug_base:
        slug_base = "infographic"
    slug = slug_base
    target = output_root / "infographic" / slug
    if target.exists():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        slug = f"{slug_base}-{stamp}"
        target = output_root / "infographic" / slug
    target.mkdir(parents=True, exist_ok=True)
    return target


def generate_infographic(
    text: str,
    language: str,
    layout: str,
    style: str,
    aspect: str,
    output_root: Path,
) -> Dict[str, str]:
    llm_prompt = _build_llm_prompt(text, language)
    llm_response = chat_completion(llm_prompt)
    payload = _extract_json(llm_response)

    title = payload.get("title") or "Infographic"
    analysis_md = payload.get("analysis_markdown") or ""
    structured_md = payload.get("structured_content_markdown") or ""
    text_labels = payload.get("text_labels") or []

    output_dir = _prepare_output_dir(output_root, title)
    (output_dir / "prompts").mkdir(parents=True, exist_ok=True)

    source_path = output_dir / "source.md"
    analysis_path = output_dir / "analysis.md"
    structured_path = output_dir / "structured-content.md"
    prompt_path = output_dir / "prompts" / "infographic.md"
    image_path = output_dir / "infographic.png"

    source_path.write_text(text, encoding="utf-8")
    analysis_path.write_text(analysis_md, encoding="utf-8")
    structured_path.write_text(structured_md, encoding="utf-8")

    prompt = _build_prompt(
        layout=layout,
        style=style,
        language=language,
        aspect=aspect,
        structured_content=structured_md,
        text_labels=text_labels,
    )
    prompt_path.write_text(prompt, encoding="utf-8")

    size_map = {
        "landscape": "1280x720",
        "portrait": "720x1280",
        "square": "1024x1024",
    }
    target_size = size_map.get(aspect, "1024x1024")

    generate_image(prompt, image_path, size=target_size)

    return {
        "title": title,
        "layout": layout,
        "style": style,
        "aspect": aspect,
        "language": language,
        "output_dir": str(output_dir.relative_to(BASE_DIR)),
        "analysis_path": str(analysis_path.relative_to(BASE_DIR)),
        "structured_path": str(structured_path.relative_to(BASE_DIR)),
        "prompt_path": str(prompt_path.relative_to(BASE_DIR)),
        "image_url": f"/outputs/{image_path.relative_to(output_root)}",
    }
