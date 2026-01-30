const statusEl = document.getElementById("status");
const imageEl = document.getElementById("resultImage");
const metaEl = document.getElementById("resultMeta");
const generateBtn = document.getElementById("generateBtn");

function setStatus(text) {
  statusEl.textContent = text || "";
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "生成中..." : "生成信息图";
}

async function loadOptions() {
  const response = await fetch("/api/options");
  const data = await response.json();
  const layoutSelect = document.getElementById("layout");
  const styleSelect = document.getElementById("style");

  data.layouts.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.id} - ${item.summary}`;
    layoutSelect.appendChild(option);
  });

  data.styles.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.id} - ${item.summary}`;
    styleSelect.appendChild(option);
  });

  layoutSelect.value = data.defaults.layout;
  styleSelect.value = data.defaults.style;
}

async function generateInfographic() {
  const text = document.getElementById("sourceText").value.trim();
  const language = document.getElementById("language").value;
  const layout = document.getElementById("layout").value;
  const style = document.getElementById("style").value;
  const aspect = document.getElementById("aspect").value;

  if (!text) {
    setStatus("请输入文本内容。");
    return;
  }

  setLoading(true);
  setStatus("正在调用 LLM 总结内容...");
  imageEl.style.display = "none";
  metaEl.textContent = "";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, layout, style, aspect }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "生成失败，请查看后台日志。");
    }

    setStatus("生成完成。");
    const data = result.data;
    metaEl.textContent = [
      `标题：${data.title}`,
      `布局：${data.layout}`,
      `风格：${data.style}`,
      `语言：${data.language === "zh" ? "中文" : "英文"}`,
      `输出目录：${data.output_dir}`,
      `Prompt：${data.prompt_path}`,
    ].join("\n");

    imageEl.src = data.image_url + `?t=${Date.now()}`;
    imageEl.onload = () => {
      imageEl.style.display = "block";
    };
  } catch (error) {
    setStatus(error.message || "生成失败。");
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener("click", generateInfographic);
loadOptions();
