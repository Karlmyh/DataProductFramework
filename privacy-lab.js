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
  if (productsById["city-existence"]) productsById["city-existence"].name = "居民数据存在性查询";
  if (productsById["content-library"]) Object.assign(productsById["content-library"], {
    name: "居民授权记录检索库",
    tagline: "按授权条件返回居民记录的公开字段，受保护字段仅显示字段名称。",
    inputLabel: "授权检索条件",
    inputValue: "街道=07 ∧ 年龄≥60 ∧ 职业=退休",
    callLabel: "检索授权记录",
    outputLabel: "检索结果",
    outputValue: "3 条授权记录",
    outputDetail: "返回记录编号、街道、年龄和职业；收入、补贴和保障类型保持受保护。",
  });
  if (productsById["finance-aggregate"]) Object.assign(productsById["finance-aggregate"], {
    name: "居民群体统计查询",
    tagline: "按居民条件返回群体统计，不返回任何个人记录。",
    inputLabel: "统计条件",
    inputValue: "街道=07 ∧ 年龄≥60",
    callLabel: "生成居民统计",
    outputLabel: "统计结果",
    outputValue: "10 条样本",
    outputDetail: "返回样本数、平均年龄、平均家庭人数和保障房占比。",
  });
  const structuredProductConfigs = {
    "city-existence": {
      schema: residentStore.schema,
      defaults: [
        { field: "street", operator: "eq", value: "07" },
        { field: "age", operator: "gte", value: "60" },
        { field: "subsidyStatus", operator: "eq", value: "有效" },
      ],
    },
    "content-library": {
      schema: residentStore.schema.filter((field) => ["street", "age", "occupation", "householdSize", "housing"].includes(field.key)),
      defaults: [
        { field: "street", operator: "eq", value: "07" },
        { field: "age", operator: "gte", value: "60" },
        { field: "occupation", operator: "eq", value: "退休" },
      ],
    },
    "finance-graph": {
      schema: [
        { key: "company", label: "企业", type: "enum", values: ["远澜科技", "海岸智造", "星桥能源"] },
        { key: "relation", label: "关系类型", type: "enum", values: ["全部关系", "控制关系", "股权关系", "项目关系"] },
        { key: "hops", label: "最大跳数", type: "number", min: 1, max: 3 },
        { key: "direction", label: "关系方向", type: "enum", values: ["向外", "向内", "双向"] },
      ],
      defaults: [
        { field: "company", operator: "eq", value: "远澜科技" },
        { field: "relation", operator: "eq", value: "全部关系" },
        { field: "hops", operator: "lte", value: "2" },
      ],
    },
    "finance-aggregate": {
      schema: residentStore.schema.filter((field) => ["street", "age", "occupation", "householdSize", "housing"].includes(field.key)),
      defaults: [
        { field: "street", operator: "eq", value: "07" },
        { field: "age", operator: "gte", value: "60" },
      ],
    },
    "finance-derived": {
      schema: [
        { key: "enterprise", label: "企业编号", type: "enum", values: ["E-204", "E-318", "E-506"] },
        { key: "featurePack", label: "特征包", type: "enum", values: ["经营稳定性 V3", "现金流 V2", "供应链 V1"] },
        { key: "normalization", label: "标准化方式", type: "enum", values: ["Z-Score", "Min-Max", "分位数"] },
        { key: "maskLevel", label: "脱敏级别", type: "enum", values: ["标准", "严格", "审核后原值"] },
      ],
      defaults: [
        { field: "enterprise", operator: "eq", value: "E-204" },
        { field: "featurePack", operator: "eq", value: "经营稳定性 V3" },
      ],
    },
    "city-verify": {
      schema: [
        { key: "credential", label: "居民凭证", type: "enum", values: ["R-2048", "R-3186", "R-4207"] },
        { key: "policy", label: "政策项目", type: "enum", values: ["养老补贴 Q3", "住房补贴 Q3", "医疗救助 Q3"] },
        { key: "period", label: "核验周期", type: "enum", values: ["2026-Q3", "2026-Q2", "2026-Q1"] },
        { key: "region", label: "政策地区", type: "enum", values: ["东城区", "西城区", "南城区"] },
      ],
      defaults: [
        { field: "credential", operator: "eq", value: "R-2048" },
        { field: "policy", operator: "eq", value: "养老补贴 Q3" },
      ],
    },
    "finance-verify": {
      schema: [
        { key: "company", label: "企业", type: "enum", values: ["远澜科技", "海岸智造", "星桥能源"] },
        { key: "account", label: "账户尾号", type: "enum", values: ["8421", "1936", "5708"] },
        { key: "relation", label: "核验关系", type: "enum", values: ["开户归属", "资金授权", "代付关系"] },
        { key: "institution", label: "机构", type: "enum", values: ["东海银行", "华城银行", "联合支付"] },
      ],
      defaults: [
        { field: "company", operator: "eq", value: "远澜科技" },
        { field: "account", operator: "eq", value: "8421" },
      ],
    },
  };
  const residentQueryProductIds = new Set(["city-existence", "content-library", "finance-aggregate"]);
  let seriesIndex = 0;
  let productIndex = 0;
  let phase = 0;
  let attackStep = 0;
  let viewMode = "interface";
  let inputValue = "";
  let structuredConditions = structuredProductConfigs["city-existence"].defaults.map((condition) => ({ ...condition }));
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

  function structuredConfig(product = current().product) {
    return structuredProductConfigs[product?.id] ?? null;
  }

  function structuredSchema(product = current().product) {
    return structuredConfig(product)?.schema ?? [];
  }

  function structuredFields(product = current().product) {
    return new Map(structuredSchema(product).map((field) => [field.key, field]));
  }

  function defaultStructuredConditions(product = current().product) {
    return (structuredConfig(product)?.defaults ?? []).map((condition) => ({ ...condition }));
  }

  function formatStructuredConditions(product = current().product) {
    const fields = structuredFields(product);
    return structuredConditions.map((condition) => {
      const field = fields.get(condition.field);
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
    return residentStore.records.filter((record) => structuredConditions.every((condition) => recordMatchesCondition(record, condition)));
  }

  function nextStructuredCondition(product = current().product) {
    const schema = structuredSchema(product);
    const usedFields = new Set(structuredConditions.map((condition) => condition.field));
    const availableFields = schema.filter((field) => !usedFields.has(field.key));
    const fallbackField = availableFields[0];
    if (!fallbackField) return null;
    if (!residentQueryProductIds.has(product.id)) {
      return { field: fallbackField.key, operator: operatorsFor(fallbackField)[0].id, value: conditionDefault(fallbackField) };
    }

    const currentMatches = queryResidents();
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
    if (!structuredConfig(product)) return { ...product, inputValue: inputValue.trim() || product.inputValue };
    const formattedInput = formatStructuredConditions(product);
    if (product.id === "city-existence") {
      const matches = queryResidents();
      return {
        ...product,
        inputLabel: "查询条件",
        inputValue: formattedInput,
        outputValue: matches.length > 0 ? "TRUE" : "FALSE",
        outputDetail: "对外只返回是否存在，不返回命中数量或居民记录。",
      };
    }
    if (product.id === "content-library") {
      const matches = queryResidents();
      return { ...product, inputValue: formattedInput, outputValue: `${matches.length} 条授权记录` };
    }
    if (product.id === "finance-aggregate") {
      const matches = queryResidents();
      return { ...product, inputValue: formattedInput, outputValue: `${matches.length} 条样本` };
    }
    if (product.id === "finance-graph") {
      return { ...product, inputValue: formattedInput, outputValue: "已返回授权关系路径" };
    }
    return { ...product, inputValue: formattedInput };
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
      <div class="existence-result ${ready ? product.outputValue === "TRUE" ? "is-true" : "is-false" : ""}" aria-live="polite">${ready ? `<strong>${escapeHtml(product.outputValue)}</strong>` : ""}</div>
      ${exposed ? '<div class="attack-overlay">重复改变条件并比较真假响应，可逐步缩小隐藏成员范围。</div>' : ""}
    </div>`;
  }

  function authorizedResidentRecords() {
    return queryResidents().slice(0, 5);
  }

  function authorizedResidentVisual(product, currentPhase) {
    const ready = currentPhase >= 3;
    const rows = authorizedResidentRecords();
    return `<div class="authorized-records-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}"><span>当前条件</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      ${ready ? `<div class="authorized-record-table" aria-label="授权居民记录检索结果">
        <div class="authorized-record-row authorized-record-head"><span>记录编号</span><span>公开字段</span><span>受保护字段（＊）</span></div>
        ${rows.map((record) => `<div class="authorized-record-row">
          <strong>${escapeHtml(record.residentId)}</strong>
          <div class="public-features"><span><b>街道</b>${escapeHtml(record.street)}</span><span><b>年龄</b>${escapeHtml(record.age)}</span><span><b>职业</b>${escapeHtml(record.occupation)}</span><span><b>家庭人数</b>${escapeHtml(record.householdSize)}</span><span><b>居住类型</b>${escapeHtml(record.housing)}</span></div>
          <div class="protected-features"><span><b>＊ 收入区间</b><i>••••</i></span><span><b>＊ 补贴状态</b><i>••••</i></span><span><b>＊ 保障类型</b><i>••••</i></span></div>
        </div>`).join("")}
      </div>` : ""}
    </div>`;
  }

  function residentStatistics() {
    const rows = queryResidents();
    const count = rows.length;
    const total = (field) => rows.reduce((sum, record) => sum + Number(record[field] ?? 0), 0);
    return {
      count,
      averageAge: count ? total("age") / count : 0,
      averageHouseholdSize: count ? total("householdSize") / count : 0,
      protectedHousingRate: count ? rows.filter((record) => record.housing === "保障房").length / count * 100 : 0,
    };
  }

  function residentStatisticsVisual(product, currentPhase) {
    const ready = currentPhase >= 3;
    const statistics = residentStatistics();
    return `<div class="resident-statistics-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}"><span>当前条件</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      ${ready ? `<div class="resident-stat-grid" aria-label="居民群体统计结果">
        <div class="resident-stat-card"><span>样本数</span><strong>${statistics.count}</strong><small>人</small></div>
        <div class="resident-stat-card"><span>平均年龄</span><strong>${statistics.averageAge.toFixed(1)}</strong><small>岁</small></div>
        <div class="resident-stat-card"><span>平均家庭人数</span><strong>${statistics.averageHouseholdSize.toFixed(1)}</strong><small>人</small></div>
        <div class="resident-stat-card"><span>保障房占比</span><strong>${statistics.protectedHousingRate.toFixed(1)}</strong><small>%</small></div>
      </div>` : ""}
    </div>`;
  }

  function structuredConditionValue(fieldKey, fallback = "") {
    return structuredConditions.find((condition) => condition.field === fieldKey)?.value ?? fallback;
  }

  function enterpriseGraphPaths() {
    const targetCompany = structuredConditionValue("company", "远澜科技");
    const target = { key: "target-company", label: targetCompany, kind: "目标企业" };
    return [
      {
        id: "P1",
        type: "控制关系",
        direction: "向内",
        nodes: [{ key: "zhou-haining", label: "周海宁", kind: "自然人" }, { key: "haiyue-holding", label: "海岳控股", kind: "控股企业" }, target],
        edges: ["实际控制", "控制"],
      },
      {
        id: "P2",
        type: "股权关系",
        direction: "向内",
        nodes: [{ key: "guochuang-capital", label: "国创资本", kind: "管理人" }, { key: "langang-fund", label: "蓝港产业基金", kind: "股东" }, target],
        edges: ["出资管理", "持股 18.6%"],
      },
      {
        id: "P3",
        type: "项目关系",
        direction: "向外",
        nodes: [target, { key: "xinyuan-project", label: "新源储能项目", kind: "项目" }, { key: "xingqiao-energy", label: "星桥能源", kind: "合作方" }],
        edges: ["参与投资", "联合建设"],
      },
    ];
  }

  function filteredEnterpriseGraphPaths() {
    const relation = structuredConditionValue("relation", "全部关系");
    const maxHops = Number(structuredConditionValue("hops", "2"));
    const direction = structuredConditionValue("direction", "双向");
    return enterpriseGraphPaths().filter((path) =>
      (relation === "全部关系" || path.type === relation)
      && path.edges.length <= maxHops
      && (direction === "双向" || path.direction === direction));
  }

  function enterpriseGraphVisual(product, currentPhase) {
    const ready = currentPhase >= 3;
    const paths = filteredEnterpriseGraphPaths();
    return `<div class="enterprise-graph-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}"><span>当前条件</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      ${ready ? `<div class="relation-path-list">${paths.map((path) => `<article class="relation-path-card"><header><b>${path.id}</b><strong>${escapeHtml(path.type)}</strong><span>${escapeHtml(path.direction)}</span></header><div class="relation-path-chain">${path.nodes.map((node, index) => `<span class="relation-entity"><b>${escapeHtml(node.label)}</b><small>${escapeHtml(node.kind)}</small></span>${index < path.edges.length ? `<i><small>${escapeHtml(path.edges[index])}</small><b>→</b></i>` : ""}`).join("")}</div></article>`).join("")}</div>` : ""}
    </div>`;
  }

  function dataVisual(product, currentPhase) {
    if (product.id === "city-existence") return residentExistenceVisual(product, currentPhase);
    if (product.id === "content-library") return authorizedResidentVisual(product, currentPhase);
    if (product.id === "finance-graph") return enterpriseGraphVisual(product, currentPhase);
    if (product.id === "finance-aggregate") return residentStatisticsVisual(product, currentPhase);
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
    return `<div class="gradient-product-view"><div class="gradient-header"><span>${escapeHtml(product.inputLabel)}</span><strong>${escapeHtml(product.inputValue)}</strong></div><div class="embedded-product-flow" aria-label="训练更新流程">${product.flow.map((step, index) => `<span class="${currentPhase > index ? "active" : ""}">${escapeHtml(step)}</span>`).join('<i aria-hidden="true">→</i>')}</div><div class="gradient-matrix">${cells}</div><div class="gradient-output"><span>${escapeHtml(product.outputLabel)}</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "等待聚合…"}</strong></div>${currentPhase >= 4 ? '<div class="gradient-leak"><div class="reconstructed-record">重建样本轮廓</div><strong>标签与群体属性已暴露</strong></div>' : ""}</div>`;
  }

  function renderVisual(activeSeries, product, currentPhase) {
    if (activeSeries.visual === "vision") return visionVisual(product, currentPhase);
    if (activeSeries.visual === "chat") return chatVisual(product, currentPhase);
    if (activeSeries.visual === "graph") return graphVisual(product, currentPhase);
    if (activeSeries.visual === "attribute") return attributeVisual(product, currentPhase);
    if (activeSeries.visual === "gradient") return gradientVisual(product, currentPhase);
    return dataVisual(product, currentPhase);
  }

  function technicalExample(activeSeries, product) {
    if (residentQueryProductIds.has(product.id)) {
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
      const where = structuredConditions.map((condition) => `${sqlFields[condition.field]} ${sqlOperators[condition.operator] ?? "="} ?`).join("\n  AND ");
      const parameters = structuredConditions.map((condition) => residentFields.get(condition.field)?.type === "number" ? Number(condition.value) : condition.value);
      if (product.id === "content-library") return {
        language: "SQL / JSON",
        code: `SELECT resident_id, street, age, occupation, household_size, housing\nFROM residents\nWHERE ${where};\n\nparams = ${JSON.stringify(parameters)}`,
        output: `{ "records": ${queryResidents().length}, "public_fields": ["resident_id", "street", "age", "occupation", "household_size", "housing"], "protected_fields": ["income_band", "subsidy_status", "insurance"] }`,
      };
      if (product.id === "finance-aggregate") {
        const statistics = residentStatistics();
        return {
          language: "SQL / JSON",
          code: `SELECT COUNT(*) AS sample_count,\n       AVG(age) AS average_age,\n       AVG(household_size) AS average_household_size,\n       AVG(CASE WHEN housing = '保障房' THEN 1.0 ELSE 0.0 END) AS protected_housing_rate\nFROM residents\nWHERE ${where};\n\nparams = ${JSON.stringify(parameters)}`,
          output: `{ "sample_count": ${statistics.count}, "average_age": ${statistics.averageAge.toFixed(1)}, "average_household_size": ${statistics.averageHouseholdSize.toFixed(1)}, "protected_housing_rate": ${statistics.protectedHousingRate.toFixed(3)} }`,
        };
      }
      return {
        language: "SQL / JSON",
        code: `SELECT EXISTS (\n  SELECT 1\n  FROM residents\n  WHERE ${where}\n) AS exists;\n\nparams = ${JSON.stringify(parameters)}`,
        output: `{ "exists": ${product.outputValue === "TRUE"}, "records": "protected" }`,
      };
    }
    if (product.id === "finance-graph") {
      const paths = filteredEnterpriseGraphPaths();
      const entities = new Set(paths.flatMap((path) => path.nodes.map((node) => node.key))).size;
      return {
        language: "CYPHER / JSON",
        code: `MATCH p=(source)-[r*1..2]-(target:Company {name: "${structuredConditionValue("company", "远澜科技")}"})\nWHERE $relation = "全部关系" OR all(edge IN relationships(p) WHERE edge.family = $relation)\nRETURN p;`,
        output: `{ "paths": ${paths.length}, "entities": ${entities}, "relation": "${structuredConditionValue("relation", "全部关系")}" }`,
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
    if (viewMode === "technical") return technicalVisual(activeSeries, product, currentPhase);
    return renderVisual(activeSeries, product, currentPhase);
  }

  function renderStructuredValueControl(condition, field, index) {
    if (field.type === "enum") {
      return `<select data-condition-value="${index}" aria-label="${escapeHtml(field.label)}的值">${field.values.map((value) => `<option value="${escapeHtml(value)}" ${String(condition.value) === String(value) ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>`;
    }
    return `<input type="number" min="${field.min ?? ""}" max="${field.max ?? ""}" value="${escapeHtml(condition.value)}" data-condition-value="${index}" aria-label="${escapeHtml(field.label)}的值" />`;
  }

  function renderStructuredProductControl(product) {
    const schema = structuredSchema(product);
    const fields = structuredFields(product);
    return `<form class="product-control structured-query-control" data-product-form>
      <div class="condition-builder">
        <div class="condition-builder-heading"><span>组合条件</span></div>
        <div class="condition-list">${structuredConditions.map((condition, index) => {
          const field = fields.get(condition.field) ?? schema[0];
          return `<div class="condition-row" data-condition-row="${index}">
            <select data-condition-field="${index}" aria-label="第 ${index + 1} 个条件的字段">${schema.map((candidate) => `<option value="${escapeHtml(candidate.key)}" ${candidate.key === field.key ? "selected" : ""}>${escapeHtml(candidate.label)}</option>`).join("")}</select>
            <select data-condition-operator="${index}" aria-label="第 ${index + 1} 个条件的运算符">${operatorsFor(field).map((operator) => `<option value="${operator.id}" ${operator.id === condition.operator ? "selected" : ""}>${escapeHtml(operator.label)}</option>`).join("")}</select>
            ${renderStructuredValueControl(condition, field, index)}
            <button type="button" class="condition-remove" data-remove-condition="${index}" ${structuredConditions.length === 1 ? "disabled" : ""} aria-label="删除第 ${index + 1} 个条件">删除</button>
          </div>`;
        }).join("")}</div>
        <button type="button" class="condition-add" data-add-condition ${structuredConditions.length >= schema.length ? "disabled" : ""}>+ 添加条件</button>
      </div>
      <div class="query-actions">
        <button type="button" class="secondary" data-reset-query>恢复示例</button>
        <button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button>
      </div>
    </form>`;
  }

  function renderProductControl(product) {
    if (structuredConfig(product)) return renderStructuredProductControl(product);
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
    const minimalFooter = Boolean(structuredConfig(product));
    root.innerHTML = `
      <div class="series-switcher" aria-label="选择产品演示系列">${series.map((item, index) => `<button type="button" data-series="${index}" aria-pressed="${seriesIndex === index}" class="${seriesIndex === index ? "active" : ""}"><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="product-switcher" aria-label="${escapeHtml(activeSeries.name)}产品切换">${products.map((item, index) => `<button type="button" data-product="${index}" aria-pressed="${productIndex === index}" class="${productIndex === index ? "active" : ""}"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="guided-tour">
        <section class="demo-act product-demo-act">
          <header class="demo-act-heading"><strong>产品演示</strong></header>
          <article class="product-window"><header><div><span class="product-avatar">${escapeHtml(activeSeries.code)}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${escapeHtml(product.family)}</small></span></div><div class="product-header-tools"><div class="view-mode-switch" aria-label="产品展示方式">${[["interface", "产品界面"], ["technical", "代码与数据"]].map(([mode, label]) => `<button type="button" data-view-mode="${mode}" aria-pressed="${mode === viewMode}" class="${mode === viewMode ? "active" : ""}">${label}</button>`).join("")}</div><a href="security_attacks/${encodeURIComponent(product.category)}.html">类别说明</a></div></header><form class="product-control" data-product-form><label><span>${escapeHtml(product.inputLabel)}</span><input type="text" value="${escapeHtml(product.inputValue)}" data-product-input aria-label="${escapeHtml(product.inputLabel)}" /></label><button type="button" class="secondary" data-reset-input>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></form><div class="product-canvas" data-product-canvas>${renderProductPresentation(activeSeries, displayProduct, 0)}</div><footer class="${minimalFooter ? "minimal-product-footer" : ""}">${minimalFooter ? "" : '<button type="button" data-rerun>↻ 重播当前输入</button><span data-product-status>请编辑输入并运行产品</span>'}<button type="button" class="start-attack" data-start-attack disabled>开始隐私攻击演示 →</button></footer></article>
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
    const statuses = ["请编辑输入并运行产品", "产品已收到用户请求", "产品正在完成内部处理", "产品正常输出已完成，可继续查看攻击"];
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
      structuredConditions = defaultStructuredConditions(current().product);
      renderLab();
    } else if (productButton) {
      productIndex = Number(productButton.getAttribute("data-product"));
      structuredConditions = defaultStructuredConditions(current().product);
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
      structuredConditions = defaultStructuredConditions(current().product);
      refreshProductControl();
      resetAfterControlEdit();
    } else if (target?.closest("[data-add-condition]")) {
      const product = current().product;
      const condition = nextStructuredCondition(product);
      if (condition && structuredConditions.length < structuredSchema(product).length) {
        structuredConditions.push(condition);
        refreshProductControl();
        resetAfterControlEdit();
      }
    } else if (target?.closest("[data-remove-condition]")) {
      const button = target.closest("[data-remove-condition]");
      const index = Number(button?.getAttribute("data-remove-condition"));
      if (structuredConditions.length > 1 && Number.isInteger(index)) {
        structuredConditions.splice(index, 1);
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
      if (structuredConditions[index]) structuredConditions[index].value = target.value;
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
      const field = structuredFields(current().product).get(target.value);
      if (structuredConditions[index] && field) {
        structuredConditions[index] = { field: field.key, operator: operatorsFor(field)[0].id, value: conditionDefault(field) };
        refreshProductControl();
        resetAfterControlEdit();
      }
      return;
    }
    if (target.matches("[data-condition-operator]")) {
      const index = Number(target.getAttribute("data-condition-operator"));
      if (structuredConditions[index]) structuredConditions[index].operator = target.value;
      resetAfterControlEdit();
      return;
    }
    if (target.matches("[data-condition-value]")) {
      const index = Number(target.getAttribute("data-condition-value"));
      if (structuredConditions[index]) structuredConditions[index].value = target.value;
      resetAfterControlEdit();
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-product-form]")) return;
    event.preventDefault();
    const input = form.querySelector("[data-product-input]");
    if (input instanceof HTMLInputElement) inputValue = input.value;
    if (structuredConfig(current().product)) inputValue = formatStructuredConditions(current().product);
    scheduleProductRun();
  });

  renderLab();
})();
