import json
import re
import sys
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

try:
    from api_call.doubao_llm import chat_completion
    from api_config import T2I_BACKEND
    from prompts import INFOGRAPHIC_ANALYSIS_PROMPT, IMAGE_GENERATION_TEMPLATE
except ImportError as e:
    print(f"Warning: Import failed in workflow.py: {e}", file=sys.stderr)
    raise

# Dynamically load image generation backend based on config
_t2i_backend = T2I_BACKEND if 'T2I_BACKEND' in dir() else "doubao"
if _t2i_backend == "banana":
    from api_call.api_banana2_t2i_pro import generate_image
    print(f"T2I backend: banana (nano-banana-2)", file=sys.stderr)
elif _t2i_backend == "doubao":
    from api_call.doubao_t2i import generate_image
    print(f"T2I backend: doubao", file=sys.stderr)
else:
    raise ValueError(f"Unknown T2I_BACKEND: {_t2i_backend}. Supported: 'doubao', 'banana'")

# Configuration for reference directories
REFERENCES_DIR = BASE_DIR / "baoyu-skills" / "skills" / "baoyu-infographic" / "references"

def _read_text(path: Path) -> str:
    """Read text file safely."""
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")

def _slugify(text: str) -> str:
    """Convert text to a filename-safe slug."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text[:50] # Limit length

def _extract_json(text: str) -> Dict:
    """Extract and parse JSON from LLM response."""
    # Try to find JSON block
    match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # Try finding the first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            json_str = text[start : end + 1]
        else:
            # Assume the whole text might be JSON
            json_str = text

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        # Simple retry or fallback could go here
        raise ValueError(f"Failed to parse JSON from LLM response: {e}\nResponse: {text[:100]}...")

def _get_guidelines(category: str, item_id: str) -> str:
    """Retrieve content of layout or style guideline files."""
    # Map 'bento-grid' -> 'layouts/bento-grid.md'
    # Map 'craft-handmade' -> 'styles/craft-handmade.md'
    
    # Handle default fallbacks if file not found
    path = REFERENCES_DIR / category / f"{item_id}.md"
    content = _read_text(path)
    
    if not content and category == "layouts":
        # Fallback to a generic layout if specific one missing
        return "Layout: Organized grid structure with clear hierarchy."
    if not content and category == "styles":
        return "Style: Clean, professional, and visually engaging."
        
    return content

def _report_progress(step: int, total: int, zh: str, en: str, progress: int):
    """Report progress to stderr in JSON format for the Node.js bridge to parse."""
    message = {
        "type": "progress_update",
        "step": step,
        "total": total,
        "message": {"zh": zh, "en": en},
        "progress": progress
    }
    print(json.dumps(message), file=sys.stderr, flush=True)

def generate_infographic(
    text: str,
    language: str = "zh",
    layout: str = "bento-grid",
    style: str = "craft-handmade",
    aspect: str = "landscape",
    output_root: Path = None,
) -> Dict[str, Any]:
    """
    Main workflow to generate an infographic from text.
    """
    if output_root is None:
        output_root = BASE_DIR / "outputs"

    total_start = time.time()

    # Step 1: Analyzing Text Structure (10%)
    _report_progress(1, 4, "正在解析文本结构...", "Analyzing text structure...", 10)
    
    # 1. Analyze Content with LLM
    print(f"Step 1: Analyzing content (Lang: {language})...", file=sys.stderr)
    step_start = time.time()
    
    lang_name = "中文" if language == "zh" else "English"
    
    analysis_prompt = INFOGRAPHIC_ANALYSIS_PROMPT.format(
        lang=lang_name,
        source=text
    )
    
    llm_response = chat_completion(analysis_prompt)
    analysis_data = _extract_json(llm_response)
    
    title = analysis_data.get("title", "infographic")
    analysis_md = analysis_data.get("analysis_markdown", "")
    structured_md = analysis_data.get("structured_content_markdown", "")
    text_labels = analysis_data.get("text_labels", [])
    
    step_duration = time.time() - step_start
    print(f"Step 1 finished in {step_duration:.2f}s", file=sys.stderr)

    # Step 2: Extracting key insights and building prompt (40%)
    _report_progress(2, 4, "提取关键信息并构建提示词...", "Extracting key insights & building prompt...", 40)
    
    step_start = time.time()
    
    # 2. Prepare Output Directory
    slug = _slugify(title) or "infographic"
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    output_dir = output_root / "infographic" / f"{slug}-{timestamp}"
    output_dir.mkdir(parents=True, exist_ok=True)
    prompts_dir = output_dir / "prompts"
    prompts_dir.mkdir(exist_ok=True)

    # 3. Save Intermediate Artifacts
    (output_dir / "source.md").write_text(text, encoding="utf-8")
    (output_dir / "analysis.md").write_text(analysis_md, encoding="utf-8")
    (output_dir / "structured-content.md").write_text(structured_md, encoding="utf-8")

    # 4. Build Image Generation Prompt
    print(f"Step 2: Building image prompt (Layout: {layout}, Style: {style})...", file=sys.stderr)
    
    layout_guidelines = _get_guidelines("layouts", layout)
    style_guidelines = _get_guidelines("styles", style)
    
    labels_str = "\n".join([f"- {label}" for label in text_labels])
    
    image_prompt = IMAGE_GENERATION_TEMPLATE.format(
        layout=layout,
        style=style,
        aspect=aspect,
        language=lang_name,
        layout_guidelines=layout_guidelines,
        style_guidelines=style_guidelines,
        content=structured_md,
        text_labels=labels_str
    )
    
    prompt_path = prompts_dir / "infographic.md"
    prompt_path.write_text(image_prompt, encoding="utf-8")

    step_duration = time.time() - step_start
    print(f"Step 2 finished in {step_duration:.2f}s", file=sys.stderr)

    # Step 3: Generating artwork (70%)
    _report_progress(3, 4, "正在生成精美图像...", "Generating artwork...", 70)

    # 5. Generate Image
    print("Step 3: Generating image...", file=sys.stderr)
    step_start = time.time()
    
    image_filename = "infographic.png"
    image_path = output_dir / image_filename
    
    # Map aspect to pixel dimensions
    size_map = {
        "landscape": "1280x720", 
        "portrait": "768x1024",
        "square": "1024x1024"
    }
    if aspect == "landscape":
        target_size = "1024x768" 
    else:
        target_size = size_map.get(aspect, "1024x1024")

    try:
        generate_image(
            prompt=image_prompt,
            output_path=image_path,
            size=target_size
        )
    except Exception as e:
        print(f"Image generation failed: {e}", file=sys.stderr)
        raise

    step_duration = time.time() - step_start
    print(f"Step 3 finished in {step_duration:.2f}s", file=sys.stderr)

    # Step 4: Finalizing output (100%)
    _report_progress(4, 4, "完成最终处理...", "Finalizing output...", 100)
    
    total_duration = time.time() - total_start
    print(f"Total workflow finished in {total_duration:.2f}s", file=sys.stderr)

    # 6. Return Result
    return {
        "title": title,
        "layout": layout,
        "style": style,
        "aspect": aspect,
        "language": language,
        "output_dir": str(output_dir),
        "image_path": str(image_path),
        # Return relative URL for frontend
        "image_url": f"/outputs/infographic/{output_dir.name}/{image_filename}"
    }

if __name__ == "__main__":
    # Simple CLI test
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("text", help="Input text for infographic")
    args = parser.parse_args()
    
    result = generate_infographic(args.text)
    print(json.dumps(result, indent=2, ensure_ascii=False))
