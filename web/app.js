const statusEl = document.getElementById("status");
const imageEl = document.getElementById("resultImage");
const emptyState = document.getElementById("emptyState");
const metaInfo = document.getElementById("metaInfo");
const generateBtn = document.getElementById("generateBtn");

// Meta 元素
const metaTitle = document.getElementById("metaTitle");
const metaLayout = document.getElementById("metaLayout");
const metaAspect = document.getElementById("metaAspect");

function setStatus(text, show = true) {
  statusEl.textContent = text || "";
  statusEl.style.display = show ? "block" : "none";
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  if (isLoading) {
    generateBtn.innerHTML = '<span class="loading-spinner"></span> 引擎计算中...';
  } else {
    generateBtn.textContent = "生成信息图";
  }
}

async function loadOptions() {
  try {
    const response = await fetch("/api/options");
    const data = await response.json();
    const layoutSelect = document.getElementById("layout");
    const styleSelect = document.getElementById("style");

    data.layouts.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.title;
      layoutSelect.appendChild(option);
    });

    data.styles.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.title;
      styleSelect.appendChild(option);
    });

    layoutSelect.value = data.defaults.layout;
    styleSelect.value = data.defaults.style;
  } catch (error) {
    setStatus("无法加载配置项，请检查后端状态。");
  }
}

async function generateInfographic() {
  const text = document.getElementById("sourceText").value.trim();
  const language = document.getElementById("language").value;
  const layout = document.getElementById("layout").value;
  const style = document.getElementById("style").value;
  const aspect = document.getElementById("aspect").value;

  if (!text) {
    setStatus("请输入内容文字。");
    return;
  }

  setLoading(true);
  setStatus("正在启动大脑进行深度内容解析...");
  imageEl.style.display = "none";
  emptyState.style.display = "flex";
  metaInfo.style.display = "none";

  try {
    // 模拟不同阶段的状态更新
    const states = [
      "正在应用教学设计原则拆解信息...",
      "正在组装高阶视觉 Prompt...",
      "正在调用文生图引擎进行像素级绘制...",
      "即将完成，正在优化色彩分布...",
    ];

    let stateIdx = 0;
    const interval = setInterval(() => {
      if (stateIdx < states.length) {
        setStatus(states[stateIdx++]);
      }
    }, 5000);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, layout, style, aspect }),
    });
    
    clearInterval(interval);
    
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "生成失败，请检查 API 配置。");
    }

    const data = result.data;
    
    // 更新元数据
    metaTitle.textContent = data.title;
    metaLayout.textContent = data.layout;
    metaAspect.textContent = data.aspect === 'landscape' ? '16:9' : (data.aspect === 'portrait' ? '9:16' : '1:1');
    
    // 加载图片
    imageEl.src = data.image_url + `?t=${Date.now()}`;
    imageEl.onload = () => {
      imageEl.style.display = "block";
      emptyState.style.display = "none";
      metaInfo.style.display = "grid";
      setStatus("视觉重塑完成。", true);
      setTimeout(() => setStatus("", false), 3000);
    };
  } catch (error) {
    setStatus(error.message);
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener("click", generateInfographic);
loadOptions();
