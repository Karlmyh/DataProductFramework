(() => {
  const payload = window.__PRIVACY_LAB_DATA__;
  const root = document.querySelector("#privacy-lab-root");
  if (!payload || !root) return;

  const { suites, candidatesByProduct } = payload;
  let suiteIndex = 0;
  let productIndex = 0;
  let timers = [];

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const current = () => {
    const suite = suites[suiteIndex];
    return { suite, product: suite.products[productIndex] };
  };

  function aggregate(product) {
    const objectVector = {};
    let sum = 0;
    for (const attack of product.attacks) {
      sum += attack.displayScore;
      objectVector[attack.attackObject] = Math.max(objectVector[attack.attackObject] ?? 0, attack.displayScore);
    }
    return {
      average: Math.round(sum / product.attacks.length),
      maximum: Math.max(...Object.values(objectVector)),
      objectVector: Object.entries(objectVector),
    };
  }

  function renderLab() {
    const { suite, product } = current();
    root.innerHTML = `
      <div class="suite-switcher" aria-label="选择多产品演示场景">
        ${suites.map((item, index) => `
          <button type="button" data-suite="${index}" aria-pressed="${suiteIndex === index}" class="${suiteIndex === index ? "active" : ""}">
            <span>${escapeHtml(item.code)}</span><strong>${escapeHtml(item.name)}</strong>
          </button>`).join("")}
      </div>
      <div class="suite-context"><span>${escapeHtml(suite.code)}</span><p>${escapeHtml(suite.description)}</p></div>
      <div class="product-switcher" aria-label="${escapeHtml(suite.name)}产品切换">
        ${suite.products.map((item, index) => `
          <button type="button" data-product="${index}" aria-pressed="${productIndex === index}" class="${productIndex === index ? "active" : ""}">
            <span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.family)}</small>
          </button>`).join("")}
      </div>
      <div class="product-stage template-${escapeHtml(product.template)}">
        <div class="product-summary">
          <div><span class="category-chip">${escapeHtml(product.category)} · ${escapeHtml(product.family)}</span><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.tagline)}</p></div>
          <a href="security_attacks/${encodeURIComponent(product.category)}.html">查看类别说明</a>
        </div>
        <div class="call-console">
          <div class="request-card">
            <span class="console-label">01 输入 · ${escapeHtml(product.inputLabel)}</span>
            <strong>${escapeHtml(product.inputValue)}</strong>
            <button type="button" data-rerun><span aria-hidden="true">▶</span> ${escapeHtml(product.callLabel)}</button>
          </div>
          <div class="flow-track" aria-label="产品调用流程">
            ${product.flow.map((step, index) => `<div class="flow-node" data-flow="${index}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(step)}</strong>${index < product.flow.length - 1 ? '<i aria-hidden="true"></i>' : ""}</div>`).join("")}
          </div>
          <div class="response-card" aria-live="polite">
            <span class="console-label">03 输出 · ${escapeHtml(product.outputLabel)}</span>
            <strong data-response-value>等待产品响应…</strong><p>${escapeHtml(product.outputDetail)}</p>
          </div>
        </div>
      </div>
      <div class="attack-results" aria-live="polite">
        <div class="results-head">
          <div><span class="console-label">攻击结果</span><h3 data-results-title>正在匹配并执行适用攻击…</h3><p>攻击方式只作简要说明，重点展示最终结果及产品级聚合结论。</p></div>
          <span class="scope-note">受控离线演示</span>
        </div>
        <div class="attack-output"><div class="attack-loading" role="status"><span>正在冻结权限、先验与查询预算</span><i></i><i></i><i></i></div></div>
      </div>`;
    scheduleRun();
  }

  function scheduleRun() {
    timers.forEach(window.clearTimeout);
    timers = [];
    const { product } = current();
    const activateFlow = (index) => root.querySelector(`[data-flow="${index}"]`)?.classList.add("active");
    const revealResponse = () => {
      root.querySelector(".response-card")?.classList.add("visible");
      const value = root.querySelector("[data-response-value]");
      if (value) value.textContent = product.outputValue;
    };
    const finish = () => renderResults(product);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      product.flow.forEach((_, index) => activateFlow(index));
      revealResponse();
      finish();
      return;
    }
    timers = [
      window.setTimeout(() => activateFlow(0), 180),
      window.setTimeout(() => activateFlow(1), 520),
      window.setTimeout(() => activateFlow(2), 860),
      window.setTimeout(revealResponse, 900),
      window.setTimeout(finish, 1180),
    ];
  }

  function renderResults(product) {
    const candidates = candidatesByProduct[product.id] ?? [];
    const applicableCount = candidates.filter((candidate) => candidate.applicable).length;
    const executedCount = candidates.filter((candidate) => candidate.executed).length;
    const result = aggregate(product);
    const title = root.querySelector("[data-results-title]");
    if (title) title.textContent = `${executedCount} 种适用攻击已全部完成`;
    root.querySelector(".attack-results")?.classList.add("visible");
    const output = root.querySelector(".attack-output");
    if (!output) return;
    output.innerHTML = `
      <div class="attack-coverage">
        <div><strong>${candidates.length}</strong><span>候选攻击</span></div>
        <div><strong>${applicableCount}</strong><span>条件适用</span></div>
        <div><strong>${executedCount}</strong><span>已执行</span></div>
        <p><b>${executedCount === applicableCount ? "全部适用攻击均已执行" : "仍有适用攻击待执行"}</b></p>
      </div>
      <div class="attack-grid">
        ${product.attacks.map((attack, index) => `
          <article class="attack-card" style="transition-delay:${index * 90}ms">
            <header><span>${String(index + 1).padStart(2, "0")}</span><small>${escapeHtml(attack.evidence)} · ${escapeHtml(attack.attackFamily)} / ${escapeHtml(attack.attackObject)}</small></header>
            <h4>${escapeHtml(attack.name)}</h4><p class="attack-brief">${escapeHtml(attack.brief)}</p><p class="attack-outcome">${escapeHtml(attack.result)}</p>
            <div class="attack-metric"><span>${escapeHtml(attack.metric)}</span><strong>${escapeHtml(attack.value)}</strong></div>
            <div class="risk-bar" aria-label="展示性结果强度 ${attack.displayScore} 分"><i style="width:${attack.displayScore}%"></i></div>
            <small class="risk-number">展示性结果强度 ${attack.displayScore} / 100</small>
            <details class="evidence-trace"><summary>证据范围与限制</summary><p><b>来源</b>${escapeHtml(attack.source)}</p><p><b>协议</b>${escapeHtml(attack.protocol)}</p><p><b>限制</b>${escapeHtml(attack.limitation)}</p></details>
          </article>`).join("")}
      </div>
      <div class="aggregate-panel">
        <div class="aggregate-title"><div><span>产品聚合结论</span><h3>${escapeHtml(product.name)}</h3></div><p>主结论取攻击对象结果向量中的最大值；平均值仅用于辅助比较。当前数字是展示性结果强度，尚未配置基线与损失曲线。</p></div>
        <div class="aggregate-summary"><div><span>平均结果强度</span><strong>${result.average}</strong><small>辅助统计</small></div><div><span>最高结果强度</span><strong>${result.maximum}</strong><small>当前主结论</small></div><div><span>正式隐私损失</span><strong>—</strong><small>待校准</small></div></div>
        <div class="comparison-chart" aria-label="攻击结果横向比较">${product.attacks.map((attack) => `<div class="comparison-row"><span>${escapeHtml(attack.name)}</span><div><i style="width:${attack.displayScore}%"></i></div><strong>${attack.displayScore}</strong></div>`).join("")}</div>
        <div class="result-vector" aria-label="攻击对象结果向量"><span>攻击对象结果向量</span><ul>${result.objectVector.map(([label, value]) => `<li><b>${escapeHtml(label)}</b><strong>${value}</strong></li>`).join("")}</ul></div>
      </div>`;
  }

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const suiteButton = target?.closest("[data-suite]");
    const productButton = target?.closest("[data-product]");
    if (suiteButton) {
      suiteIndex = Number(suiteButton.getAttribute("data-suite"));
      productIndex = 0;
      renderLab();
    } else if (productButton) {
      productIndex = Number(productButton.getAttribute("data-product"));
      renderLab();
    } else if (target?.closest("[data-rerun]")) {
      renderLab();
    }
  });

  renderLab();
})();
