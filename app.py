import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from workflow import generate_infographic, list_reference_options


BASE_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = BASE_DIR / "outputs"

app = Flask(__name__, static_folder="web", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2MB


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/options", methods=["GET"])
def api_options():
    options = list_reference_options()
    return jsonify(options)


@app.route("/api/generate", methods=["POST"])
def api_generate():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    language = (payload.get("language") or "zh").strip()
    layout = (payload.get("layout") or "bento-grid").strip()
    style = (payload.get("style") or "craft-handmade").strip()
    aspect = (payload.get("aspect") or "landscape").strip()

    if not text:
        return jsonify({"ok": False, "error": "请输入要生成信息图的文本内容。"}), 400

    result = generate_infographic(
        text=text,
        language=language,
        layout=layout,
        style=style,
        aspect=aspect,
        output_root=OUTPUTS_DIR,
    )
    return jsonify({"ok": True, "data": result})


@app.route("/outputs/<path:filename>")
def outputs(filename):
    return send_from_directory(OUTPUTS_DIR, filename, as_attachment=False)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    app.run(host="0.0.0.0", port=port, debug=True)
