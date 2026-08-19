(() => {
  const payload = window.__PRIVACY_LAB_DATA__;
  const root = document.querySelector("#privacy-lab-root");
  if (!payload || !root) return;

  const { series, productsById, candidatesByProduct } = payload;
  let seriesIndex = 0;
  let productIndex = 0;
  let phase = 0;
  let attackStep = 0;
  let timers = [];

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const current = () => {
    const activeSeries = series[seriesIndex];
    const products = activeSeries.productIds.map((id) => productsById[id]).filter(Boolean);
    return { activeSeries, products, product: products[productIndex] };
  };

  function aggregate(product) {
    const objectVector = {};
    for (const attack of product.attacks) {
      objectVector[attack.attackObject] = Math.max(objectVector[attack.attackObject] ?? 0, attack.displayScore);
    }
    return { objectVector: Object.entries(objectVector) };
  }

  function dataVisual(product, currentPhase) {
    const isVerification = product.category.startsWith("0304");
    const exposed = currentPhase >= 4;
    return `<div class="data-product-view">
      <div class="query-ribbon ${currentPhase >= 1 ? "active" : ""}"><span>${escapeHtml(product.inputLabel)}</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      <div class="data-table" aria-label="受控数据产品结果">
        <div class="data-row data-head"><span>对象</span><span>公开结果</span><span>保护字段</span></div>
        <div class="data-row ${currentPhase >= 2 ? "scanning" : ""}"><span>记录 A17</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "处理中…"}</strong><span class="secret ${exposed ? "exposed" : ""}">${exposed ? (isVerification ? "关系已推断" : "身份已关联") : "••••••"}</span></div>
        <div class="data-row"><span>记录 B04</span><span>${currentPhase >= 3 ? "未命中" : "—"}</span><span class="secret">••••••</span></div>
        <div class="data-row"><span>记录 C29</span><span>${currentPhase >= 3 ? "受限" : "—"}</span><span class="secret ${exposed ? "exposed" : ""}">${exposed ? "属性已缩小" : "••••••"}</span></div>
      </div>
      ${exposed ? '<div class="attack-overlay">重复响应被组合，隐藏字段开始显现</div>' : ""}
    </div>`;
  }

  function visionVisual(product, currentPhase) {
    return `<div class="vision-product-view">
      <div class="vision-frame ${currentPhase >= 2 ? "scanning" : ""}">
        <div class="scene-sky"></div><div class="scene-ground"></div>
        <div class="scene-person one">人物 A</div><div class="scene-person two">人物 B</div>
        <div class="detect-box one ${currentPhase >= 2 ? "visible" : ""}"></div><div class="detect-box two ${currentPhase >= 2 ? "visible" : ""}"></div>
        ${currentPhase >= 2 ? '<i class="scan-line"></i>' : ""}
      </div>
      <div class="vision-readout"><span>${escapeHtml(product.inputLabel)}</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "等待模型预测"}</strong><div class="confidence-track"><i style="width:${currentPhase >= 3 ? "88%" : "0"}"></i></div>${currentPhase >= 4 ? '<div class="recovered-preview"><b>攻击后</b><span>训练成员信号：高</span><span>视觉原型：已逼近</span></div>' : ""}</div>
    </div>`;
  }

  function chatVisual(product, currentPhase) {
    return `<div class="chat-product-view">
      <div class="chat-thread"><div class="chat-system">知识助手已连接</div>${currentPhase >= 1 ? `<div class="chat-message user"><span>用户</span><p>${escapeHtml(product.inputValue)}</p></div>` : ""}${currentPhase >= 2 && currentPhase < 3 ? '<div class="typing"><i></i><i></i><i></i></div>' : ""}${currentPhase >= 3 ? `<div class="chat-message bot"><span>${escapeHtml(product.name)}</span><p>${escapeHtml(product.outputValue)}</p></div>` : ""}</div>
      <aside class="retrieval-drawer ${currentPhase >= 4 ? "exposed" : ""}"><span>内部检索</span>${currentPhase >= 4 ? '<strong>3 个隐藏来源被关联</strong><ul><li>政策条款 / 片段 07</li><li>内部提示 / 规则 02</li><li>候选语料 / 成员命中</li></ul>' : '<strong>对外不可见</strong><div class="locked-lines"><i></i><i></i><i></i></div>'}</aside>
    </div>`;
  }

  function graphVisual(product, currentPhase) {
    return `<div class="graph-product-view">
      <div class="graph-query"><span>${escapeHtml(product.inputLabel)}</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      <div class="graph-canvas"><i class="graph-edge e1 ${currentPhase >= 2 ? "visible" : ""}"></i><i class="graph-edge e2 ${currentPhase >= 3 ? "visible" : ""}"></i><i class="graph-edge e3 sensitive ${currentPhase >= 4 ? "visible" : ""}"></i><i class="graph-edge e4 sensitive ${currentPhase >= 4 ? "visible" : ""}"></i><span class="graph-node n1">企业 A</span><span class="graph-node n2 ${currentPhase >= 2 ? "visible" : ""}">股东 B</span><span class="graph-node n3 ${currentPhase >= 3 ? "visible" : ""}">账户 C</span><span class="graph-node n4 sensitive ${currentPhase >= 4 ? "visible" : ""}">关联方 D</span><span class="graph-node n5 sensitive ${currentPhase >= 4 ? "visible" : ""}">隐藏路径</span></div>
      <div class="graph-result">${currentPhase >= 4 ? "攻击组合后恢复了未直接返回的关系路径" : currentPhase >= 3 ? escapeHtml(product.outputValue) : "正在展开公开关系…"}</div>
    </div>`;
  }

  function attributeVisual(product, currentPhase) {
    return `<div class="attribute-product-view">
      <div class="subject-card"><span>评估对象</span><strong>样本 #A-204</strong><small>${escapeHtml(product.inputValue)}</small></div>
      <div class="attribute-board"><div><span>公开属性</span><b>地区：华东</b><b>规模：中型</b></div><div class="hidden-attributes ${currentPhase >= 4 ? "exposed" : ""}"><span>隐藏属性</span><b>${currentPhase >= 4 ? "风险偏好：高" : "风险偏好：•••"}</b><b>${currentPhase >= 4 ? "合同状态：续签" : "合同状态：•••"}</b></div></div>
      <div class="score-dial ${currentPhase >= 3 ? "ready" : ""}"><span>${escapeHtml(product.outputLabel)}</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "—"}</strong><i></i></div>${currentPhase >= 4 ? '<div class="inference-stamp">多次输出共同指向隐藏属性</div>' : ""}
    </div>`;
  }

  function gradientVisual(product, currentPhase) {
    const cells = Array.from({ length: 48 }, (_, index) => `<i class="${currentPhase >= 2 ? "active" : ""}" style="--delay:${index * 8}ms"></i>`).join("");
    return `<div class="gradient-product-view"><div class="gradient-header"><span>${escapeHtml(product.inputLabel)}</span><strong>${escapeHtml(product.inputValue)}</strong></div><div class="gradient-matrix">${cells}</div><div class="gradient-output"><span>${escapeHtml(product.outputLabel)}</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "等待聚合…"}</strong></div>${currentPhase >= 4 ? '<div class="gradient-leak"><div class="reconstructed-record">重建样本轮廓</div><strong>标签与群体属性已暴露</strong></div>' : ""}</div>`;
  }

  function renderVisual(activeSeries, product, currentPhase) {
    if (activeSeries.visual === "vision") return visionVisual(product, currentPhase);
    if (activeSeries.visual === "chat") return chatVisual(product, currentPhase);
    if (activeSeries.visual === "graph") return graphVisual(product, currentPhase);
    if (activeSeries.visual === "attribute") return attributeVisual(product, currentPhase);
    if (activeSeries.visual === "gradient") return gradientVisual(product, currentPhase);
    return dataVisual(product, currentPhase);
  }

  function renderLab() {
    const { activeSeries, products, product } = current();
    phase = 0;
    attackStep = 0;
    root.innerHTML = `
      <div class="series-switcher" aria-label="选择产品演示系列">${series.map((item, index) => `<button type="button" data-series="${index}" aria-pressed="${seriesIndex === index}" class="${seriesIndex === index ? "active" : ""}"><span>${escapeHtml(item.code)}</span><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="product-switcher" aria-label="${escapeHtml(activeSeries.name)}产品切换">${products.map((item, index) => `<button type="button" data-product="${index}" aria-pressed="${productIndex === index}" class="${productIndex === index ? "active" : ""}"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="guided-tour">
        <section class="demo-act product-demo-act">
          <header class="demo-act-heading"><span>阶段 01</span><div><strong>产品调用演示</strong><small>仅展示产品如何接收输入、运行并返回正常结果</small></div></header>
          <div class="tour-progress" aria-label="产品演示进度">${["提交产品输入", "产品内部运行", "返回正常输出"].map((label, index) => `<div data-progress="${index + 1}"><b>${index + 1}</b><span>${label}</span></div>`).join("")}</div>
          <article class="product-window"><header><div><span class="product-avatar">${escapeHtml(activeSeries.code)}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${escapeHtml(product.family)}</small></span></div><a href="security_attacks/${encodeURIComponent(product.category)}.html">类别说明</a></header><div class="product-canvas" data-product-canvas>${renderVisual(activeSeries, product, 0)}</div><footer><button type="button" data-rerun>↻ 重播产品演示</button><span data-product-status>准备接收产品输入</span><button type="button" class="start-attack" data-start-attack disabled>开始隐私攻击演示 →</button></footer></article>
        </section>
        <section class="demo-act attack-demo-act" data-attack-stage hidden>
          <header class="demo-act-heading inverse"><span>阶段 02</span><div><strong>隐私攻击演示</strong><small>在产品正常输出完成后，依次执行全部适用攻击</small></div></header>
          <div class="attack-stage">
            <article class="attack-target"><header><span>攻击对象</span><strong>${escapeHtml(product.name)}</strong></header><ol class="attack-progress-list" data-attack-progress>${product.attacks.map((attack, index) => `<li data-attack-index="${index}"><b>${index + 1}</b><span>${escapeHtml(attack.name)}</span></li>`).join("")}</ol><div class="attack-canvas" data-attack-canvas>${renderVisual(activeSeries, product, 3)}</div></article>
            <aside class="audit-rail" aria-live="polite"><div class="audit-kicker"><span>旁路隐私评估器</span><i>已连接</i></div><h3 data-audit-title>准备执行适用攻击</h3><div class="audit-counter"><span>已完成攻击</span><strong data-risk-value>0 / ${product.attacks.length}</strong></div><div class="audit-meter"><i data-risk-bar></i></div><ul data-evidence-list><li>等待攻击序列开始</li></ul></aside>
          </div>
          <div class="tour-results" data-results hidden></div>
        </section>
      </div>`;
    scheduleProductRun();
  }

  function updateProductPhase(nextPhase) {
    const { activeSeries, product } = current();
    phase = nextPhase;
    root.querySelectorAll("[data-progress]").forEach((item) => {
      const step = Number(item.getAttribute("data-progress"));
      item.classList.toggle("active", step === phase);
      item.classList.toggle("done", step < phase);
    });
    const canvas = root.querySelector("[data-product-canvas]");
    if (canvas) canvas.innerHTML = renderVisual(activeSeries, product, phase);
    const status = root.querySelector("[data-product-status]");
    const startButton = root.querySelector("[data-start-attack]");
    const statuses = ["准备接收产品输入", "产品已收到正常请求", "产品正在完成内部处理", "产品正常输出已完成"];
    if (status) status.textContent = statuses[phase];
    if (startButton instanceof HTMLButtonElement) startButton.disabled = phase < 3;
  }

  function scheduleProductRun() {
    timers.forEach(window.clearTimeout);
    timers = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updateProductPhase(3);
      return;
    }
    timers = [
      window.setTimeout(() => updateProductPhase(1), 220),
      window.setTimeout(() => updateProductPhase(2), 900),
      window.setTimeout(() => updateProductPhase(3), 1750),
    ];
  }

  function updateAttackStep(nextStep) {
    const { activeSeries, product } = current();
    attackStep = nextStep;
    const attackCanvas = root.querySelector("[data-attack-canvas]");
    if (attackCanvas) attackCanvas.innerHTML = renderVisual(activeSeries, product, attackStep > 0 ? 4 : 3);
    root.querySelectorAll("[data-attack-index]").forEach((item) => {
      const index = Number(item.getAttribute("data-attack-index"));
      item.classList.toggle("active", index === attackStep - 1);
      item.classList.toggle("done", index < attackStep);
    });
    const title = root.querySelector("[data-audit-title]");
    const value = root.querySelector("[data-risk-value]");
    const bar = root.querySelector("[data-risk-bar]");
    const evidence = root.querySelector("[data-evidence-list]");
    if (title) title.textContent = attackStep === 0 ? "准备执行适用攻击" : attackStep === product.attacks.length ? "全部适用攻击已经完成" : `正在执行：${product.attacks[attackStep - 1].name}`;
    if (value) value.textContent = `${attackStep} / ${product.attacks.length}`;
    if (bar) bar.style.width = `${attackStep / product.attacks.length * 100}%`;
    if (evidence) evidence.innerHTML = attackStep === 0 ? "<li>等待攻击序列开始</li>" : product.attacks.slice(0, attackStep).map((attack) => `<li>${escapeHtml(attack.name)}：${escapeHtml(attack.result)}</li>`).join("");
    if (attackStep === product.attacks.length) renderResults(product);
  }

  function startAttackRun() {
    timers.forEach(window.clearTimeout);
    timers = [];
    const stage = root.querySelector("[data-attack-stage]");
    const results = root.querySelector("[data-results]");
    if (stage) stage.hidden = false;
    if (results) results.hidden = true;
    updateAttackStep(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updateAttackStep(current().product.attacks.length);
      return;
    }
    timers = current().product.attacks.map((_, index) => window.setTimeout(() => updateAttackStep(index + 1), 350 + index * 820));
  }

  function renderResults(product) {
    const candidates = candidatesByProduct[product.id] ?? [];
    const applicableCount = candidates.filter((candidate) => candidate.applicable).length;
    const executedCount = candidates.filter((candidate) => candidate.executed).length;
    const result = aggregate(product);
    const results = root.querySelector("[data-results]");
    if (!results) return;
    results.hidden = false;
    results.innerHTML = `
      <header><div><span>攻击结果</span><h3>${executedCount} 种适用攻击已全部完成</h3></div><strong>${executedCount} / ${applicableCount}</strong></header>
      <div class="attack-grid">${product.attacks.map((attack, index) => `<article class="attack-card" style="--delay:${index * 90}ms"><span>${String(index + 1).padStart(2, "0")} · ${escapeHtml(attack.evidence)}</span><h4>${escapeHtml(attack.name)}</h4><small>${escapeHtml(attack.brief)}</small><p>${escapeHtml(attack.result)}</p><div><span>${escapeHtml(attack.metric)}</span><strong>${escapeHtml(attack.value)}</strong></div><i><b style="width:${attack.displayScore}%"></b></i></article>`).join("")}</div>
      <div class="curve-panel"><div class="curve-heading"><span>结果向量 → 效用—隐私损失曲线</span><h3>${escapeHtml(product.name)}</h3></div><div class="curve-content"><div class="result-vector"><span>攻击对象结果向量</span><ul>${result.objectVector.map(([label, vectorValue]) => `<li><b>${escapeHtml(label)}</b><strong>${vectorValue}</strong></li>`).join("")}</ul></div><div class="curve-plot" aria-label="展示性效用与隐私损失定位"><span class="axis-y">效用</span><span class="axis-x">隐私损失</span>${product.attacks.map((attack, index) => `<i class="curve-point" style="left:${Math.min(92, attack.displayScore)}%;bottom:${Math.max(18, 88 - attack.displayScore * .45)}%" title="${escapeHtml(attack.name)}"><b>${index + 1}</b></i>`).join("")}</div></div><p>曲线待结合有限调查、行业信息和业务要求校准。</p></div>`;
  }

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const seriesButton = target?.closest("[data-series]");
    const productButton = target?.closest("[data-product]");
    if (seriesButton) {
      seriesIndex = Number(seriesButton.getAttribute("data-series"));
      productIndex = 0;
      renderLab();
    } else if (productButton) {
      productIndex = Number(productButton.getAttribute("data-product"));
      renderLab();
    } else if (target?.closest("[data-start-attack]")) {
      startAttackRun();
    } else if (target?.closest("[data-rerun]")) {
      renderLab();
    }
  });

  renderLab();
})();
