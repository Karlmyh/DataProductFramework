(() => {
  const payload = window.__PRIVACY_LAB_DATA__;
  const root = document.querySelector("#privacy-lab-root");
  if (!payload || !root) return;

  const { series, productsById, candidatesByProduct } = payload;
  const residentStore = window.__RESIDENT_DATA__ ?? { name: "居民公共服务数据库", schema: [], records: [] };
  const residentFields = new Map(residentStore.schema.map((field) => [field.key, field]));
  const residentOperators = {
    enum: [
      { id: "eq", label: "等于", symbol: "=" },
      { id: "neq", label: "不等于", symbol: "≠" },
    ],
    number: [
      { id: "eq", label: "等于", symbol: "=" },
      { id: "gte", label: "大于等于", symbol: "≥" },
      { id: "lte", label: "小于等于", symbol: "≤" },
      { id: "gt", label: "大于", symbol: ">" },
      { id: "lt", label: "小于", symbol: "<" },
    ],
  };
  const defaultResidentConditions = () => [
    { field: "street", operator: "eq", value: "07" },
    { field: "age", operator: "gte", value: "60" },
    { field: "subsidyStatus", operator: "eq", value: "有效" },
  ];
  if (productsById["city-existence"]) productsById["city-existence"].name = "居民数据存在性查询";
  let seriesIndex = 0;
  let productIndex = 0;
  let phase = 0;
  let attackStep = 0;
  let viewMode = "interface";
  let inputValue = "";
  let residentConditions = defaultResidentConditions();
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

  function operatorsFor(field) {
    return residentOperators[field?.type] ?? residentOperators.enum;
  }

  function operatorFor(field, operatorId) {
    return operatorsFor(field).find((operator) => operator.id === operatorId) ?? operatorsFor(field)[0];
  }

  function conditionDefault(field) {
    return field?.type === "number" ? String(field.min ?? 0) : String(field?.values?.[0] ?? "");
  }

  function formatResidentConditions() {
    return residentConditions.map((condition) => {
      const field = residentFields.get(condition.field);
      const operator = operatorFor(field, condition.operator);
      return `${field?.label ?? condition.field} ${operator.symbol} ${condition.value}`;
    }).join(" AND ");
  }

  function recordMatchesCondition(record, condition) {
    const field = residentFields.get(condition.field);
    if (!field) return false;
    const left = field.type === "number" ? Number(record[condition.field]) : String(record[condition.field] ?? "");
    const right = field.type === "number" ? Number(condition.value) : String(condition.value);
    if (condition.operator === "neq") return left !== right;
    if (condition.operator === "gte") return left >= right;
    if (condition.operator === "lte") return left <= right;
    if (condition.operator === "gt") return left > right;
    if (condition.operator === "lt") return left < right;
    return left === right;
  }

  function queryResidents() {
    return residentStore.records.filter((record) => residentConditions.every((condition) => recordMatchesCondition(record, condition)));
  }

  function restrictiveDefaultCondition() {
    const usedFields = new Set(residentConditions.map((condition) => condition.field));
    const availableFields = residentStore.schema.filter((field) => !usedFields.has(field.key));
    const currentMatches = queryResidents();
    const fallbackField = availableFields[0];
    if (!fallbackField) return null;

    const candidates = availableFields.flatMap((field) => {
      const values = field.type === "number"
        ? Array.from({ length: Number(field.max) - Number(field.min) + 1 }, (_, index) => String(Number(field.min) + index))
        : field.values.map(String);
      return values.map((value) => ({ field: field.key, operator: "eq", value }));
    });

    if (currentMatches.length === 0) {
      return { field: fallbackField.key, operator: operatorsFor(fallbackField)[0].id, value: conditionDefault(fallbackField) };
    }

    const ranked = candidates.map((condition, order) => ({
      condition,
      order,
      count: currentMatches.filter((record) => recordMatchesCondition(record, condition)).length,
    }));
    const targetCount = Math.max(1, Math.floor(currentMatches.length / 2));
    const narrowing = ranked
      .filter(({ count }) => count > 0 && count < currentMatches.length)
      .sort((left, right) => Math.abs(left.count - targetCount) - Math.abs(right.count - targetCount) || left.order - right.order)[0];
    if (narrowing) return narrowing.condition;

    const eliminating = ranked.find(({ count }) => count === 0);
    return eliminating?.condition ?? {
      field: fallbackField.key,
      operator: operatorsFor(fallbackField)[0].id,
      value: conditionDefault(fallbackField),
    };
  }

  const withCurrentInput = (product) => {
    if (product.id !== "city-existence") return { ...product, inputValue: inputValue.trim() || product.inputValue };
    const matches = queryResidents();
    return {
      ...product,
      inputLabel: "查询条件",
      inputValue: formatResidentConditions(),
      outputValue: matches.length > 0 ? "TRUE" : "FALSE",
      outputDetail: "对外只返回是否存在，不返回命中数量或居民记录。",
    };
  };

  function aggregate(product) {
    const objectVector = {};
    for (const attack of product.attacks) {
      objectVector[attack.attackObject] = Math.max(objectVector[attack.attackObject] ?? 0, attack.displayScore);
    }
    return { objectVector: Object.entries(objectVector) };
  }

  function residentExistenceVisual(product, currentPhase) {
    const exposed = currentPhase >= 4;
    const ready = currentPhase >= 3;
    return `<div class="resident-existence-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}">
        <span>当前条件</span>
        <strong>${escapeHtml(product.inputValue)}</strong>
      </div>
      <div class="existence-call">
        <div class="resident-store-card ${currentPhase >= 2 ? "searching" : ""}">
          <span>共享数据域</span>
          <strong>${escapeHtml(residentStore.name)}</strong>
          <small>${residentStore.records.length} 条受保护记录 · ${residentStore.schema.length} 个可查询字段</small>
          <div class="masked-records" aria-label="受保护居民记录"><i></i><i></i><i></i></div>
        </div>
        <div class="existence-arrow" aria-hidden="true">→</div>
        <div class="existence-response ${ready ? "ready" : ""}">
          <span>公开响应</span>
          <strong>${ready ? escapeHtml(product.outputValue) : currentPhase >= 2 ? "查询中…" : "等待运行"}</strong>
          <small>不返回居民记录</small>
        </div>
      </div>
      ${exposed ? '<div class="attack-overlay">重复改变条件并比较真假响应，可逐步缩小隐藏成员范围。</div>' : ""}
    </div>`;
  }

  function dataVisual(product, currentPhase) {
    if (product.id === "city-existence") return residentExistenceVisual(product, currentPhase);
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

  function workflowVisual(activeSeries, product, currentPhase) {
    const isGradient = activeSeries.visual === "gradient";
    const steps = isGradient
      ? ["训练批次", "模型 fθ(x)", "损失函数 L", "自动求导 ∂L/∂θ", "梯度更新 Δθ"]
      : [product.inputLabel, ...product.flow, product.outputLabel];
    const activeLimit = currentPhase === 0 ? 0 : currentPhase === 1 ? 1 : currentPhase === 2 ? Math.max(2, steps.length - 1) : steps.length;
    return `<div class="workflow-view ${isGradient ? "gradient-model-flow" : ""}"><div class="workflow-caption"><span>${isGradient ? "模型训练与求导链路" : "产品内部处理流程"}</span><strong>${escapeHtml(product.name)}</strong></div><div class="workflow-chain">${steps.map((step, index) => `<div class="workflow-node ${index < activeLimit ? "active" : ""} ${index < activeLimit - 1 ? "done" : ""}"><b>${String(index + 1).padStart(2, "0")}</b><span>${escapeHtml(step)}</span>${index < steps.length - 1 ? '<i aria-hidden="true">→</i>' : ""}</div>`).join("")}</div>${isGradient ? `<div class="autodiff-equation ${currentPhase >= 2 ? "active" : ""}"><span>前向传播</span><code>ŷ = fθ(x) · L = ℓ(ŷ, y)</code><span>反向传播</span><code>g = ∇θL · θ ← θ − ηg</code></div>` : `<div class="workflow-io"><span>输入</span><strong>${escapeHtml(product.inputValue)}</strong><span>输出</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "等待产品运行"}</strong></div>`}</div>`;
  }

  function technicalExample(activeSeries, product) {
    if (product.id === "city-existence") {
      const sqlFields = {
        street: "street",
        age: "age",
        incomeBand: "income_band",
        occupation: "occupation",
        householdSize: "household_size",
        subsidyStatus: "subsidy_status",
        insurance: "insurance",
        housing: "housing",
      };
      const sqlOperators = { eq: "=", neq: "<>", gte: ">=", lte: "<=", gt: ">", lt: "<" };
      const where = residentConditions.map((condition) => `${sqlFields[condition.field]} ${sqlOperators[condition.operator] ?? "="} ?`).join("\n  AND ");
      const parameters = residentConditions.map((condition) => residentFields.get(condition.field)?.type === "number" ? Number(condition.value) : condition.value);
      return {
        language: "SQL / JSON",
        code: `SELECT EXISTS (\n  SELECT 1\n  FROM residents\n  WHERE ${where}\n) AS exists;\n\nparams = ${JSON.stringify(parameters)}`,
        output: `{ "exists": ${product.outputValue === "TRUE"}, "records": "protected" }`,
      };
    }
    if (activeSeries.visual === "gradient") return {
      language: "PYTORCH",
      code: `batch_x, batch_y = next(train_loader)\nlogits = model(batch_x)\nloss = criterion(logits, batch_y)\nloss.backward()\ngradient = model.classifier.weight.grad`,
      output: `tensor([[ 0.0124, -0.0381,  0.0076, ..., -0.0042],\n        [-0.0197,  0.0445, -0.0118, ...,  0.0261],\n        [ 0.0063, -0.0152,  0.0317, ..., -0.0095]],\n       device='cuda:0')\nshape = [3, 768]   norm = 0.1842`,
    };
    if (activeSeries.visual === "graph") return {
      language: "CYPHER",
      code: `MATCH p=(company:Company)-[*1..2]->(target)\nWHERE company.name = $company\nRETURN p, labels(target)\nLIMIT 20`,
      output: `{ paths: 3, entities: 7, status: "authorized" }`,
    };
    if (activeSeries.visual === "chat") return {
      language: "HTTP / JSON",
      code: `POST /v1/assistant/query\n{\n  "question": "${product.inputValue}",\n  "retrieve": true,\n  "top_k": 3\n}`,
      output: `{ answer: "${product.outputValue}", citations: 3 }`,
    };
    if (activeSeries.visual === "vision") return {
      language: "JAVASCRIPT",
      code: `const result = await vision.predict({\n  media: "${product.inputValue}",\n  returnConfidence: true\n});`,
      output: `{ label: "${product.outputValue}", confidence: 0.92 }`,
    };
    if (activeSeries.visual === "attribute") return {
      language: "HTTP / JSON",
      code: `POST /v1/indicator/read\n{ "subject": "${product.inputValue}" }`,
      output: `{ value: "${product.outputValue}", policy: "published" }`,
    };
    return {
      language: "SQL / JSON",
      code: `SELECT protected_result\nFROM authorized_product\nWHERE request = "${product.inputValue}";`,
      output: `{ result: "${product.outputValue}", protected_fields: "hidden" }`,
    };
  }

  function technicalVisual(activeSeries, product, currentPhase) {
    const example = technicalExample(activeSeries, product);
    const ready = currentPhase >= 3;
    return `<div class="technical-view"><div class="code-panel"><header><span>${escapeHtml(example.language)}</span><i></i><i></i><i></i></header><pre><code>${escapeHtml(example.code)}</code></pre></div><div class="runtime-panel ${ready ? "ready" : ""}"><header><span>${activeSeries.visual === "gradient" ? "GRADIENT TENSOR" : "PRODUCT OUTPUT"}</span><strong>${ready ? "200 OK" : currentPhase >= 2 ? "RUNNING" : "WAITING"}</strong></header><pre><code>${ready ? escapeHtml(example.output) : currentPhase >= 2 ? "正在执行产品计算…" : "运行产品后显示结果"}</code></pre>${activeSeries.visual === "gradient" ? '<div class="tensor-legend"><span><i></i>正梯度</span><span><i></i>负梯度</span><span>dtype: float32</span></div>' : ""}</div></div>`;
  }

  function renderProductPresentation(activeSeries, product, currentPhase) {
    if (viewMode === "flow") return workflowVisual(activeSeries, product, currentPhase);
    if (viewMode === "technical") return technicalVisual(activeSeries, product, currentPhase);
    return renderVisual(activeSeries, product, currentPhase);
  }

  function renderResidentValueControl(condition, field, index) {
    if (field.type === "enum") {
      return `<select data-condition-value="${index}" aria-label="${escapeHtml(field.label)}的值">${field.values.map((value) => `<option value="${escapeHtml(value)}" ${String(condition.value) === String(value) ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>`;
    }
    return `<input type="number" min="${field.min ?? ""}" max="${field.max ?? ""}" value="${escapeHtml(condition.value)}" data-condition-value="${index}" aria-label="${escapeHtml(field.label)}的值" />`;
  }

  function renderResidentProductControl(product) {
    return `<form class="product-control resident-query-control" data-product-form>
      <div class="condition-builder">
        <div class="condition-builder-heading"><span>组合条件</span></div>
        <div class="condition-list">${residentConditions.map((condition, index) => {
          const field = residentFields.get(condition.field) ?? residentStore.schema[0];
          return `<div class="condition-row" data-condition-row="${index}">
            <select data-condition-field="${index}" aria-label="第 ${index + 1} 个条件的字段">${residentStore.schema.map((candidate) => `<option value="${escapeHtml(candidate.key)}" ${candidate.key === field.key ? "selected" : ""}>${escapeHtml(candidate.label)}</option>`).join("")}</select>
            <select data-condition-operator="${index}" aria-label="第 ${index + 1} 个条件的运算符">${operatorsFor(field).map((operator) => `<option value="${operator.id}" ${operator.id === condition.operator ? "selected" : ""}>${escapeHtml(operator.label)}</option>`).join("")}</select>
            ${renderResidentValueControl(condition, field, index)}
            <button type="button" class="condition-remove" data-remove-condition="${index}" ${residentConditions.length === 1 ? "disabled" : ""} aria-label="删除第 ${index + 1} 个条件">删除</button>
          </div>`;
        }).join("")}</div>
        <button type="button" class="condition-add" data-add-condition ${residentConditions.length >= residentStore.schema.length ? "disabled" : ""}>+ 添加条件</button>
      </div>
      <div class="query-actions">
        <button type="button" class="secondary" data-reset-query>恢复示例</button>
        <button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button>
      </div>
    </form>`;
  }

  function renderProductControl(product) {
    if (product.id === "city-existence") return renderResidentProductControl(product);
    return `<form class="product-control" data-product-form><label><span>${escapeHtml(product.inputLabel)}</span><input type="text" value="${escapeHtml(product.inputValue)}" data-product-input aria-label="${escapeHtml(product.inputLabel)}" /></label><button type="button" class="secondary" data-reset-input>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></form>`;
  }

  function resetAfterControlEdit() {
    updateProductPhase(0);
    const stage = root.querySelector("[data-attack-stage]");
    if (stage) stage.hidden = true;
  }

  function refreshProductControl() {
    const control = root.querySelector("[data-product-form]");
    if (control) control.outerHTML = renderProductControl(current().product);
  }

  function renderLab() {
    const { activeSeries, products, product } = current();
    phase = 0;
    attackStep = 0;
    viewMode = "interface";
    inputValue = product.inputValue;
    const displayProduct = withCurrentInput(product);
    root.innerHTML = `
      <div class="series-switcher" aria-label="选择产品演示系列">${series.map((item, index) => `<button type="button" data-series="${index}" aria-pressed="${seriesIndex === index}" class="${seriesIndex === index ? "active" : ""}"><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="product-switcher" aria-label="${escapeHtml(activeSeries.name)}产品切换">${products.map((item, index) => `<button type="button" data-product="${index}" aria-pressed="${productIndex === index}" class="${productIndex === index ? "active" : ""}"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="guided-tour">
        <section class="demo-act product-demo-act">
          <header class="demo-act-heading"><strong>产品演示</strong></header>
          <article class="product-window"><header><div><span class="product-avatar">${escapeHtml(activeSeries.code)}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${escapeHtml(product.family)}</small></span></div><div class="product-header-tools"><div class="view-mode-switch" aria-label="产品展示方式">${[["interface", "产品界面"], ["flow", "运行流程"], ["technical", "代码与数据"]].map(([mode, label]) => `<button type="button" data-view-mode="${mode}" aria-pressed="${mode === viewMode}" class="${mode === viewMode ? "active" : ""}">${label}</button>`).join("")}</div><a href="security_attacks/${encodeURIComponent(product.category)}.html">类别说明</a></div></header><form class="product-control" data-product-form><label><span>${escapeHtml(product.inputLabel)}</span><input type="text" value="${escapeHtml(product.inputValue)}" data-product-input aria-label="${escapeHtml(product.inputLabel)}" /></label><button type="button" class="secondary" data-reset-input>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></form><div class="product-canvas" data-product-canvas>${renderProductPresentation(activeSeries, displayProduct, 0)}</div><footer><button type="button" data-rerun>↻ 重播当前输入</button><span data-product-status>请编辑输入并运行产品</span><button type="button" class="start-attack" data-start-attack disabled>开始隐私攻击演示 →</button></footer></article>
        </section>
        <section class="demo-act attack-demo-act" data-attack-stage hidden>
          <header class="demo-act-heading inverse"><strong>隐私攻击演示</strong></header>
          <div class="attack-stage">
            <article class="attack-target"><header><span>攻击对象</span><strong>${escapeHtml(product.name)}</strong></header><ol class="attack-progress-list" data-attack-progress>${product.attacks.map((attack, index) => `<li data-attack-index="${index}"><b>${index + 1}</b><span>${escapeHtml(attack.name)}</span></li>`).join("")}</ol><div class="attack-canvas" data-attack-canvas>${renderVisual(activeSeries, product, 3)}</div></article>
            <aside class="audit-rail" aria-live="polite"><div class="audit-kicker"><span>旁路隐私评估器</span><i>已连接</i></div><h3 data-audit-title>准备执行适用攻击</h3><div class="audit-counter"><span>已完成攻击</span><strong data-risk-value>0 / ${product.attacks.length}</strong></div><div class="audit-meter"><i data-risk-bar></i></div><ul data-evidence-list><li>等待攻击序列开始</li></ul></aside>
          </div>
          <div class="tour-results" data-results hidden></div>
        </section>
      </div>`;
    root.querySelector(".product-avatar")?.remove();
    root.querySelector(".product-window > header small")?.remove();
    root.querySelector(".product-header-tools > a")?.remove();
    const initialControl = root.querySelector("[data-product-form]");
    if (initialControl) initialControl.outerHTML = renderProductControl(product);
    const initialStatus = root.querySelector("[data-product-status]");
    if (initialStatus) initialStatus.textContent = product.id === "city-existence" ? "请设置条件并运行产品" : "请编辑输入并运行产品";
    updateProductPhase(0);
  }

  function updateProductPhase(nextPhase) {
    const { activeSeries, product } = current();
    const displayProduct = withCurrentInput(product);
    phase = nextPhase;
    root.querySelectorAll("[data-progress]").forEach((item) => {
      const step = Number(item.getAttribute("data-progress"));
      item.classList.toggle("active", step === phase);
      item.classList.toggle("done", step < phase);
    });
    const canvas = root.querySelector("[data-product-canvas]");
    if (canvas) canvas.innerHTML = renderProductPresentation(activeSeries, displayProduct, phase);
    const status = root.querySelector("[data-product-status]");
    const startButton = root.querySelector("[data-start-attack]");
    const runButton = root.querySelector("[data-run-product]");
    const statuses = product.id === "city-existence"
      ? ["请设置条件并运行产品", "已提交结构化条件", "正在查询共享居民数据库", "已返回存在性结果"]
      : ["请编辑输入并运行产品", "产品已收到用户请求", "产品正在完成内部处理", "产品正常输出已完成，可继续查看攻击"];
    if (status) status.textContent = statuses[phase];
    if (startButton instanceof HTMLButtonElement) startButton.disabled = phase < 3;
    if (runButton instanceof HTMLButtonElement) runButton.disabled = phase > 0 && phase < 3;
  }

  function scheduleProductRun() {
    timers.forEach(window.clearTimeout);
    timers = [];
    const stage = root.querySelector("[data-attack-stage]");
    const results = root.querySelector("[data-results]");
    if (stage) stage.hidden = true;
    if (results) results.hidden = true;
    updateProductPhase(0);
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
    const displayProduct = withCurrentInput(product);
    attackStep = nextStep;
    const attackCanvas = root.querySelector("[data-attack-canvas]");
    if (attackCanvas) attackCanvas.innerHTML = renderVisual(activeSeries, displayProduct, attackStep > 0 ? 4 : 3);
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
    stage?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const viewButton = target?.closest("[data-view-mode]");
    if (seriesButton) {
      seriesIndex = Number(seriesButton.getAttribute("data-series"));
      productIndex = 0;
      residentConditions = defaultResidentConditions();
      renderLab();
    } else if (productButton) {
      productIndex = Number(productButton.getAttribute("data-product"));
      residentConditions = defaultResidentConditions();
      renderLab();
    } else if (viewButton) {
      viewMode = viewButton.getAttribute("data-view-mode") || "interface";
      root.querySelectorAll("[data-view-mode]").forEach((button) => {
        const selected = button.getAttribute("data-view-mode") === viewMode;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      updateProductPhase(phase);
    } else if (target?.closest("[data-reset-query]")) {
      residentConditions = defaultResidentConditions();
      refreshProductControl();
      resetAfterControlEdit();
    } else if (target?.closest("[data-add-condition]")) {
      const condition = restrictiveDefaultCondition();
      if (condition && residentConditions.length < residentStore.schema.length) {
        residentConditions.push(condition);
        refreshProductControl();
        resetAfterControlEdit();
      }
    } else if (target?.closest("[data-remove-condition]")) {
      const button = target.closest("[data-remove-condition]");
      const index = Number(button?.getAttribute("data-remove-condition"));
      if (residentConditions.length > 1 && Number.isInteger(index)) {
        residentConditions.splice(index, 1);
        refreshProductControl();
        resetAfterControlEdit();
      }
    } else if (target?.closest("[data-reset-input]")) {
      inputValue = current().product.inputValue;
      const input = root.querySelector("[data-product-input]");
      if (input instanceof HTMLInputElement) input.value = inputValue;
      updateProductPhase(0);
      const stage = root.querySelector("[data-attack-stage]");
      if (stage) stage.hidden = true;
    } else if (target?.closest("[data-start-attack]")) {
      startAttackRun();
    } else if (target?.closest("[data-rerun]")) {
      scheduleProductRun();
    }
  });

  root.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.matches("[data-condition-value]")) {
      const index = Number(target.getAttribute("data-condition-value"));
      if (residentConditions[index]) residentConditions[index].value = target.value;
      resetAfterControlEdit();
      return;
    }
    if (target.matches("[data-product-input]")) {
      inputValue = target.value;
      resetAfterControlEdit();
    }
  });

  root.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.matches("[data-condition-field]")) {
      const index = Number(target.getAttribute("data-condition-field"));
      const field = residentFields.get(target.value);
      if (residentConditions[index] && field) {
        residentConditions[index] = { field: field.key, operator: operatorsFor(field)[0].id, value: conditionDefault(field) };
        refreshProductControl();
        resetAfterControlEdit();
      }
      return;
    }
    if (target.matches("[data-condition-operator]")) {
      const index = Number(target.getAttribute("data-condition-operator"));
      if (residentConditions[index]) residentConditions[index].operator = target.value;
      resetAfterControlEdit();
      return;
    }
    if (target.matches("[data-condition-value]")) {
      const index = Number(target.getAttribute("data-condition-value"));
      if (residentConditions[index]) residentConditions[index].value = target.value;
      resetAfterControlEdit();
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-product-form]")) return;
    event.preventDefault();
    const input = form.querySelector("[data-product-input]");
    if (input instanceof HTMLInputElement) inputValue = input.value;
    if (current().product.id === "city-existence") inputValue = formatResidentConditions();
    scheduleProductRun();
  });

  renderLab();
})();
