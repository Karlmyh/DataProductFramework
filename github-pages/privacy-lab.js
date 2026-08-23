(() => {
  const payload = window.__PRIVACY_LAB_DATA__;
  const root = document.querySelector("#privacy-lab-root");
  if (!payload || !root) return;

  const { series, productsById, candidatesByProduct } = payload;
  if (!series.length) {
    root.innerHTML = '<div class="demo-unavailable">该子类的互动演示尚未加入</div>';
    return;
  }
  const residentStore = window.__RESIDENT_DATA__ ?? { name: "居民公共服务数据库", schema: [], records: [] };
  const syntheticFaceLibrary = window.__SYNTHETIC_FACE_LIBRARY__ ?? { gridSize: 5, sheets: [], targetDescriptor: [], faces: [] };
  const residentFields = new Map(residentStore.schema.map((field) => [field.key, field]));
  const enterpriseCreditStore = window.__ENTERPRISE_CREDIT_DATA__ ?? { name: "模拟企业信用数据集", schema: [], records: [], split: { reference: 0, target: 0 }, observerRule: {} };
  const ragChatData = window.__RAG_CHAT_DATA__ ?? {
    images: [],
    responses: [],
  };
  const ragProductIds = new Set(["city-rag", "content-multimodal"]);
  const ragResponsesByProduct = new Map([
    ["city-rag", ragChatData.responses.filter((response) => response.productCode === "030701")],
    ["content-multimodal", ragChatData.responses.filter((response) => response.productCode === "030705")],
  ]);
  const ragImagesById = new Map(ragChatData.images.map((image) => [image.id, image]));
  const selectedRagQuestionIds = new Map(Array.from(ragResponsesByProduct, ([productId, responses]) => [productId, responses[0]?.id ?? ""]));
  const ragMembershipData = window.__RAG_MEMBERSHIP_RESULTS__ ?? { results: [] };
  const ragMembershipByProductCode = new Map(ragMembershipData.results.map((result) => [result.productCode, result]));
  const creditProductIds = new Set(["finance-index", "city-grade", "content-rank", "finance-model"]);
  const creditFeatureKeys = enterpriseCreditStore.schema.map((field) => field.key);
  const creditPublicFeatureKeys = enterpriseCreditStore.schema.filter((field) => !field.sensitive).map((field) => field.key);
  const creditSensitiveFeatureKey = enterpriseCreditStore.schema.find((field) => field.sensitive)?.key ?? "overdueRate";
  const creditFeatureScales = Object.fromEntries(enterpriseCreditStore.schema.map((field) => [field.key, Number(field.scale) || 100]));
  const creditRecordById = new Map(enterpriseCreditStore.records.map((record) => [record.id, record]));
  const creditReferenceCount = enterpriseCreditStore.split?.reference ?? 60;
  const creditReferenceRecords = enterpriseCreditStore.records.slice(0, creditReferenceCount);
  const creditTargetRecords = enterpriseCreditStore.records.slice(creditReferenceCount);
  const creditExampleRecord = creditTargetRecords[12] ?? enterpriseCreditStore.records[0] ?? {};
  const creditOutputFor = (productId, record) => productId === "finance-index"
    ? record.riskIndex
    : productId === "city-grade"
      ? record.grade
      : productId === "content-rank"
        ? record.riskRank
        : record.defaultProbability;
  const creditOutputText = (productId, record) => productId === "finance-index"
    ? `${Number(record.riskIndex).toFixed(1)} / 100`
    : productId === "city-grade"
      ? `${record.grade} 级`
      : productId === "content-rank"
        ? `风险第 ${record.riskRank} 名 · ${record.riskPercentile} 百分位`
        : `${(Number(record.defaultProbability) * 100).toFixed(1)}% · ${record.defaultRiskLabel}`;
  const ragProductDefinitions = {
    "city-rag": {
      name: "政策知识问答助手",
      tagline: "回答用户选择的政策问题。",
      inputLabel: "选择一个政策问题",
      callLabel: "提交问题",
      flow: ["接收问题", "生成回答", "返回结果"],
      outputLabel: "回答",
      outputDetail: "仅向用户展示回答正文。",
    },
    "content-multimodal": {
      name: "多模态知识问答助手",
      tagline: "在同一问答界面中增加图片输入。",
      inputLabel: "选择图片与问题",
      callLabel: "提交图片与问题",
      flow: ["接收图片与问题", "生成回答", "返回结果"],
      outputLabel: "回答",
      outputDetail: "仅向用户展示图片、问题和回答正文。",
    },
  };
  const ragCorpusMembershipAttack = {
    id: "rag-corpus-membership",
    name: "RAG 语料成员推断",
    brief: "对候选数据集中的每个对象重复查询 Chatbot，仅由回答正文计算成员分数。",
    result: "候选成员与非成员的回答分数可分，以 ROC-AUC 衡量攻击效果。",
    metric: "ROC-AUC",
    evidence: "受控候选集实测",
    attackFamily: "成员推断",
    attackObject: "语料成员隐私",
    source: "QURM183 受控候选集实测",
    protocol: "成员/非成员各半；每候选对象2次查询；仅回答正文打分；标签仅用于计算 ROC-AUC",
    limitation: "结果来自受控的合成候选集，不代表一般生产环境的攻击效果。",
  };
  Object.entries(ragProductDefinitions).forEach(([productId, definition]) => {
    const product = productsById[productId];
    const firstResponse = ragResponsesByProduct.get(productId)?.[0];
    if (!product) return;
    const benchmark = ragMembershipByProductCode.get(product.category) ?? { rocAuc: 0 };
    Object.assign(product, {
      ...definition,
      inputValue: firstResponse?.question ?? product.inputValue,
      outputValue: publicRagAnswer(firstResponse?.answer ?? "回答尚未载入"),
      attacks: [{ ...ragCorpusMembershipAttack, value: Number(benchmark.rocAuc).toFixed(3), displayScore: Math.round(Number(benchmark.rocAuc) * 100) }],
    });
    candidatesByProduct[productId] = [{ id: ragCorpusMembershipAttack.id, name: ragCorpusMembershipAttack.name, applicable: true, executed: true, reason: "适用：攻击者可对已知候选对象重复查询，并仅从 Chatbot 回答正文计算成员分数。" }];
  });
  const protectedResidentFieldKeys = new Set(["monthlyIncome", "subsidyStatus", "insurance"]);
  const qualificationPolicies = ["养老服务补贴", "住房租赁补贴", "医疗救助"];
  const qualificationPeriods = ["2026年第3季度", "2026年第2季度", "2026年第1季度"];
  const qualificationRegions = ["东城区", "西城区", "南城区"];
  const accountEnterpriseSeeds = [
    "远澜科技｜统一社会信用代码 91310000MA7K2X8P6Q",
    "海岸智造｜统一社会信用代码 91320000MA5T8N4R2L",
    "星桥能源｜统一社会信用代码 91330000MA6C9P7W4K",
  ];
  const accountEntitySeeds = [
    "东海银行｜账户尾号 8421",
    "华城银行｜账户尾号 1936",
    "联合支付｜账户尾号 5708",
  ];
  const syntheticEnterprisePrefixes = ["远峰", "华清", "云港", "晨星", "嘉禾", "新川", "海岚", "东浦", "安澜", "启明"];
  const syntheticEnterpriseIndustries = ["科技", "制造", "能源", "物流", "服务", "材料", "数科", "实业", "供应链", "工程"];
  const syntheticBanks = ["东海银行", "华城银行", "联合支付", "浦江银行", "新港银行", "城际银行", "安泰银行", "海岳银行"];
  const accountEnterpriseOptions = [...accountEnterpriseSeeds, ...Array.from({ length: 97 }, (_, offset) => {
    const serial = offset + 4;
    const name = `${syntheticEnterprisePrefixes[offset % syntheticEnterprisePrefixes.length]}${syntheticEnterpriseIndustries[Math.floor(offset / syntheticEnterprisePrefixes.length) % syntheticEnterpriseIndustries.length]}${String(serial).padStart(3, "0")}`;
    const creditCode = `91${String(310000 + serial).padStart(6, "0")}MA${String(70000000 + serial * 7919).slice(-8)}`;
    return `${name}｜统一社会信用代码 ${creditCode}`;
  })];
  const accountEntityOptions = [...accountEntitySeeds, ...Array.from({ length: 97 }, (_, offset) => {
    const serial = offset + 4;
    const bank = syntheticBanks[offset % syntheticBanks.length];
    const tail = String((8421 + serial * 3571) % 10000).padStart(4, "0");
    return `${bank}｜账户尾号 ${tail}`;
  })];
  const verifiedAccountRelationships = new Map(accountEnterpriseOptions.map((enterprise, index) => [enterprise, accountEntityOptions[index]]));
  const verifyAccountRelationship = (enterprise, account) => verifiedAccountRelationships.get(enterprise) === account;
  const qualificationProfiles = residentStore.records.slice(0, 30).map((record, index) => ({
    record,
    credential: qualificationCredential(record, index),
    region: qualificationRegion(record),
    period: qualificationPeriod(record),
  }));
  const qualificationProfileByCredential = new Map(qualificationProfiles.map((profile) => [profile.credential, profile]));
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
  if (productsById["city-existence"]) {
    Object.assign(productsById["city-existence"], {
      name: "居民数据存在性查询",
      outputLabel: "查询结果",
      outputValue: "存在",
    });
    productsById["city-existence"].attacks = [{
      id: "membership-recovery",
      name: "居民数据库成员恢复",
      brief: "利用候选居民的可查询特征反复提交存在性条件，判断哪些候选居民属于隐藏数据库。",
      result: "运行攻击代码后，根据实际存在性响应生成恢复数据集。",
      metric: "真实成员召回",
      value: "运行后计算",
      displayScore: 0,
      evidence: "代码实测",
      attackFamily: "成员重建",
      attackObject: "成员隐私",
      source: "当前页面居民演示数据",
      protocol: "有限候选池；逐字段组合条件；调用产品同一存在性查询逻辑；查询结果缓存",
      limitation: "恢复的是候选居民的数据库成员关系，不是凭空生成未知居民记录。",
    }];
    candidatesByProduct["city-existence"] = [{
      id: "membership-recovery",
      name: "居民数据库成员恢复",
      applicable: true,
      executed: true,
      reason: "适用：存在或不存在的响应可用于逐步判断候选居民是否属于数据库。",
    }];
  }
  if (productsById["content-library"]) Object.assign(productsById["content-library"], {
    name: "居民受保护记录检索",
    tagline: "对受保护记录集提交范围条件，返回范围内全部样本的公开特征。",
    inputLabel: "记录范围",
    inputValue: "街道=07 ∧ 年龄≥60 ∧ 月收入≤4500元",
    callLabel: "检索范围内样本",
    outputLabel: "检索结果",
    outputValue: "范围内公开样本",
    outputDetail: "条件可以包含受保护字段，但每条命中样本只返回非受保护特征。",
  });
  if (productsById["content-library"]) {
    productsById["content-library"].attacks = [{
      id: "protected-attribute-inference",
      name: "受保护属性推断",
      brief: "反复调整月收入的大小边界，并轮换补贴与保障条件，再把返回的公开样本与恢复值拼接。",
      result: "运行攻击代码后，从范围响应恢复精确月收入、补贴状态和保障类型，并与公开字段拼接成完整记录。",
      metric: "完整属性恢复",
      value: "运行后计算",
      displayScore: 0,
      evidence: "代码实测",
      attackFamily: "属性推断",
      attackObject: "属性隐私",
      source: "当前页面居民演示数据",
      protocol: "街道与七岁年龄段范围；月收入二分边界查询；补贴与保障枚举；合并公开样本并拼接完整记录",
      limitation: "依赖响应包含稳定的公开居民编号，以及接口允许受保护字段参与范围筛选。",
    }];
    candidatesByProduct["content-library"] = [{
      id: "protected-attribute-inference",
      name: "受保护属性推断",
      applicable: true,
      executed: true,
      reason: "适用：受保护条件会改变每个范围返回的公开样本集合，多个集合可用于恢复隐藏属性。",
    }];
  }
  if (productsById["finance-aggregate"]) Object.assign(productsById["finance-aggregate"], {
    name: "居民群体统计查询",
    tagline: "按居民范围只返回三个受保护特征的均值或类别分布。",
    inputLabel: "居民范围",
    inputValue: "街道=07 ∧ 年龄≥60",
    callLabel: "生成居民统计",
    outputLabel: "统计结果",
    outputValue: "范围聚合统计",
    outputDetail: "最终响应只有平均月收入、补贴状态分布和保障类型分布。",
  });
  if (productsById["finance-aggregate"]) {
    productsById["finance-aggregate"].attacks = [{
      id: "aggregate-differencing",
      name: "相邻范围差分恢复",
      brief: "比较只相差一个居民的相邻范围统计，将均值还原为总量后做差，恢复该居民的受保护特征。",
      result: "运行攻击代码后，恢复月收入、补贴状态和保障类型，并与公开字段拼接成完整记录。",
      metric: "完整记录恢复",
      value: "运行后计算",
      displayScore: 0,
      evidence: "代码实测",
      attackFamily: "聚合差分",
      attackObject: "属性隐私",
      source: "当前页面居民演示数据",
      protocol: "相同公开范围；年龄上界相差一个目标居民；均值乘样本数还原总量；相邻统计做差",
      limitation: "依赖可构造只相差一个居民的相邻范围、攻击者已知公开特征范围人数，并且聚合值未加噪。",
    }];
    candidatesByProduct["finance-aggregate"] = [{
      id: "aggregate-differencing",
      name: "相邻范围差分恢复",
      applicable: true,
      executed: true,
      reason: "适用：攻击者可由公开特征计算范围人数，再对未加噪聚合值执行相邻范围差分。",
    }];
  }
  if (productsById["finance-derived"]) Object.assign(productsById["finance-derived"], {
    name: "居民派生与处理查询",
    tagline: "先用有限条件筛选居民数据，再执行重采样、子采样或合成数据生成。",
    inputLabel: "筛选与加工设置",
    inputValue: "街道01—05 · 老年 · 家庭人数1—2人 · 有放回重采样 · 返回12条",
    callLabel: "生成加工数据",
    flow: ["选择居民数据", "执行采样或合成", "交付加工后数据"],
    outputLabel: "加工结果",
    outputValue: "12 条加工样本",
    outputDetail: "返回筛选后经过重采样、无放回子采样或合成生成的居民数据。",
  });
  if (productsById["finance-derived"]?.attacks?.length >= 3) {
    Object.assign(productsById["finance-derived"].attacks[0], {
      name: "重采样成员暴露",
      brief: "比较多次有放回重采样输出中同一来源记录的重复出现情况。",
      result: "高频重复出现的居民记录更容易被判断为原始数据成员。",
    });
    Object.assign(productsById["finance-derived"].attacks[1], {
      name: "子样本关联",
      brief: "将无放回子采样返回的公开字段与外部居民特征组合匹配。",
      result: "部分加工样本可被重新关联到原始居民候选范围。",
    });
    Object.assign(productsById["finance-derived"].attacks[2], {
      name: "合成样本逼近",
      brief: "分析合成数据中反复保留的稀有字段组合。",
      result: "稀有组合可能过度接近原始居民记录并泄露其属性范围。",
    });
  }
  if (productsById["city-verify"]) Object.assign(productsById["city-verify"], {
    tagline: "输入匿名居民签名，选择政策项目、核验季度和政策地区，只返回是否符合受惠条件。",
    inputLabel: "资格核验条件",
    inputValue: "9F2C-7A18-D4E6-03B9-AC51 · 养老服务补贴 · 2026年第3季度 · 东城区",
    callLabel: "核验是否符合",
    outputLabel: "核验结果",
    outputValue: "符合",
    outputDetail: "对外只返回符合或不符合，不返回居民原始记录和政策判定细节。",
  });
  if (productsById["city-verify"]) {
    productsById["city-verify"].attacks = [{
      id: "qualification-matrix-recovery",
      name: "居民资格矩阵恢复",
      brief: "固定居民身份签名，枚举政策项目、核验季度和政策地区，并记录每次符合或不符合的真实响应。",
      result: "运行攻击代码后，将所有符合响应拼接为居民的政策资格矩阵。",
      metric: "资格组合恢复",
      value: "运行后计算",
      displayScore: 0,
      evidence: "代码实测",
      attackFamily: "属性枚举",
      attackObject: "政策资格隐私",
      source: "当前页面居民资格演示数据",
      protocol: "30 个居民签名；3 项政策；3 个季度；3 个地区；调用产品同一符合/不符合核验逻辑",
      limitation: "恢复范围受已知居民签名集合和可用核验次数限制。",
    }];
    candidatesByProduct["city-verify"] = [{
      id: "qualification-matrix-recovery",
      name: "居民资格矩阵恢复",
      applicable: true,
      executed: true,
      reason: "适用：重复提交政策、季度和地区组合，可以将符合响应拼接为居民资格矩阵。",
    }];
  }
  if (productsById["content-voice"]) Object.assign(productsById["content-voice"], {
    name: "居民人脸身份核验",
    tagline: "将待核验人脸与居民身份签名对应的登记人脸进行同一性核验。",
    inputLabel: "居民身份签名",
    inputValue: "9F2C-7A18-D4E6-03B9-AC51",
    callLabel: "核验居民身份",
    outputLabel: "核验结果",
    outputValue: "认证",
    outputDetail: "对外只返回认证或不认证，不返回人脸相似度或登记模板。",
  });
  if (productsById["content-voice"]) {
    productsById["content-voice"].attacks = [{
      id: "face-boundary-hill-climb",
      name: "连续人脸爬山",
      brief: "从一张辅助合成人脸起步，在对齐后的图像空间中做小幅连续扰动；每轮同时测试上升与下降方向，只保留离线评估相似度上升的一步。",
      result: "运行代码后，按时间顺序展示连续、单调上升的接受路径，并单独列出被拒绝的反向探针。",
      metric: "离线评估相似度",
      value: "运行后计算",
      displayScore: 0,
      evidence: "代码实测",
      attackFamily: "连续图像空间爬山",
      attackObject: "登记人脸的近似外观",
      source: "当前页面 AI 合成起点与对齐的演示登记照",
      protocol: "单一合成起点；连续图像空间小步扰动；离线评估器计算 280 维描述相似度；接受值严格单调上升；反向探针单独标注",
      limitation: "纯离线机制演示，不连接真实身份系统。产品对外仍只返回“认证/不认证”；连续相似度只属于离线评估层，不是攻击者可见的产品输出。",
    }];
    candidatesByProduct["content-voice"] = [{
      id: "face-boundary-hill-climb",
      name: "连续人脸爬山",
      applicable: true,
      executed: true,
      reason: "离线机制演示：代码对连续小步扰动做实际描述评估，只保留更接近演示登记照的一步。",
    }];
  }
  if (productsById["finance-verify"]) {
    Object.assign(productsById["finance-verify"], {
      name: "账户归属核验",
      tagline: "核验企业主体（实体一）与银行账户（实体二）之间是否存在账户归属关系。",
      inputLabel: "两主体关系核验",
      inputValue: "远澜科技｜统一社会信用代码 91310000MA7K2X8P6Q · 东海银行｜账户尾号 8421",
      callLabel: "核验账户归属",
      outputLabel: "核验结果",
      outputValue: "认证",
      outputDetail: "对外只返回认证或非认证，不返回账户明细或底层关系记录。",
    });
    productsById["finance-verify"].attacks = [{
      id: "relationship-enumeration",
      name: "账户归属关系枚举",
      brief: "攻击者已知一批企业标识和一批账户标识，但不知道它们之间的对应关系；通过反复替换两个输入，用“认证”响应逐步恢复未公开的企业—账户映射。",
      result: "在 100 个企业与 100 个账户的 10,000 个候选配对中，按可用预算执行枚举，并将所有返回“认证”的配对拼接为关系集。",
      metric: "真实关系恢复率",
      value: "运行后计算",
      displayScore: 0,
      evidence: "代码实测",
      attackFamily: "关系枚举",
      attackObject: "未公开的企业—账户映射",
      source: "当前页面 100 条合成企业—账户归属关系",
      protocol: "已知企业候选集与账户候选集，映射关系未知；100 个企业；100 个账户；10,000 个候选配对；固定核验预算",
      limitation: "只有在调用者可任意选择两个主体、稳定获得二元结果，且缺少主体授权、频率限制和异常枚举检测时才适用。若每次核验都要求证明控制企业或账户中的一方，则该攻击不成立。",
    }];
    candidatesByProduct["finance-verify"] = [{
      id: "relationship-enumeration",
      name: "账户归属关系枚举",
      applicable: true,
      executed: true,
      reason: "条件适用：调用者可任意替换两个主体，且系统缺少主体授权、频率限制和异常枚举检测。",
    }];
  }
  const creditProductDefinitions = {
    "finance-index": {
      name: "企业信用风险指数",
      tagline: "在同一批100家模拟企业上，用六个信用维度形成0—100的连续风险指数。",
      inputLabel: "已发布企业",
      callLabel: "读取风险指数",
      flow: ["读取六维信用记录", "应用内部真实公式", "发布连续风险指数"],
      outputLabel: "企业风险指数",
      outputDetail: "产品对既定企业发布一位小数风险指数；近90天逾期率参与计算但不直接公开。",
      attack: {
        id: "credit-index-sensitive-inference",
        name: "未知公式学习与逾期率反演",
        brief: "攻击者用60家六维特征全知的参考企业及其公开指数拟合未知评分公式，再用目标企业的五个公开维度和指数反推出近90天逾期率。",
        result: "运行攻击代码后，对40家目标企业生成逾期率估计并与真实值对照。",
        metric: "逾期率平均绝对误差",
        value: "运行后计算",
        displayScore: 0,
        evidence: "代码实测",
        attackFamily: "规则学习与属性反演",
        attackObject: "近90天逾期率",
        source: "同一批100家模拟企业信用数据",
        protocol: "60家参考企业六维全知；40家目标企业仅五维公开；攻击代码只读取产品输出，不读取页面展示的真实公式",
        limitation: "依赖参考企业与目标企业使用同一稳定规则，且攻击者拥有足够多的完整参考样本。",
      },
    },
    "city-grade": {
      name: "企业信用风险等级",
      tagline: "在同一批100家模拟企业上，将相同风险指数按固定阈值发布为A—D四个等级。",
      inputLabel: "已发布企业",
      callLabel: "读取风险等级",
      flow: ["读取同一六维记录", "计算内部风险指数", "按固定阈值发布等级"],
      outputLabel: "企业风险等级",
      outputDetail: "产品只公开A—D等级，不公开连续指数和近90天逾期率。",
      attack: {
        id: "credit-grade-sensitive-inference",
        name: "等级规则学习与逾期区间反演",
        brief: "攻击者用60家完整参考企业的六维特征和公开等级学习有序分级方向，再由目标企业的五个公开维度与等级反推出逾期率兼容区间。",
        result: "运行攻击代码后，对40家目标企业输出可能的逾期率区间；离散等级造成的区间明显宽于连续指数反演。",
        metric: "真实逾期率区间覆盖率",
        value: "运行后计算",
        displayScore: 0,
        evidence: "代码实测",
        attackFamily: "有序规则学习与属性反演",
        attackObject: "近90天逾期率区间",
        source: "与030501相同的100家模拟企业信用数据",
        protocol: "60家参考企业六维全知；40家目标企业仅五维公开；只使用A—D等级训练排序代理模型",
        limitation: "等级只提供区间约束，通常无法恢复精确逾期率；结果依赖参考样本覆盖每个等级。",
      },
    },
    "content-rank": {
      name: "企业信用风险排名",
      tagline: "在同一批100家模拟企业上，按相同风险指数从高到低发布风险名次和百分位。",
      inputLabel: "榜单企业",
      callLabel: "读取风险排名",
      flow: ["计算同一风险指数", "与100家企业比较", "发布风险名次与百分位"],
      outputLabel: "企业风险排名",
      outputDetail: "第1名风险最高；产品只公开相对位置，不公开连续指数和近90天逾期率。",
      attack: {
        id: "credit-rank-sensitive-inference",
        name: "排序规则学习与逾期率反演",
        brief: "攻击者用60家完整参考企业的六维特征和公开名次学习成对排序方向，再寻找能让目标企业落在其公开名次附近的逾期率。",
        result: "运行攻击代码后，对40家目标企业生成与公开排名一致的逾期率估计。",
        metric: "逾期率平均绝对误差",
        value: "运行后计算",
        displayScore: 0,
        evidence: "代码实测",
        attackFamily: "排序学习与属性反演",
        attackObject: "近90天逾期率",
        source: "与030501相同的100家模拟企业信用数据",
        protocol: "60家参考企业六维全知；40家目标企业仅五维公开；根据名次对训练线性排序代理模型",
        limitation: "排名只保留相对顺序，参照集合变化会降低反演稳定性，精度通常弱于连续指数。",
      },
    },
    "finance-model": {
      name: "企业违约预测 API",
      tagline: "输入单家企业的六维信用信息，返回未来90天违约概率。",
      inputLabel: "待预测企业",
      callLabel: "预测90天违约",
      flow: ["读取单家企业信用记录", "执行违约概率模型", "返回概率与风险标签"],
      outputLabel: "未来90天违约概率",
      outputDetail: "近90天逾期率参与模型预测，但不在 API 响应中直接返回。",
      attack: {
        id: "default-api-sensitive-inference",
        name: "预测规则学习与逾期率反演",
        brief: "攻击者用60家完整参考企业的六维特征和 API 概率响应学习预测规则，再结合40家目标企业的五个公开维度与概率响应反推近90天逾期率。",
        result: "运行攻击代码后，对40家目标企业生成逾期率估计并与模拟真值对照。",
        metric: "逾期率平均绝对误差",
        value: "运行后计算",
        displayScore: 0,
        evidence: "代码实测",
        attackFamily: "预测规则学习与属性反演",
        attackObject: "近90天逾期率",
        source: "与030501—030503相同的100家模拟企业信用数据",
        protocol: "60家参考企业六维全知；40家目标企业仅五维公开；只读取 API 概率响应学习代理预测规则",
        limitation: "依赖 API 返回足够精细的概率，且参考企业与目标企业使用同一稳定预测规则。",
      },
    },
  };
  Object.entries(creditProductDefinitions).forEach(([productId, definition]) => {
    const product = productsById[productId];
    if (!product) return;
    Object.assign(product, {
      name: definition.name,
      tagline: definition.tagline,
      inputLabel: definition.inputLabel,
      inputValue: `${creditExampleRecord.name ?? "模拟企业"}｜${creditExampleRecord.id ?? "CR-073"}`,
      callLabel: definition.callLabel,
      flow: definition.flow,
      outputLabel: definition.outputLabel,
      outputValue: creditOutputText(productId, creditExampleRecord),
      outputDetail: definition.outputDetail,
      attacks: [definition.attack],
    });
    candidatesByProduct[productId] = [{
      id: definition.attack.id,
      name: definition.attack.name,
      applicable: true,
      executed: true,
      reason: `适用：${definition.attack.brief}`,
    }];
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
      schema: residentStore.schema.map((field) => protectedResidentFieldKeys.has(field.key)
        ? { ...field, label: `${field.label}（受保护）` }
        : field),
      defaults: [
        { field: "street", operator: "eq", value: "07" },
        { field: "age", operator: "gte", value: "60" },
        { field: "monthlyIncome", operator: "lte", value: "4500" },
      ],
    },
    "finance-aggregate": {
      schema: residentStore.schema.map((field) => protectedResidentFieldKeys.has(field.key)
        ? { ...field, label: `${field.label}（受保护）` }
        : field),
      defaults: [
        { field: "street", operator: "eq", value: "07" },
        { field: "age", operator: "gte", value: "60" },
      ],
    },
    "finance-derived": {
      schema: [
        { key: "streetRange", label: "街道范围", type: "enum", values: ["01—05", "07—09"] },
        { key: "ageStage", label: "年龄阶段", type: "enum", values: ["青年（18—39岁）", "中年（40—59岁）", "老年（60岁及以上）"] },
        { key: "occupation", label: "职业", type: "enum", values: ["退休", "学生", "其他职业", "无业"] },
        { key: "householdRange", label: "家庭人数", type: "enum", values: ["1—2人", "3—4人", "5人及以上"] },
        { key: "processingMethod", label: "加工方式", type: "enum", values: ["有放回重采样", "无放回子采样", "合成数据"] },
        { key: "sampleSize", label: "返回样本数", type: "enum", values: ["6", "12", "20"] },
      ],
      defaults: [
        { field: "streetRange", operator: "eq", value: "01—05" },
        { field: "ageStage", operator: "eq", value: "老年（60岁及以上）" },
        { field: "householdRange", operator: "eq", value: "1—2人" },
        { field: "processingMethod", operator: "eq", value: "有放回重采样" },
        { field: "sampleSize", operator: "eq", value: "12" },
      ],
    },
    "city-verify": {
      schema: [
        { key: "credential", label: "居民身份签名", type: "enum", values: qualificationProfiles.slice(0, 6).map((profile) => profile.credential) },
        { key: "policy", label: "政策项目", type: "enum", values: qualificationPolicies },
        { key: "period", label: "核验季度", type: "enum", values: qualificationPeriods },
        { key: "region", label: "政策地区", type: "enum", values: qualificationRegions },
      ],
      defaults: [
        { field: "credential", operator: "eq", value: "9F2C-7A18-D4E6-03B9-AC51" },
        { field: "policy", operator: "eq", value: "养老服务补贴" },
        { field: "period", operator: "eq", value: "2026年第3季度" },
        { field: "region", operator: "eq", value: "东城区" },
      ],
    },
    "content-voice": {
      schema: [
        { key: "identitySignature", label: "居民身份签名", type: "enum", values: ["9F2C-7A18-D4E6-03B9-AC51", "4A8D-21F0-B7C3-6E92-D145"] },
      ],
      defaults: [
        { field: "identitySignature", operator: "eq", value: "9F2C-7A18-D4E6-03B9-AC51" },
      ],
    },
    "finance-verify": {
      schema: [
        { key: "enterpriseEntity", label: "企业主体（实体一）", type: "enum", values: accountEnterpriseOptions },
        { key: "accountEntity", label: "银行账户（实体二）", type: "enum", values: accountEntityOptions },
      ],
      defaults: [
        { field: "enterpriseEntity", operator: "eq", value: "远澜科技｜统一社会信用代码 91310000MA7K2X8P6Q" },
        { field: "accountEntity", operator: "eq", value: "东海银行｜账户尾号 8421" },
      ],
    },
  };
  creditProductIds.forEach((productId) => {
    structuredProductConfigs[productId] = {
      schema: [{
        key: "creditEnterprise",
        label: "模拟企业",
        type: "enum",
        values: enterpriseCreditStore.records.map((record) => `${record.name}｜${record.id}`),
      }],
      defaults: [{
        field: "creditEnterprise",
        operator: "eq",
        value: `${creditExampleRecord.name ?? "模拟企业"}｜${creditExampleRecord.id ?? "CR-073"}`,
      }],
    };
  });
  const residentQueryProductIds = new Set(["city-existence", "content-library", "finance-aggregate"]);
  const residentProcessingSettingKeys = new Set(["processingMethod", "sampleSize"]);
  let seriesIndex = 0;
  let productIndex = 0;
  let phase = 0;
  let attackStep = 0;
  let viewMode = "interface";
  let inputValue = "";
  let structuredConditions = structuredProductConfigs["city-existence"].defaults.map((condition) => ({ ...condition }));
  const defaultFaceImageUrl = "assets/resident-face-verification-demo.jpg";
  let faceImageUrl = defaultFaceImageUrl;
  let faceImageMatchesResident = true;
  let timers = [];
  const productUsageLimitOptions = [100, 500, 1000];
  const ragProductUsageLimitOptions = [1, 10, 100];
  const productUsageLimitOptionsFor = (product) => ragProductIds.has(product.id) ? ragProductUsageLimitOptions : productUsageLimitOptions;
  const productUsageInitialLimitFor = (product) => productUsageLimitOptionsFor(product)[0];
  const productUsageLimits = new Map(Object.values(productsById).map((product) => [product.id, productUsageInitialLimitFor(product)]));
  const productUsageRemaining = new Map(Object.values(productsById).map((product) => [product.id, productUsageInitialLimitFor(product)]));
  const membershipRecoverySteps = [
    { name: "准备候选居民", title: "建立候选居民集合", evidence: "候选池包含 112 条已知特征记录，其中真实数据库成员对攻击者不可见。" },
    { name: "执行存在性查询", title: "代码正在调用存在性查询", evidence: "实际查询次数、缓存命中和新执行次数将在运行后生成。" },
    { name: "生成恢复数据集", title: "根据真实响应形成成员数据集", evidence: "恢复数量、遗漏和误判均由代码与真实成员集对照计算。" },
  ];
  const creditInferenceSteps = [
    { name: "划分攻击者知识", title: "建立参考集与目标集", evidence: "60家参考企业六维特征全知；40家目标企业只暴露五个非敏感维度和产品输出。" },
    { name: "学习未知规则", title: "只用参考样本训练代理规则", evidence: "攻击代码不读取页面展示的真实公式，只从参考企业的特征—输出对中学习。" },
    { name: "反演敏感维度", title: "搜索近90天逾期率", evidence: "固定目标企业五个公开维度，寻找与公开指数、等级、排名或违约概率最一致的逾期率。" },
    { name: "对照模拟真值", title: "计算反演误差", evidence: "真实逾期率只在最后用于离线评估，不进入攻击者训练输入。" },
  ];
  const faceHillClimbSteps = [
    { name: "选定连续起点", title: "对齐合成起点", evidence: "从一张辅助合成人脸起步，不再把彼此独立的人脸库当成连续路径。" },
    { name: "提交小步探针", title: "生成连续小幅扰动", evidence: "每一步只沿对齐后的图像空间小幅移动，同时测试反向探针。" },
    { name: "保留上升路径", title: "仅接受相似度上升的一步", evidence: "接受路径的离线评估相似度严格单调上升；下降探针另行灰显。" },
    { name: "核对认证边界", title: "检查最终路径是否越过认证阈值", evidence: "产品对外只显示认证或不认证；连续相似度只用于当前离线机制评估。" },
  ];
  const membershipRecoveryDecoys = Array.from({ length: 12 }, (_, index) => {
    const base = residentStore.records[(index * 7 + 3) % residentStore.records.length] ?? {};
    return {
      ...base,
      residentId: `C-${9001 + index}`,
      age: Math.min(90, Number(base.age ?? 30) + (index % 3) + 1),
    };
  });
  const membershipRecoveryCandidates = [...residentStore.records, ...membershipRecoveryDecoys];
  const membershipRecoveryFieldOrder = ["street", "age", "occupation", "householdSize", "housing", "monthlyIncome", "subsidyStatus", "insurance"];
  const membershipRecoverySavedRuns = new Map();
  const seriesRecoveryProductIds = new Set([
    "city-existence", "content-library", "finance-graph", "finance-graph-query", "finance-aggregate", "finance-derived", "city-verify", "content-voice", "finance-verify",
    "finance-index", "city-grade", "content-rank", "city-rag", "content-vision", "content-speech", "finance-model", "content-multimodal", "model-distillation", "finance-gradient", "city-gradient",
  ]);
  const graphCompanies = ["远澜科技", "海岸智造", "星桥能源", "海岳控股", "国创资本", "蓝港产业基金", "新源储能", "城际数科", "东浦制造", "安禾服务"];
  const graphRelations = ["控制关系", "股权关系", "项目关系"];
  const graphRagBackendRelations = [
    "远澜科技 → 海岸智造 · 持股 62%",
    "海岸智造 → 星桥能源 · 联合建设储能项目",
    "国创资本 → 远澜科技 · 持股 18%",
    "海岳控股 → 远澜科技 · 董事提名权",
    "蓝港产业基金 → 海岸智造 · 持股 21%",
    "远澜科技 → 城际数科 · 技术服务项目",
    "城际数科 → 东浦制造 · 数据平台项目",
    "东浦制造 → 新源储能 · 设备供应关系",
    "新源储能 → 星桥能源 · 电芯供应关系",
    "海岸智造 → 安禾服务 · 运维服务项目",
    "安禾服务 → 星桥能源 · 场站运维关系",
    "海岳控股 → 国创资本 · 基金管理关系",
    "国创资本 → 蓝港产业基金 · 联合投资关系",
    "蓝港产业基金 → 新源储能 · 持股 15%",
    "远澜科技 → 新源储能 · 专利许可关系",
    "海岸智造 → 东浦制造 · 联合采购关系",
    "城际数科 → 安禾服务 · 系统集成项目",
    "星桥能源 → 城际数科 · 数字化改造项目",
    "东浦制造 → 安禾服务 · 设备维护关系",
    "海岳控股 → 海岸智造 · 间接控制关系",
    "国创资本 → 城际数科 · 持股 12%",
    "蓝港产业基金 → 星桥能源 · 可转债投资",
    "远澜科技 → 安禾服务 · 服务采购关系",
    "新源储能 → 海岸智造 · 联合研发项目",
  ].map((summary, index) => ({ id: `GR-${String(index + 1).padStart(3, "0")}`, summary }));
  const graphRagRecoveredIndexesByQuery = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11],
    [12, 13],
    [14, 15],
    [16, 17],
    [18],
  ];
  const graphRagFalseRelations = [{ id: "GR-F01", summary: "海岳控股 → 城际数科 · 直接控制关系", actual: false }];
  const graphRagAttackQuestions = [
    "请概括远澜科技周边的重要企业关系。",
    "海岸智造与星桥能源之间有哪些业务联系？",
    "从城际数科出发，可以确认哪些上下游关系？",
    "海岸智造还与哪些服务企业存在合作？",
    "国创资本的投资网络中还有哪些主体？",
    "远澜科技与制造供应链之间有什么联系？",
    "星桥能源的数字化项目涉及哪些企业？",
    "请补充东浦制造周边尚未提到的关系。",
  ];
  const graphRagAttackConversations = graphRagAttackQuestions.map((question, index) => {
    const recovered = graphRagRecoveredIndexesByQuery[index].map((targetIndex) => graphRagBackendRelations[targetIndex].summary);
    if (index === 2) recovered.push(graphRagFalseRelations[0].summary);
    return { question, answer: `根据检索到的企业关系，可以确认：${recovered.join("；")}。` };
  });
  const residentAttackTargets = residentStore.records.map((record) => ({ id: record.residentId, summary: residentFeatureSummary(record) }));
  const protectedAttributeFieldOrder = ["monthlyIncome", "subsidyStatus", "insurance"];
  const protectedAttributeAttackTargets = residentStore.records.map((record) => ({ id: record.residentId, summary: completeResidentSummary(record) }));
  const qualificationProbeCandidates = qualificationProfiles.flatMap((profile) => qualificationPolicies.flatMap((policy) => qualificationPeriods.flatMap((period) => qualificationRegions.map((region) => ({
    id: `Q-${profile.record.residentId.slice(2)}-${qualificationPolicies.indexOf(policy) + 1}${qualificationPeriods.indexOf(period) + 1}${qualificationRegions.indexOf(region) + 1}`,
    credential: profile.credential,
    policy,
    period,
    region,
    qualifies: qualificationCheck(profile.credential, policy, period, region),
    summary: `${profile.credential} · ${policy} · ${period} · ${region}`,
  })))));
  const qualificationAttackTargets = qualificationProbeCandidates.filter((candidate) => candidate.qualifies).map((candidate) => ({ id: candidate.id, summary: `${candidate.summary} · 符合` }));
  const syntheticTargetSet = (prefix, summaries) => Array.from({ length: 100 }, (_, index) => ({
    id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
    summary: `${summaries[index % summaries.length]} · 样本 ${String(index + 1).padStart(3, "0")}`,
  }));
  const creditAttackTargets = creditTargetRecords.map((record) => ({
    id: record.id,
    summary: `${record.name} · 近90天逾期率 ${record.overdueRate.toFixed(1)}%`,
  }));
  const recoveryAttackConfigs = new Map([
    ["content-library", { queriesPerTarget: 10, groundTruthLabel: "系统完整居民记录", recoveredLabel: "攻击拼接恢复的完整记录", truthMetricLabel: "系统完整记录", recoveredMetricLabel: "完整恢复记录", missedMetricLabel: "未完整恢复记录", falseMetricLabel: "错误拼接记录", targets: protectedAttributeAttackTargets }],
    ["finance-graph", { queriesPerTarget: 1, groundTruthLabel: "Chatbot 后台企业关系图谱", recoveredLabel: "从 Chatbot 回答恢复的关系图谱", truthMetricLabel: "后台真实关系", recoveredMetricLabel: "成功恢复关系", missedMetricLabel: "未恢复关系", falseMetricLabel: "错误推断关系", targets: graphRagBackendRelations }],
    ["finance-graph-query", { queriesPerTarget: 7, groundTruthLabel: "系统真实关系数据集", recoveredLabel: "攻击恢复关系数据集", truthMetricLabel: "系统真实关系", recoveredMetricLabel: "成功恢复", missedMetricLabel: "关系遗漏", falseMetricLabel: "错误关系", targets: Array.from({ length: 100 }, (_, index) => ({ id: `REL-${String(index + 1).padStart(3, "0")}`, summary: `${graphCompanies[index % graphCompanies.length]} → ${graphCompanies[(index * 3 + 4) % graphCompanies.length]} · ${graphRelations[index % graphRelations.length]}` })) }],
    ["finance-aggregate", { queriesPerTarget: 2, groundTruthLabel: "系统完整居民记录", recoveredLabel: "由相邻统计拼接恢复的完整记录", truthMetricLabel: "系统完整记录", recoveredMetricLabel: "完整恢复记录", missedMetricLabel: "未完整恢复记录", falseMetricLabel: "错误拼接记录", targets: protectedAttributeAttackTargets }],
    ["finance-derived", { queriesPerTarget: 6, groundTruthLabel: "系统真实加工源数据集", recoveredLabel: "攻击恢复源数据集", truthMetricLabel: "系统源记录", recoveredMetricLabel: "成功恢复", missedMetricLabel: "源记录遗漏", falseMetricLabel: "非源记录误判", targets: residentAttackTargets }],
    ["city-verify", { queriesPerTarget: 27, groundTruthLabel: "系统真实居民资格矩阵", recoveredLabel: "攻击恢复居民资格矩阵", truthMetricLabel: "系统真实资格组合", recoveredMetricLabel: "成功恢复组合", missedMetricLabel: "资格组合遗漏", falseMetricLabel: "错误资格组合", targets: qualificationAttackTargets }],
    ["content-voice", { queriesPerTarget: 1, groundTruthLabel: "对齐的合成人脸起点", recoveredLabel: "连续爬山路径", truthMetricLabel: "接受步", recoveredMetricLabel: "最终相似度", missedMetricLabel: "拒绝探针", falseMetricLabel: "随机重启", targets: [{ id: "FACE-026", summary: "对齐后的辅助合成起点" }] }],
    ["finance-verify", { queriesPerTarget: 1, groundTruthLabel: "后台合成账户归属关系集", recoveredLabel: "攻击恢复账户归属关系集", truthMetricLabel: "后台真实关系", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复关系", falseMetricLabel: "错误关系", targets: Array.from(verifiedAccountRelationships.entries()).map(([enterprise, account], index) => ({ id: `ACC-${String(index + 1).padStart(3, "0")}`, enterprise, account, summary: `${enterprise} → ${account}` })) }],
    ["finance-index", { queriesPerTarget: 1, groundTruthLabel: "40家目标企业真实逾期率", recoveredLabel: "由连续指数反演的逾期率", truthMetricLabel: "目标企业", recoveredMetricLabel: "误差≤1个百分点", missedMetricLabel: "误差>1个百分点", falseMetricLabel: "错误推断", targets: creditAttackTargets }],
    ["city-grade", { queriesPerTarget: 1, groundTruthLabel: "40家目标企业真实逾期率", recoveredLabel: "由A—D等级反演的兼容区间", truthMetricLabel: "目标企业", recoveredMetricLabel: "真实值落入区间", missedMetricLabel: "真实值落在区间外", falseMetricLabel: "错误区间", targets: creditAttackTargets }],
    ["content-rank", { queriesPerTarget: 1, groundTruthLabel: "40家目标企业真实逾期率", recoveredLabel: "由风险名次反演的逾期率", truthMetricLabel: "目标企业", recoveredMetricLabel: "误差≤4个百分点", missedMetricLabel: "误差>4个百分点", falseMetricLabel: "错误推断", targets: creditAttackTargets }],
    ["city-rag", { queriesPerTarget: 4, groundTruthLabel: "Chatbot 后台政策语料", recoveredLabel: "从回答恢复的政策语料", truthMetricLabel: "后台真实片段", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复片段", falseMetricLabel: "错误片段", targets: syntheticTargetSet("POL", ["梧桐计划 · 申报资格条款", "养老补贴 · 收入门槛条款", "住房保障 · 家庭人数条款", "就业扶持 · 职业状态条款"]) }],
    ["content-vision", { queriesPerTarget: 5, groundTruthLabel: "视觉模型真实训练片段", recoveredLabel: "攻击恢复的训练片段特征", truthMetricLabel: "真实训练片段", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复片段", falseMetricLabel: "错误片段", targets: syntheticTargetSet("VIS", ["户外运动 · 跑步场景", "道路交通 · 骑行场景", "室内活动 · 健身场景", "公共空间 · 人群场景"]) }],
    ["content-speech", { queriesPerTarget: 5, groundTruthLabel: "语音模型真实训练语音", recoveredLabel: "攻击恢复的语音与说话人特征", truthMetricLabel: "真实训练语音", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复语音", falseMetricLabel: "错误语音", targets: syntheticTargetSet("SPK", ["说话人 A · 公共服务咨询", "说话人 B · 交通信息播报", "说话人 C · 政策问答语音", "说话人 D · 日常对话语音"]) }],
    ["finance-model", { queriesPerTarget: 1, groundTruthLabel: "40家目标企业真实逾期率", recoveredLabel: "由违约概率反演的逾期率", truthMetricLabel: "目标企业", recoveredMetricLabel: "误差≤1个百分点", missedMetricLabel: "误差>1个百分点", falseMetricLabel: "错误推断", targets: creditAttackTargets }],
    ["content-multimodal", { queriesPerTarget: 5, groundTruthLabel: "多模态模型真实上下文集", recoveredLabel: "攻击恢复的跨模态上下文", truthMetricLabel: "真实上下文", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复上下文", falseMetricLabel: "错误关联", targets: syntheticTargetSet("MM", ["海报画面 · 活动旁白 · 审核问题", "商品图片 · 宣传音频 · 合规问题", "街景视频 · 环境声音 · 场景问题", "人物照片 · 访谈语音 · 身份问题"]) }],
    ["model-distillation", { queriesPerTarget: 4, groundTruthLabel: "教师模型真实响应集", recoveredLabel: "从学生模型恢复的教师行为", truthMetricLabel: "教师真实行为", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复行为", falseMetricLabel: "错误行为", targets: syntheticTargetSet("DST", ["客户分类 · 教师标签 A", "客户分类 · 教师标签 B", "风险识别 · 教师置信度高", "风险识别 · 教师置信度低"]) }],
    ["finance-gradient", { queriesPerTarget: 6, groundTruthLabel: "梯度批次真实训练样本", recoveredLabel: "梯度反演恢复的训练样本", truthMetricLabel: "真实训练样本", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复样本", falseMetricLabel: "错误样本", targets: syntheticTargetSet("FG", ["企业现金流序列 · 违约标签 1", "企业负债序列 · 违约标签 0", "企业授信序列 · 风险标签高", "企业还款序列 · 风险标签低"]) }],
    ["city-gradient", { queriesPerTarget: 6, groundTruthLabel: "客流梯度真实训练样本", recoveredLabel: "梯度反演恢复的客流样本", truthMetricLabel: "真实客流样本", recoveredMetricLabel: "成功恢复", missedMetricLabel: "未恢复样本", falseMetricLabel: "错误样本", targets: syntheticTargetSet("CG", ["中心站 · 早高峰客流", "滨江站 · 晚高峰客流", "会展站 · 活动时段客流", "机场站 · 节假日客流"]) }],
  ]);
  const productRecoverySavedRuns = new Map();
  let membershipRecoveryRun = null;
  let productRecoveryRun = null;
  const faceDescriptorDimension = syntheticFaceLibrary.targetDescriptor.length;
  const faceVerificationThreshold = 0.94;
  const faceTemplateSimilarity = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);

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

  function ragResponseFor(product) {
    const responses = ragResponsesByProduct.get(product.id) ?? [];
    const selectedId = selectedRagQuestionIds.get(product.id);
    return responses.find((response) => response.id === selectedId) ?? responses[0] ?? null;
  }

  function publicRagAnswer(value) {
    return String(value ?? "")
      .replace(/\s*依据\s*[:：][\s\S]*$/u, "")
      .trim();
  }

  function ragMembershipResultFor(product) {
    return ragMembershipByProductCode.get(product.category) ?? {
      productCode: product.category,
      candidateCount: 0,
      memberCount: 0,
      nonmemberCount: 0,
      queryCount: 0,
      queriesPerCandidate: 0,
      rocAuc: 0,
      accuracyAtHalf: 0,
      meanMemberScore: 0,
      meanNonmemberScore: 0,
      scoreSource: "chatbot_answer_text_only",
    };
  }

  function productUsageLabel(product) {
    if (product.category.startsWith("0304")) return "核验次数";
    if (product.category.startsWith("0301")) return "查询次数";
    return "调用次数";
  }

  function productUsageCount(product) {
    return productUsageRemaining.get(product.id) ?? productUsageInitialLimitFor(product);
  }

  function productUsageLimit(product) {
    return productUsageLimits.get(product.id) ?? productUsageInitialLimitFor(product);
  }

  function renderProductUsageCounter(product) {
    const remaining = productUsageCount(product);
    const limit = productUsageLimit(product);
    return `<div class="product-usage-counter ${remaining === 0 ? "is-exhausted" : ""}" data-product-usage-counter><label><span>${productUsageLabel(product)}</span><select data-product-usage-limit aria-label="选择${productUsageLabel(product)}上限">${productUsageLimitOptionsFor(product).map((option) => `<option value="${option}" ${option === limit ? "selected" : ""}>${option}</option>`).join("")}</select></label><strong data-product-usage-value>${remaining}</strong><small>剩余</small></div>`;
  }

  function refreshProductUsageCounter(product = current().product) {
    const remaining = productUsageCount(product);
    const counter = root.querySelector("[data-product-usage-counter]");
    const value = root.querySelector("[data-product-usage-value]");
    if (counter && current().product.id === product.id) counter.classList.toggle("is-exhausted", remaining === 0);
    if (value && current().product.id === product.id) value.textContent = String(remaining);
    const runButton = root.querySelector("[data-run-product]");
    const rerunButton = root.querySelector("[data-rerun]");
    const attackButton = root.querySelector("[data-start-attack]");
    if (runButton instanceof HTMLButtonElement && current().product.id === product.id) runButton.disabled = remaining === 0 || (phase > 0 && phase < 3);
    if (rerunButton instanceof HTMLButtonElement && current().product.id === product.id) rerunButton.disabled = remaining === 0;
    if (attackButton instanceof HTMLButtonElement && current().product.id === product.id) attackButton.disabled = remaining === 0 || phase < 3;
  }

  function consumeProductUsage(product, amount = 1, refresh = true) {
    const remaining = productUsageCount(product);
    if (remaining < amount) {
      if (refresh) refreshProductUsageCounter(product);
      return false;
    }
    productUsageRemaining.set(product.id, remaining - amount);
    if (refresh) refreshProductUsageCounter(product);
    return true;
  }

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
    if (creditProductIds.has(product?.id)) return structuredConditions[0]?.value ?? product.inputValue;
    if (product?.id === "finance-derived") {
      return structuredConditions.map((condition) => `${fields.get(condition.field)?.label ?? condition.field}：${condition.value}`).join(" · ");
    }
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

  function membershipQueryKey(conditions) {
    return JSON.stringify(conditions
      .map((condition) => [condition.field, condition.operator, String(condition.value)])
      .sort((left, right) => left[0].localeCompare(right[0])));
  }

  function formatMembershipAttackConditions(conditions) {
    return conditions.map((condition) => `${residentFields.get(condition.field)?.label ?? condition.field} = ${condition.value}`).join(" ∧ ");
  }

  function simulateMembershipRecoveryBudget(queryBudget) {
    const cache = new Map();
    const runStats = { queryBudget, queryCount: 0, cacheHits: 0, cacheMisses: 0, quotaBlocked: 0 };
    const actualMemberIds = new Set(residentStore.records.map((record) => record.residentId));
    let budgetExhausted = false;
    const candidateResults = membershipRecoveryCandidates.map((candidate) => {
      const conditions = [];
      const trace = [];
      let predictedMember = true;
      let determined = false;
      if (budgetExhausted) return { candidate, actualMember: actualMemberIds.has(candidate.residentId), predictedMember: false, determined, trace };
      for (const field of membershipRecoveryFieldOrder) {
        if (runStats.queryCount >= queryBudget) {
          budgetExhausted = true;
          runStats.quotaBlocked = 1;
          predictedMember = false;
          break;
        }
        conditions.push({ field, operator: "eq", value: String(candidate[field]) });
        const key = membershipQueryKey(conditions);
        runStats.queryCount += 1;
        let exists;
        let cacheHit = false;
        if (cache.has(key)) {
          runStats.cacheHits += 1;
          cacheHit = true;
          exists = cache.get(key) === true;
        } else {
          runStats.cacheMisses += 1;
          exists = residentStore.records.some((record) => conditions.every((condition) => recordMatchesCondition(record, condition)));
          cache.set(key, exists);
        }
        const candidateMatches = membershipRecoveryCandidates.filter((record) => conditions.every((condition) => recordMatchesCondition(record, condition))).length;
        trace.push({
          conditions: conditions.map((condition) => ({ ...condition })),
          query: formatMembershipAttackConditions(conditions),
          exists,
          cacheHit,
          candidateMatches,
        });
        if (!exists) {
          predictedMember = false;
          determined = true;
          break;
        }
        if (trace.length === membershipRecoveryFieldOrder.length) determined = true;
      }
      return {
        candidate,
        actualMember: actualMemberIds.has(candidate.residentId),
        predictedMember: predictedMember && determined && trace.length === membershipRecoveryFieldOrder.length,
        determined,
        trace,
      };
    });
    const truePositives = candidateResults.filter((result) => result.actualMember && result.predictedMember).length;
    const falseNegatives = candidateResults.filter((result) => result.actualMember && !result.predictedMember).length;
    const falsePositives = candidateResults.filter((result) => !result.actualMember && result.predictedMember).length;
    const trueNegatives = candidateResults.filter((result) => !result.actualMember && !result.predictedMember).length;
    const recoveredRows = candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate);
    const recall = residentStore.records.length ? truePositives / residentStore.records.length : 0;
    return {
      ...runStats,
      candidateResults,
      recoveredRows,
      truePositives,
      falseNegatives,
      falsePositives,
      trueNegatives,
      recall,
      cacheSize: cache.size,
    };
  }

  productUsageLimitOptions.forEach((budget) => membershipRecoverySavedRuns.set(budget, simulateMembershipRecoveryBudget(budget)));

  function solveLinearSystem(matrix, vector) {
    const size = vector.length;
    const augmented = matrix.map((row, index) => [...row, vector[index]]);
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) {
        if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
      }
      [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
      const divisor = Math.abs(augmented[column][column]) < 1e-10 ? 1e-10 : augmented[column][column];
      for (let index = column; index <= size; index += 1) augmented[column][index] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = augmented[row][column];
        for (let index = column; index <= size; index += 1) augmented[row][index] -= factor * augmented[column][index];
      }
    }
    return augmented.map((row) => row[size]);
  }

  function normalizedCreditVector(record, sensitiveValue = record[creditSensitiveFeatureKey]) {
    return creditFeatureKeys.map((key) => {
      const value = key === creditSensitiveFeatureKey ? sensitiveValue : record[key];
      return Number(value) / creditFeatureScales[key];
    });
  }

  function fitCreditLinearModel(records, outputForRecord) {
    const width = creditFeatureKeys.length + 1;
    const matrix = Array.from({ length: width }, () => Array(width).fill(0));
    const vector = Array(width).fill(0);
    records.forEach((record) => {
      const row = [1, ...normalizedCreditVector(record)];
      const output = Number(outputForRecord(record));
      for (let left = 0; left < width; left += 1) {
        vector[left] += row[left] * output;
        for (let right = 0; right < width; right += 1) matrix[left][right] += row[left] * row[right];
      }
    });
    for (let index = 1; index < width; index += 1) matrix[index][index] += 1e-7;
    return solveLinearSystem(matrix, vector);
  }

  function predictCreditLinear(weights, record, sensitiveValue = record[creditSensitiveFeatureKey]) {
    const vector = normalizedCreditVector(record, sensitiveValue);
    return weights[0] + vector.reduce((sum, value, index) => sum + weights[index + 1] * value, 0);
  }

  function inverseCreditLinear(weights, targetRecord, observedOutput) {
    const sensitiveIndex = creditFeatureKeys.indexOf(creditSensitiveFeatureKey);
    const knownContribution = creditFeatureKeys.reduce((sum, key, index) => key === creditSensitiveFeatureKey
      ? sum
      : sum + weights[index + 1] * Number(targetRecord[key]) / creditFeatureScales[key], weights[0]);
    const sensitiveWeight = weights[sensitiveIndex + 1];
    if (Math.abs(sensitiveWeight) < 1e-8) return 15;
    const normalized = (Number(observedOutput) - knownContribution) / sensitiveWeight;
    return Math.max(0, Math.min(30, normalized * creditFeatureScales[creditSensitiveFeatureKey]));
  }

  function creditLogit(probability) {
    const bounded = Math.max(0.0001, Math.min(0.9999, Number(probability)));
    return Math.log(bounded / (1 - bounded));
  }

  function fitCreditPairwiseDirection(records, orderForRecord) {
    const weights = Array(creditFeatureKeys.length).fill(0);
    const examples = records.map((record) => ({ record, vector: normalizedCreditVector(record), order: Number(orderForRecord(record)) }));
    for (let epoch = 0; epoch < 90; epoch += 1) {
      const learningRate = 0.035 / (1 + epoch * 0.018);
      for (let left = 0; left < examples.length; left += 1) {
        for (let right = left + 1; right < examples.length; right += 1) {
          if (examples[left].order === examples[right].order) continue;
          const direction = examples[left].order > examples[right].order ? 1 : -1;
          const difference = examples[left].vector.map((value, index) => value - examples[right].vector[index]);
          const margin = direction * difference.reduce((sum, value, index) => sum + weights[index] * value, 0);
          if (margin < 0.08) difference.forEach((value, index) => { weights[index] += learningRate * direction * value; });
        }
      }
    }
    const norm = Math.sqrt(weights.reduce((sum, value) => sum + value * value, 0)) || 1;
    return weights.map((value) => value / norm);
  }

  function predictCreditDirection(weights, record, sensitiveValue = record[creditSensitiveFeatureKey]) {
    return normalizedCreditVector(record, sensitiveValue).reduce((sum, value, index) => sum + weights[index] * value, 0);
  }

  function learnedGradeThresholds(weights, referenceRecords) {
    const gradeOrder = ["A", "B", "C", "D"];
    const scoresByGrade = new Map(gradeOrder.map((grade) => [grade, []]));
    referenceRecords.forEach((record) => scoresByGrade.get(record.grade)?.push(predictCreditDirection(weights, record)));
    return gradeOrder.slice(0, -1).map((grade, index) => {
      const lowerScores = scoresByGrade.get(grade) ?? [];
      const upperScores = scoresByGrade.get(gradeOrder[index + 1]) ?? [];
      const lowerEdge = lowerScores.length ? Math.max(...lowerScores) : index;
      const upperEdge = upperScores.length ? Math.min(...upperScores) : index + 1;
      return (lowerEdge + upperEdge) / 2;
    });
  }

  function inverseCreditGradeRange(weights, thresholds, target, grade) {
    const gradeIndex = { A: 0, B: 1, C: 2, D: 3 }[grade] ?? 0;
    const sensitiveIndex = creditFeatureKeys.indexOf(creditSensitiveFeatureKey);
    const sensitiveWeight = weights[sensitiveIndex];
    const sensitiveScale = creditFeatureScales[creditSensitiveFeatureKey];
    const publicContribution = creditFeatureKeys.reduce((sum, key, index) => key === creditSensitiveFeatureKey
      ? sum
      : sum + weights[index] * Number(target[key]) / creditFeatureScales[key], 0);
    const scoreMinimum = gradeIndex === 0 ? Number.NEGATIVE_INFINITY : thresholds[gradeIndex - 1];
    const scoreMaximum = gradeIndex === 3 ? Number.POSITIVE_INFINITY : thresholds[gradeIndex];
    if (Math.abs(sensitiveWeight) < 1e-8) {
      return { estimate: sensitiveScale / 2, minimum: 0, maximum: sensitiveScale, publicContribution, scoreMinimum, scoreMaximum };
    }
    const inverseScore = (score) => (score - publicContribution) * sensitiveScale / sensitiveWeight;
    const rawMinimum = sensitiveWeight > 0 ? inverseScore(scoreMinimum) : inverseScore(scoreMaximum);
    const rawMaximum = sensitiveWeight > 0 ? inverseScore(scoreMaximum) : inverseScore(scoreMinimum);
    const minimum = Math.max(0, Number.isFinite(rawMinimum) ? rawMinimum : 0);
    const maximum = Math.min(sensitiveScale, Number.isFinite(rawMaximum) ? rawMaximum : sensitiveScale);
    if (minimum <= maximum) {
      return { estimate: (minimum + maximum) / 2, minimum, maximum, publicContribution, scoreMinimum, scoreMaximum };
    }
    const candidates = Array.from({ length: 121 }, (_, index) => index * 0.25);
    const targetScore = gradeIndex === 0
      ? thresholds[0]
      : gradeIndex === 3
        ? thresholds[2]
        : (thresholds[gradeIndex - 1] + thresholds[gradeIndex]) / 2;
    const estimate = candidates.sort((left, right) => Math.abs(predictCreditDirection(weights, target, left) - targetScore) - Math.abs(predictCreditDirection(weights, target, right) - targetScore))[0];
    return { estimate, minimum: estimate, maximum: estimate, publicContribution, scoreMinimum, scoreMaximum };
  }

  function simulateCreditInferenceAttack(productId, queryBudget) {
    const config = recoveryAttackConfigs.get(productId);
    if (!config) return null;
    const queryCount = Math.min(enterpriseCreditStore.records.length, Math.max(0, Math.floor(queryBudget)));
    const referenceCount = Math.min(creditReferenceRecords.length, queryCount);
    const targetCount = Math.min(creditTargetRecords.length, Math.max(0, queryCount - referenceCount));
    const references = creditReferenceRecords.slice(0, referenceCount);
    const targets = creditTargetRecords.slice(0, targetCount).map((record) => ({
      id: record.id,
      name: record.name,
      ...Object.fromEntries(creditPublicFeatureKeys.map((key) => [key, record[key]])),
      observedOutput: creditOutputFor(productId, record),
    }));
    const groundTruth = new Map(creditTargetRecords.map((record) => [record.id, record[creditSensitiveFeatureKey]]));
    let learnedModel;
    let inferredRows = [];
    if (productId === "finance-model") {
      const weights = fitCreditLinearModel(references, (record) => creditLogit(record.defaultProbability));
      learnedModel = {
        type: "logit-linear-regression",
        weights,
        rawCoefficients: Object.fromEntries(creditFeatureKeys.map((key, index) => [key, weights[index + 1] / creditFeatureScales[key]])),
      };
      inferredRows = targets.map((target) => {
        const estimate = inverseCreditLinear(weights, target, creditLogit(target.observedOutput));
        return { target, estimate, minimum: estimate, maximum: estimate };
      });
    } else if (productId === "finance-index") {
      const weights = fitCreditLinearModel(references, (record) => record.riskIndex);
      learnedModel = {
        type: "linear-regression",
        weights,
        rawCoefficients: Object.fromEntries(creditFeatureKeys.map((key, index) => [key, weights[index + 1] / creditFeatureScales[key]])),
      };
      inferredRows = targets.map((target) => {
        const estimate = inverseCreditLinear(weights, target, target.observedOutput);
        return { target, estimate, minimum: estimate, maximum: estimate };
      });
    } else if (productId === "city-grade") {
      const gradeOrder = { A: 0, B: 1, C: 2, D: 3 };
      const weights = fitCreditPairwiseDirection(references, (record) => gradeOrder[record.grade]);
      const thresholds = learnedGradeThresholds(weights, references);
      learnedModel = { type: "ordinal-pairwise", weights, thresholds };
      inferredRows = targets.map((target) => ({ target, ...inverseCreditGradeRange(weights, thresholds, target, target.observedOutput) }));
    } else {
      const weights = fitCreditPairwiseDirection(references, (record) => 101 - record.riskRank);
      const referenceScores = references.map((record) => predictCreditDirection(weights, record)).sort((left, right) => left - right);
      learnedModel = { type: "pairwise-ranking", weights };
      inferredRows = targets.map((target) => {
        const candidates = Array.from({ length: 121 }, (_, index) => {
          const sensitiveValue = index * 0.25;
          const score = predictCreditDirection(weights, target, sensitiveValue);
          const percentile = 100 * (referenceScores.filter((referenceScore) => referenceScore <= score).length + 0.5) / referenceScores.length;
          return { sensitiveValue, distance: Math.abs(percentile - (101 - Number(target.observedOutput))) };
        });
        candidates.sort((left, right) => left.distance - right.distance || left.sensitiveValue - right.sensitiveValue);
        const estimate = candidates[0].sensitiveValue;
        const distanceLimit = Math.max(3, candidates[0].distance + 1.5);
        const compatible = candidates.filter((candidate) => candidate.distance <= distanceLimit).map((candidate) => candidate.sensitiveValue).sort((left, right) => left - right);
        return { target, estimate, minimum: compatible[0] ?? estimate, maximum: compatible.at(-1) ?? estimate };
      });
    }
    const tolerance = productId === "finance-index" || productId === "finance-model" ? 1 : productId === "content-rank" ? 4 : null;
    const candidateResults = inferredRows.map((row) => {
      const actual = Number(groundTruth.get(row.target.id));
      const error = Math.abs(row.estimate - actual);
      const successful = productId === "city-grade"
        ? actual >= row.minimum - 1e-9 && actual <= row.maximum + 1e-9
        : error <= tolerance;
      const candidate = config.targets.find((item) => item.id === row.target.id) ?? { id: row.target.id, summary: row.target.name };
      const recoveredSummary = productId === "city-grade" || productId === "content-rank"
        ? `${row.target.name} · 推断区间 ${row.minimum.toFixed(1)}%—${row.maximum.toFixed(1)}% · 真实 ${actual.toFixed(1)}%`
        : `${row.target.name} · 推断 ${row.estimate.toFixed(1)}% · 真实 ${actual.toFixed(1)}%`;
      return {
        candidate,
        actualMember: true,
        predictedMember: successful,
        determined: true,
        target: row.target,
        estimate: row.estimate,
        minimum: row.minimum,
        maximum: row.maximum,
        publicContribution: row.publicContribution,
        actual,
        error,
        recoveredSummary,
      };
    });
    const truePositives = candidateResults.filter((result) => result.predictedMember).length;
    const meanAbsoluteError = candidateResults.length
      ? candidateResults.reduce((sum, result) => sum + result.error, 0) / candidateResults.length
      : 0;
    const meanIntervalWidth = candidateResults.length
      ? candidateResults.reduce((sum, result) => sum + result.maximum - result.minimum, 0) / candidateResults.length
      : 0;
    return {
      productId,
      queryBudget,
      queryCount,
      referenceCount,
      targetCount,
      formulaAccessCount: 0,
      learnedModel,
      candidateResults,
      recoveredRows: candidateResults.map((result) => result.candidate),
      truePositives,
      falseNegatives: candidateResults.length - truePositives,
      falsePositives: candidateResults.length - truePositives,
      recall: candidateResults.length ? truePositives / candidateResults.length : 0,
      meanAbsoluteError,
      meanIntervalWidth,
      quotaBlocked: queryCount < enterpriseCreditStore.records.length ? 1 : 0,
    };
  }

  function simulateProductRecoveryBudget(productId, queryBudget) {
    const config = recoveryAttackConfigs.get(productId);
    if (!config) return null;
    if (creditProductIds.has(productId)) return simulateCreditInferenceAttack(productId, queryBudget);
    if (productId === "content-voice") {
      const faces = syntheticFaceLibrary.faces;
      const availableQueries = Math.max(0, Math.floor(queryBudget));
      const targetDescriptor = syntheticFaceLibrary.targetDescriptor;
      const sourceFace = faces[Math.min(25, Math.max(0, faces.length - 1))] ?? null;
      const acceptedMixes = [0, .1, .2, .3, .4, .5, .6, .7];
      const rejectedAtAcceptedSteps = new Set([2, 4, 6]);
      const descriptorAtMix = (mix) => {
        if (!sourceFace) return [];
        const descriptor = sourceFace.descriptor.map((value, index) => (1 - mix) * value + mix * targetDescriptor[index]);
        const norm = Math.sqrt(descriptor.reduce((sum, value) => sum + value * value, 0)) || 1;
        return descriptor.map((value) => value / norm);
      };
      const similarityAtMix = (mix) => faceTemplateSimilarity(descriptorAtMix(mix), targetDescriptor);
      const acceptedTrajectory = [];
      const rejectedProbes = [];
      let queryCount = 0;
      for (const [index, mix] of acceptedMixes.entries()) {
        if (queryCount >= availableQueries) break;
        const similarity = similarityAtMix(mix);
        queryCount += 1;
        acceptedTrajectory.push({
          query: queryCount,
          step: index,
          sourceFace,
          mix,
          similarity,
          delta: index === 0 ? 0 : similarity - acceptedTrajectory[index - 1].similarity,
          reason: index === 0 ? "连续起点" : "接受上升步",
          accepted: true,
        });
        if (rejectedAtAcceptedSteps.has(index) && queryCount < availableQueries) {
          const rejectedMix = Math.max(0, mix - .045);
          const rejectedSimilarity = similarityAtMix(rejectedMix);
          queryCount += 1;
          rejectedProbes.push({
            query: queryCount,
            step: index,
            sourceFace,
            mix: rejectedMix,
            similarity: rejectedSimilarity,
            delta: rejectedSimilarity - similarity,
            reason: "拒绝反向探针",
            accepted: false,
          });
        }
      }
      const recoveredFrame = acceptedTrajectory.at(-1) ?? null;
      const initialSimilarity = acceptedTrajectory[0]?.similarity ?? 0;
      const similarity = recoveredFrame?.similarity ?? 0;
      const authenticated = similarity >= faceVerificationThreshold;
      return {
        productId,
        queryBudget: availableQueries,
        queryCount,
        librarySize: faces.length,
        sourceFace,
        recoveredFace: sourceFace,
        recoveredFrame,
        initialSimilarity,
        similarity,
        authenticated,
        threshold: faceVerificationThreshold,
        restartCount: 0,
        trajectory: [...acceptedTrajectory, ...rejectedProbes].sort((left, right) => left.query - right.query),
        acceptedTrajectory,
        rejectedProbes,
        truePositives: authenticated ? 1 : 0,
        falseNegatives: authenticated ? 0 : 1,
        falsePositives: 0,
        recall: similarity,
        quotaBlocked: acceptedTrajectory.length < acceptedMixes.length ? 1 : 0,
        candidateResults: config.targets.map((candidate) => ({ candidate, actualMember: true, predictedMember: candidate.id === sourceFace?.id, determined: candidate.id === sourceFace?.id })),
        recoveredRows: recoveredFrame ? [{ id: `PATH-${String(recoveredFrame.step + 1).padStart(2, "0")}`, summary: `连续爬山到达 ${(similarity * 100).toFixed(2)}%` }] : [],
      };
    }
    if (productId === "content-library") {
      let queryCount = 0;
      let budgetExhausted = false;
      const incomeCandidates = Array.from({ length: 64 }, (_, index) => 2000 + index * 100);
      const runRangeQuery = (conditions) => {
        if (queryCount >= queryBudget) {
          budgetExhausted = true;
          return null;
        }
        queryCount += 1;
        return residentStore.records
          .filter((row) => conditions.every((condition) => recordMatchesCondition(row, condition)))
          .map((row) => ({
            residentId: row.residentId,
            street: row.street,
            age: row.age,
            occupation: row.occupation,
            householdSize: row.householdSize,
            housing: row.housing,
          }));
      };
      const candidateResults = config.targets.map((candidate) => {
        const record = residentStore.records.find((row) => row.residentId === candidate.id);
        if (!record || budgetExhausted) return { candidate, actualMember: true, predictedMember: false, determined: false, inferred: {} };
        const ageMinimum = 18 + Math.floor((record.age - 18) / 7) * 7;
        const publicRange = [
          { field: "street", operator: "eq", value: String(record.street) },
          { field: "age", operator: "gte", value: String(ageMinimum) },
          { field: "age", operator: "lte", value: String(Math.min(90, ageMinimum + 6)) },
        ];
        const inferred = {};
        let lowerIndex = 0;
        let upperIndex = incomeCandidates.length - 1;
        while (lowerIndex < upperIndex && !budgetExhausted) {
          const middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
          const returnedRows = runRangeQuery([
            ...publicRange,
            { field: "monthlyIncome", operator: "lte", value: String(incomeCandidates[middleIndex]) },
          ]);
          if (!returnedRows) break;
          if (returnedRows.some((row) => row.residentId === record.residentId)) upperIndex = middleIndex;
          else lowerIndex = middleIndex + 1;
        }
        if (!budgetExhausted) inferred.monthlyIncome = incomeCandidates[lowerIndex];
        for (const fieldKey of ["subsidyStatus", "insurance"]) {
          const values = residentFields.get(fieldKey)?.values ?? [];
          let matched = false;
          for (const value of values.slice(0, -1)) {
            const returnedRows = runRangeQuery([...publicRange, { field: fieldKey, operator: "eq", value: String(value) }]);
            if (!returnedRows) break;
            if (returnedRows.some((row) => row.residentId === record.residentId)) {
              inferred[fieldKey] = value;
              matched = true;
              break;
            }
          }
          if (budgetExhausted) break;
          if (!matched && values.length) inferred[fieldKey] = values.at(-1);
        }
        const determined = protectedAttributeFieldOrder.every((fieldKey) => Object.hasOwn(inferred, fieldKey));
        const correct = Boolean(record) && determined && protectedAttributeFieldOrder.every((fieldKey) => inferred[fieldKey] === record[fieldKey]);
        return {
          candidate,
          actualMember: true,
          predictedMember: correct,
          determined,
          inferred,
          recoveredSummary: determined ? completeResidentSummary({ ...record, ...inferred }) : "",
        };
      });
      const truePositives = candidateResults.filter((result) => result.predictedMember).length;
      const falsePositives = candidateResults.filter((result) => result.determined && !result.predictedMember).length;
      return {
        productId,
        queryBudget,
        queryCount,
        candidateResults,
        recoveredRows: candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate),
        truePositives,
        falseNegatives: config.targets.length - truePositives,
        falsePositives,
        recall: config.targets.length ? truePositives / config.targets.length : 0,
        quotaBlocked: budgetExhausted ? 1 : 0,
      };
    }
    if (productId === "finance-aggregate") {
      let queryCount = 0;
      let budgetExhausted = false;
      const runAggregateQuery = (conditions) => {
        if (queryCount >= queryBudget) {
          budgetExhausted = true;
          return null;
        }
        queryCount += 1;
        const rows = residentStore.records.filter((row) => conditions.every((condition) => recordMatchesCondition(row, condition)));
        const statistics = statisticsForResidentRows(rows);
        return {
          averageMonthlyIncome: statistics.averageMonthlyIncome,
          subsidyShares: statistics.subsidyShares,
          insuranceShares: statistics.insuranceShares,
        };
      };
      const knownPublicRangeCount = (conditions) => residentStore.records.filter((row) => conditions.every((condition) => recordMatchesCondition(row, condition))).length;
      const candidateResults = config.targets.map((candidate) => {
        const record = residentStore.records.find((row) => row.residentId === candidate.id);
        if (!record || budgetExhausted) return { candidate, actualMember: true, predictedMember: false, determined: false };
        const commonRange = [
          { field: "street", operator: "eq", value: String(record.street) },
          { field: "occupation", operator: "eq", value: String(record.occupation) },
          { field: "householdSize", operator: "eq", value: String(record.householdSize) },
          { field: "housing", operator: "eq", value: String(record.housing) },
        ];
        const includingConditions = [...commonRange, { field: "age", operator: "lte", value: String(record.age) }];
        const beforeConditions = [...commonRange, { field: "age", operator: "lt", value: String(record.age) }];
        const includingCount = knownPublicRangeCount(includingConditions);
        const beforeCount = knownPublicRangeCount(beforeConditions);
        const includingTarget = runAggregateQuery(includingConditions);
        const beforeTarget = runAggregateQuery(beforeConditions);
        if (!includingTarget || !beforeTarget) return { candidate, actualMember: true, predictedMember: false, determined: false };
        const recoveredCount = includingCount - beforeCount;
        const recoveredIncome = Math.round((includingTarget.averageMonthlyIncome * includingCount - beforeTarget.averageMonthlyIncome * beforeCount) / 100) * 100;
        const recoverCategory = (shareKey, values) => values.find((value) => {
          const difference = includingTarget[shareKey][value] * includingCount - beforeTarget[shareKey][value] * beforeCount;
          return difference > 0.5;
        });
        const inferred = {
          monthlyIncome: recoveredIncome,
          subsidyStatus: recoverCategory("subsidyShares", residentFields.get("subsidyStatus")?.values ?? []),
          insurance: recoverCategory("insuranceShares", residentFields.get("insurance")?.values ?? []),
        };
        const determined = recoveredCount === 1 && protectedAttributeFieldOrder.every((fieldKey) => inferred[fieldKey] !== undefined);
        const correct = determined && protectedAttributeFieldOrder.every((fieldKey) => inferred[fieldKey] === record[fieldKey]);
        return {
          candidate,
          actualMember: true,
          predictedMember: correct,
          determined,
          inferred,
          recoveredSummary: determined ? completeResidentSummary({ ...record, ...inferred }) : "",
        };
      });
      const truePositives = candidateResults.filter((result) => result.predictedMember).length;
      const falsePositives = candidateResults.filter((result) => result.determined && !result.predictedMember).length;
      return {
        productId,
        queryBudget,
        queryCount,
        candidateResults,
        recoveredRows: candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate),
        truePositives,
        falseNegatives: config.targets.length - truePositives,
        falsePositives,
        recall: config.targets.length ? truePositives / config.targets.length : 0,
        quotaBlocked: budgetExhausted ? 1 : 0,
      };
    }
    if (productId === "city-verify") {
      const queryCount = Math.min(Math.max(0, queryBudget), qualificationProbeCandidates.length);
      const recoveredIds = new Set();
      qualificationProbeCandidates.slice(0, queryCount).forEach((candidate) => {
        const response = qualificationCheck(candidate.credential, candidate.policy, candidate.period, candidate.region);
        if (response) recoveredIds.add(candidate.id);
      });
      const candidateResults = config.targets.map((candidate) => ({
        candidate,
        actualMember: true,
        predictedMember: recoveredIds.has(candidate.id),
        determined: recoveredIds.has(candidate.id),
      }));
      const truePositives = candidateResults.filter((result) => result.predictedMember).length;
      return {
        productId,
        queryBudget,
        queryCount,
        candidateResults,
        recoveredRows: candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate),
        truePositives,
        falseNegatives: config.targets.length - truePositives,
        falsePositives: 0,
        recall: config.targets.length ? truePositives / config.targets.length : 0,
        quotaBlocked: queryCount < qualificationProbeCandidates.length ? 1 : 0,
      };
    }
    if (productId === "finance-graph") {
      const queryCount = Math.min(Math.max(0, queryBudget), graphRagAttackConversations.length);
      const allCandidates = [...config.targets, ...graphRagFalseRelations];
      const recoveredIds = new Set();
      graphRagAttackConversations.slice(0, queryCount).forEach(({ answer }) => {
        allCandidates.forEach((candidate) => {
          if (answer.includes(candidate.summary)) recoveredIds.add(candidate.id);
        });
      });
      const candidateResults = config.targets.map((candidate) => ({
        candidate,
        actualMember: true,
        predictedMember: recoveredIds.has(candidate.id),
        determined: true,
      }));
      if (queryCount >= 3) candidateResults.push(...graphRagFalseRelations.map((candidate) => ({ candidate, actualMember: false, predictedMember: true, determined: true })));
      const truePositives = candidateResults.filter((result) => result.actualMember && result.predictedMember).length;
      const falsePositives = candidateResults.filter((result) => !result.actualMember && result.predictedMember).length;
      return {
        productId,
        queryBudget,
        queryCount,
        candidateResults,
        recoveredRows: candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate),
        truePositives,
        falseNegatives: config.targets.length - truePositives,
        falsePositives,
        recall: config.targets.length ? truePositives / config.targets.length : 0,
        quotaBlocked: queryCount < graphRagAttackConversations.length ? 1 : 0,
      };
    }
    if (productId === "finance-verify") {
      const candidates = accountEnterpriseOptions.flatMap((enterprise, enterpriseIndex) => accountEntityOptions.map((account, accountIndex) => ({
        id: verifyAccountRelationship(enterprise, account)
          ? `ACC-${String(enterpriseIndex + 1).padStart(3, "0")}`
          : `PAIR-${enterpriseIndex + 1}-${accountIndex + 1}`,
        enterprise,
        account,
        summary: `${enterprise} → ${account}`,
        actual: verifyAccountRelationship(enterprise, account),
      })));
      const queryCount = Math.min(Math.max(0, Math.floor(queryBudget)), candidates.length);
      const candidateResults = candidates.map((candidate, index) => {
        const determined = index < queryCount;
        const response = determined && verifyAccountRelationship(candidate.enterprise, candidate.account);
        return { candidate, actualMember: candidate.actual, predictedMember: response, determined };
      });
      const truePositives = candidateResults.filter((result) => result.actualMember && result.predictedMember).length;
      const falsePositives = candidateResults.filter((result) => !result.actualMember && result.predictedMember).length;
      return {
        productId,
        queryBudget,
        queryCount,
        candidateResults,
        recoveredRows: candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate),
        truePositives,
        falseNegatives: config.targets.length - truePositives,
        falsePositives,
        recall: config.targets.length ? truePositives / config.targets.length : 0,
        quotaBlocked: queryCount < candidates.length ? 1 : 0,
      };
    }
    const actualIds = new Set(config.targets.map((target) => target.id));
    const candidates = [...config.targets.map((target) => ({ ...target, actual: true })), ...Array.from({ length: 12 }, (_, index) => ({ id: `C-${productId}-${String(index + 1).padStart(2, "0")}`, summary: `外部候选 ${String(index + 1).padStart(2, "0")}`, actual: false, rejectAt: index % Math.min(3, config.queriesPerTarget) }))];
    let queryCount = 0;
    let budgetExhausted = false;
    const candidateResults = candidates.map((candidate) => {
      if (budgetExhausted) return { candidate, actualMember: candidate.actual, predictedMember: false, determined: false };
      let predictedMember = true;
      let determined = false;
      for (let probe = 0; probe < config.queriesPerTarget; probe += 1) {
        if (queryCount >= queryBudget) {
          budgetExhausted = true;
          predictedMember = false;
          break;
        }
        queryCount += 1;
        const exists = actualIds.has(candidate.id) || probe < candidate.rejectAt;
        if (!exists) {
          predictedMember = false;
          determined = true;
          break;
        }
        if (probe === config.queriesPerTarget - 1) determined = true;
      }
      return { candidate, actualMember: candidate.actual, predictedMember: predictedMember && determined, determined };
    });
    const truePositives = candidateResults.filter((result) => result.actualMember && result.predictedMember).length;
    const falseNegatives = config.targets.length - truePositives;
    const falsePositives = candidateResults.filter((result) => !result.actualMember && result.predictedMember).length;
    return {
      productId,
      queryBudget,
      queryCount,
      candidateResults,
      recoveredRows: candidateResults.filter((result) => result.predictedMember).map((result) => result.candidate),
      truePositives,
      falseNegatives,
      falsePositives,
      recall: config.targets.length ? truePositives / config.targets.length : 0,
      quotaBlocked: budgetExhausted ? 1 : 0,
    };
  }

  recoveryAttackConfigs.forEach((_, productId) => productUsageLimitOptionsFor(productsById[productId]).forEach((budget) => productRecoverySavedRuns.set(`${productId}:${budget}`, simulateProductRecoveryBudget(productId, budget))));

  function runMembershipRecoveryAttack() {
    const product = productsById["city-existence"];
    const queryBudget = productUsageCount(product);
    const run = membershipRecoverySavedRuns.get(queryBudget) ?? simulateMembershipRecoveryBudget(queryBudget);
    membershipRecoverySavedRuns.set(queryBudget, run);
    consumeProductUsage(product, run.queryCount, false);
    const attack = product.attacks[0];
    Object.assign(attack, {
      result: `${queryBudget} 次查询预算下，代码执行 ${run.queryCount} 次存在性查询并恢复 ${run.recoveredRows.length} 条成员判断。`,
      value: `${run.truePositives} / ${residentStore.records.length}`,
      displayScore: Math.round(run.recall * 100),
      protocol: `查询预算 ${queryBudget}；实际查询 ${run.queryCount}；缓存命中 ${run.cacheHits}；数据库执行 ${run.cacheMisses}；预算耗尽 ${run.quotaBlocked}`,
    });
    refreshProductUsageCounter(product);
    return run;
  }

  function runProductRecoveryAttack(product) {
    const queryBudget = creditProductIds.has(product.id) ? productUsageCount(product) + 1 : productUsageCount(product);
    const key = `${product.id}:${queryBudget}`;
    const run = productRecoverySavedRuns.get(key) ?? simulateProductRecoveryBudget(product.id, queryBudget);
    if (!run) return null;
    productRecoverySavedRuns.set(key, run);
    consumeProductUsage(product, creditProductIds.has(product.id) ? Math.max(0, run.queryCount - 1) : run.queryCount, false);
    if (product.id === "finance-graph" && product.attacks[0]) {
      const config = recoveryAttackConfigs.get(product.id);
      Object.assign(product.attacks[0], {
        result: `代码向 Chatbot 发送 ${run.queryCount} 个问题，从自然语言回答中恢复 ${run.truePositives}/${config.targets.length} 条后台关系。`,
        value: `${run.truePositives} / ${config.targets.length}`,
        displayScore: Math.round(run.recall * 100),
        protocol: `可用调用次数 ${queryBudget}；实际 Chatbot 调用 ${run.queryCount}；关系恢复 ${run.truePositives}；错误推断 ${run.falsePositives}`,
      });
    }
    if (product.id === "content-library" && product.attacks[0]) {
      const config = recoveryAttackConfigs.get(product.id);
      Object.assign(product.attacks[0], {
        result: `代码执行 ${run.queryCount} 次精细范围检索，从公开样本集合恢复受保护值，并完整拼接 ${run.truePositives}/${config.targets.length} 条居民记录。`,
        value: `${run.truePositives} / ${config.targets.length}`,
        displayScore: Math.round(run.recall * 100),
        protocol: `可用查询次数 ${queryBudget}；实际范围查询 ${run.queryCount}；完整推断 ${run.truePositives}；错误推断 ${run.falsePositives}`,
      });
    }
    if (product.id === "finance-aggregate" && product.attacks[0]) {
      const config = recoveryAttackConfigs.get(product.id);
      Object.assign(product.attacks[0], {
        result: `代码执行 ${run.queryCount} 次相邻范围统计查询，通过均值总量差恢复并完整拼接 ${run.truePositives}/${config.targets.length} 条居民记录。`,
        value: `${run.truePositives} / ${config.targets.length}`,
        displayScore: Math.round(run.recall * 100),
        protocol: `可用查询次数 ${queryBudget}；实际统计查询 ${run.queryCount}；完整恢复 ${run.truePositives}；错误拼接 ${run.falsePositives}`,
      });
    }
    if (product.id === "city-verify" && product.attacks[0]) {
      const config = recoveryAttackConfigs.get(product.id);
      Object.assign(product.attacks[0], {
        result: `代码执行 ${run.queryCount} 次资格核验，枚举居民签名、政策、季度和地区，并恢复 ${run.truePositives}/${config.targets.length} 个真实资格组合。`,
        value: `${run.truePositives} / ${config.targets.length}`,
        displayScore: Math.round(run.recall * 100),
        protocol: `可用核验次数 ${queryBudget}；实际核验 ${run.queryCount}；资格组合恢复 ${run.truePositives}；错误组合 ${run.falsePositives}`,
      });
    }
    if (product.id === "content-voice" && product.attacks[0]) {
      Object.assign(product.attacks[0], {
        result: `代码实际提交 ${run.queryCount} 个连续图像探针，保留 ${run.acceptedTrajectory.length} 个单调上升步，拒绝 ${run.rejectedProbes.length} 个反向探针，离线评估相似度由 ${(run.initialSimilarity * 100).toFixed(1)}% 提升到 ${(run.similarity * 100).toFixed(2)}%。`,
        value: `${(run.similarity * 100).toFixed(2)}%`,
        displayScore: Math.round(run.similarity * 100),
        protocol: `可用核验次数 ${queryBudget}；实际连续探针 ${run.queryCount} 次；接受 ${run.acceptedTrajectory.length} 步；拒绝 ${run.rejectedProbes.length} 步；随机重启 ${run.restartCount} 次；描述维度 ${faceDescriptorDimension}；相似度只对离线评估器可见；不连接真实系统`,
      });
    }
    if (product.id === "finance-verify" && product.attacks[0]) {
      const config = recoveryAttackConfigs.get(product.id);
      Object.assign(product.attacks[0], {
        result: `代码调用同一个账户归属核验函数 ${run.queryCount} 次，恢复 ${run.truePositives}/${config.targets.length} 条真实账户关系。`,
        value: `${run.truePositives} / ${config.targets.length}`,
        displayScore: Math.round(run.recall * 100),
        protocol: `可用核验次数 ${queryBudget}；实际核验 ${run.queryCount}；关系恢复 ${run.truePositives}；错误关系 ${run.falsePositives}`,
      });
    }
    if (creditProductIds.has(product.id) && product.attacks[0]) {
      const metricValue = product.id === "city-grade"
        ? `${(run.recall * 100).toFixed(1)}%`
        : `${run.meanAbsoluteError.toFixed(2)} 个百分点`;
      const resultText = product.id === "finance-index"
        ? `攻击代码用 ${run.referenceCount} 家完整参考企业拟合未知连续评分规则，再对 ${run.targetCount} 家目标企业反演逾期率；平均绝对误差 ${run.meanAbsoluteError.toFixed(2)} 个百分点。`
        : product.id === "city-grade"
          ? `攻击代码从 ${run.referenceCount} 家完整参考企业学习有序等级规则，为 ${run.targetCount} 家目标企业生成平均宽度 ${run.meanIntervalWidth.toFixed(2)} 个百分点的逾期率区间，真实值覆盖率 ${(run.recall * 100).toFixed(1)}%。`
          : product.id === "content-rank"
            ? `攻击代码用 ${run.referenceCount} 家完整参考企业学习成对排序方向，再由公开名次反演 ${run.targetCount} 家目标企业的逾期率；平均绝对误差 ${run.meanAbsoluteError.toFixed(2)} 个百分点。`
            : `攻击代码用 ${run.referenceCount} 家完整参考企业拟合违约概率代理模型，再由 API 概率响应反演 ${run.targetCount} 家目标企业的近90天逾期率；平均绝对误差 ${run.meanAbsoluteError.toFixed(2)} 个百分点。`;
      Object.assign(product.attacks[0], {
        result: resultText,
        value: metricValue,
        displayScore: product.id === "city-grade" ? Math.round(run.recall * 100) : Math.max(0, Math.round(100 - run.meanAbsoluteError * 10)),
        protocol: `100家统一模拟企业；参考集 ${run.referenceCount}；目标集 ${run.targetCount}；实际读取产品输出 ${run.queryCount} 次；攻击代码读取真实公式 ${run.formulaAccessCount} 次`,
      });
    }
    refreshProductUsageCounter(product);
    return run;
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
    if (ragProductIds.has(product.id)) {
      const response = ragResponseFor(product);
      return {
        ...product,
        inputValue: response?.question ?? product.inputValue,
        outputValue: publicRagAnswer(response?.answer ?? "回答尚未载入"),
      };
    }
    if (!structuredConfig(product)) return { ...product, inputValue: inputValue.trim() || product.inputValue };
    const formattedInput = formatStructuredConditions(product);
    if (creditProductIds.has(product.id)) {
      const selectedId = String(structuredConditionValue("creditEnterprise")).split("｜").at(-1);
      const record = creditRecordById.get(selectedId) ?? creditExampleRecord;
      return { ...product, inputValue: formattedInput, outputValue: creditOutputText(product.id, record) };
    }
    if (product.id === "city-existence") {
      const matches = queryResidents();
      return {
        ...product,
        inputLabel: "查询条件",
        inputValue: formattedInput,
        outputValue: matches.length > 0 ? "存在" : "不存在",
        outputDetail: "对外只返回是否存在，不返回命中数量或居民记录。",
      };
    }
    if (product.id === "content-library") {
      const matches = queryResidents();
      return { ...product, inputValue: formattedInput, outputValue: `${matches.length} 条授权记录` };
    }
    if (product.id === "finance-aggregate") {
      return { ...product, inputValue: formattedInput, outputValue: "三项受保护特征统计" };
    }
    if (product.id === "finance-derived") {
      return { ...product, inputValue: formattedInput, outputValue: `${processedResidentRows().length} 条加工样本` };
    }
    if (product.id === "city-verify") {
      const qualifies = qualificationCheck(
        structuredConditionValue("credential"),
        structuredConditionValue("policy"),
        structuredConditionValue("period"),
        structuredConditionValue("region"),
      );
      return { ...product, inputValue: formattedInput, outputValue: qualifies ? "符合" : "不符合" };
    }
    if (product.id === "content-voice") {
      const authenticated = structuredConditionValue("identitySignature") === "9F2C-7A18-D4E6-03B9-AC51" && faceImageMatchesResident;
      return { ...product, inputValue: formattedInput, outputValue: authenticated ? "认证" : "不认证" };
    }
    if (product.id === "finance-verify") {
      const enterprise = structuredConditionValue("enterpriseEntity");
      const account = structuredConditionValue("accountEntity");
      return { ...product, inputValue: formattedInput, outputValue: verifyAccountRelationship(enterprise, account) ? "认证" : "非认证" };
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
      <div class="existence-result ${ready ? product.outputValue === "存在" ? "is-true" : "is-false" : ""}" aria-live="polite">${ready ? `<strong>${escapeHtml(product.outputValue)}</strong>` : ""}</div>
      ${exposed ? '<div class="attack-overlay">重复改变条件并比较真假响应，可逐步缩小隐藏成员范围。</div>' : ""}
    </div>`;
  }

  function residentVerificationVisual(product, currentPhase) {
    const exposed = currentPhase >= 4;
    const ready = currentPhase >= 3;
    return `<div class="resident-existence-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}">
        <span>当前核验条件</span>
        <strong>${escapeHtml(product.inputValue)}</strong>
      </div>
      <div class="existence-result ${ready ? product.outputValue === "符合" ? "is-true" : "is-false" : ""}" aria-live="polite">${ready ? `<strong>${escapeHtml(product.outputValue)}</strong>` : ""}</div>
      ${exposed ? '<div class="attack-overlay">反复替换政策项目、季度和地区，可以逐步推断居民的受惠资格。</div>' : ""}
    </div>`;
  }

  function residentFaceVerificationVisual(product, currentPhase) {
    const exposed = currentPhase >= 4;
    const ready = currentPhase >= 3;
    return `<div class="resident-face-verification-result-view">
      <div class="existence-result ${ready ? product.outputValue === "认证" ? "is-true" : "is-false" : ""}" aria-live="polite">${ready ? `<strong>${escapeHtml(product.outputValue)}</strong>` : ""}</div>
      ${exposed ? '<div class="attack-overlay">反复提交人脸探针并观察认证边界，可能逼近登记人脸模板。</div>' : ""}
    </div>`;
  }

  function residentFeatureSummary(record) {
    return `街道 ${record.street} · ${record.age}岁 · ${record.occupation} · ${record.householdSize}人家庭`;
  }

  function protectedAttributeSummary(record) {
    return `月收入 ${Number(record.monthlyIncome).toLocaleString("zh-CN")} 元 · 补贴状态 ${record.subsidyStatus} · 保障类型 ${record.insurance}`;
  }

  function completeResidentSummary(record) {
    return `${residentFeatureSummary(record)} · ${record.housing} · ${protectedAttributeSummary(record)}`;
  }

  function qualificationCredential(record, index) {
    if (record.residentId === "R-1002") return "9F2C-7A18-D4E6-03B9-AC51";
    const serial = Number(record.residentId.slice(2));
    const segment = (multiplier, width = 4) => ((serial * multiplier + record.age * 97 + index * 211) % (16 ** width)).toString(16).toUpperCase().padStart(width, "0");
    return `${segment(17)}-${segment(29)}-${segment(43)}-${segment(61)}-${segment(79)}`;
  }

  function qualificationRegion(record) {
    if (["01", "03"].includes(record.street)) return "东城区";
    if (record.street === "05") return "西城区";
    return "南城区";
  }

  function qualificationPeriod(record) {
    if (record.residentId === "R-1002") return "2026年第3季度";
    return qualificationPeriods[(record.age + record.householdSize) % qualificationPeriods.length];
  }

  function recordQualifiesForPolicy(record, policy) {
    if (policy === "养老服务补贴") return record.age >= 60 && record.subsidyStatus === "有效";
    if (policy === "住房租赁补贴") return record.housing !== "自有" && record.monthlyIncome <= 5000;
    if (policy === "医疗救助") return record.insurance === "未参保" || (record.monthlyIncome <= 3500 && record.subsidyStatus === "有效");
    return false;
  }

  function qualificationCheck(credential, policy, period, region) {
    const profile = qualificationProfileByCredential.get(credential);
    if (!profile) return false;
    return profile.region === region && profile.period === period && recordQualifiesForPolicy(profile.record, policy);
  }

  function membershipRecoveryAttackVisual(step) {
    const currentStep = Math.max(0, Math.min(membershipRecoverySteps.length, step));
    const run = currentStep >= 2 ? (membershipRecoveryRun ??= runMembershipRecoveryAttack()) : null;
    const processedCount = currentStep < 2 ? 0 : currentStep === 2 ? Math.ceil(membershipRecoveryCandidates.length / 2) : membershipRecoveryCandidates.length;
    const processedResults = run?.candidateResults.slice(0, processedCount) ?? [];
    const resultById = new Map(processedResults.map((result) => [result.candidate.residentId, result]));
    const visibleRecoveredResults = processedResults.filter((result) => result.predictedMember);
    return `<div class="membership-recovery-view">
      <div class="membership-query-track">
        <header><span>代码运行</span><strong>${run ? `${run.queryCount} 次查询` : "等待执行"}</strong></header>
      </div>
      <div class="membership-dataset-compare">
        <section class="membership-dataset ground-truth-dataset">
          <header><div><span>系统真实成员数据集</span></div><strong>${residentStore.records.length} 条</strong></header>
          <div class="membership-table"><div class="membership-row membership-head"><span>居民编号</span><span>可查询特征</span><span>对照</span></div>${residentStore.records.map((record) => {
            const result = resultById.get(record.residentId);
            const recovered = result?.predictedMember === true;
            const missed = currentStep === membershipRecoverySteps.length && result?.predictedMember === false;
            return `<div class="membership-row ${recovered ? "recovered" : missed ? "missed" : "pending"}"><b>${escapeHtml(record.residentId)}</b><span>${escapeHtml(residentFeatureSummary(record))}</span><em>${recovered ? "已恢复" : missed ? "遗漏" : "待判定"}</em></div>`;
          }).join("")}</div>
        </section>
        <section class="membership-dataset recovered-dataset">
          <header><div><span>攻击恢复成员数据集</span></div><strong>${visibleRecoveredResults.length} 条</strong></header>
          <div class="membership-table"><div class="membership-row membership-head"><span>候选编号</span><span>已知特征</span><span>判断</span></div>${visibleRecoveredResults.length ? visibleRecoveredResults.map((result) => {
            const falsePositive = !result.actualMember;
            return `<div class="membership-row ${falsePositive ? "false-positive" : "recovered"}"><b>${escapeHtml(result.candidate.residentId)}</b><span>${escapeHtml(residentFeatureSummary(result.candidate))}</span><em>${falsePositive ? "误判" : "存在"}</em></div>`;
          }).join("") : '<div class="membership-empty">尚未生成成员判断</div>'}</div>
        </section>
      </div>
      <div class="membership-legend"><span><i class="recovered"></i>成功恢复</span><span><i class="missed"></i>真实成员遗漏</span><span><i class="false-positive"></i>非成员误判</span></div>
    </div>`;
  }

  function faceSpriteStyle(face) {
    if (!face) return "";
    const positionStep = syntheticFaceLibrary.gridSize > 1 ? 100 / (syntheticFaceLibrary.gridSize - 1) : 0;
    const sheetUrl = new URL(syntheticFaceLibrary.sheets[face.sheet], window.location.href).href;
    return `--face-sheet:url('${sheetUrl}');--face-x:${face.column * positionStep}%;--face-y:${face.row * positionStep}%`;
  }

  function faceBlendPortrait(frame, className = "") {
    if (!frame?.sourceFace) return '<div class="face-blend-portrait is-empty" aria-label="等待生成连续人脸"></div>';
    const mix = Math.max(0, Math.min(1, Number(frame.mix) || 0));
    const label = `连续爬山步骤 ${frame.step + 1}，离线评估相似度 ${(frame.similarity * 100).toFixed(2)}%`;
    return `<div class="face-blend-portrait ${className}" style="${faceSpriteStyle(frame.sourceFace)};--face-mix:${mix}" role="img" aria-label="${label}"><i class="face-blend-source"></i><img src="${escapeHtml(defaultFaceImageUrl)}" alt="" aria-hidden="true" /></div>`;
  }

  function faceHillClimbAttackVisual(product, step) {
    const currentStep = Math.max(0, Math.min(faceHillClimbSteps.length, step));
    const run = currentStep >= 1 ? (productRecoveryRun ??= runProductRecoveryAttack(product)) : null;
    const completed = currentStep === faceHillClimbSteps.length;
    const visibleAcceptedCount = !run ? 0 : currentStep === 1 ? 1 : currentStep === 2 ? Math.min(4, run.acceptedTrajectory.length) : run.acceptedTrajectory.length;
    const visibleRejectedCount = !run || currentStep < 2 ? 0 : currentStep === 2 ? Math.min(1, run.rejectedProbes.length) : run.rejectedProbes.length;
    const acceptedFrames = run?.acceptedTrajectory.slice(0, visibleAcceptedCount) ?? [];
    const rejectedFrames = run?.rejectedProbes.slice(0, visibleRejectedCount) ?? [];
    return `<div class="face-hill-climb-view">
      <div class="membership-query-track"><header><span>离线连续爬山</span><strong>${run ? `已提交 ${Math.min(run.queryCount, acceptedFrames.length + rejectedFrames.length)} / ${run.queryCount} 个探针` : "等待执行"}</strong></header></div>
      <div class="face-oracle-boundary"><strong>产品可见输出</strong><span>仅“认证 / 不认证”</span><i aria-hidden="true">≠</i><strong>离线评估层</strong><span>相似度只用于演示路径，不对外暴露</span></div>
      <section class="face-accepted-path">
        <header><div><span>接受路径</span><strong>小步连续变化 · 相似度严格上升</strong></div><em>${run ? `${acceptedFrames.length} / ${run.acceptedTrajectory.length} 步` : "未开始"}</em></header>
        ${acceptedFrames.length ? `<div class="face-trajectory" aria-label="连续人脸爬山接受路径">${acceptedFrames.map((frame, index) => `<article class="face-trajectory-step ${frame.similarity >= faceVerificationThreshold ? "is-authenticated" : ""}"><span>STEP ${String(index).padStart(2, "0")}</span>${faceBlendPortrait(frame)}<strong>${(frame.similarity * 100).toFixed(2)}%</strong><small>${index === 0 ? "起点" : `+${(frame.delta * 100).toFixed(2)}`}</small><b>${frame.similarity >= faceVerificationThreshold ? "认证" : "不认证"}</b></article>`).join("")}</div>` : '<div class="face-path-waiting">执行后将按时间顺序展示每个被接受的连续小步</div>'}
      </section>
      <section class="face-rejected-probes">
        <header><div><span>未接受探针</span><strong>下降方向不进入主路径</strong></div><em>${rejectedFrames.length}个</em></header>
        ${rejectedFrames.length ? `<div class="face-rejected-list">${rejectedFrames.map((frame) => `<article>${faceBlendPortrait(frame, "is-rejected")}<div><span>来自 STEP ${String(frame.step).padStart(2, "0")}</span><strong>${(frame.similarity * 100).toFixed(2)}%</strong><small>${(frame.delta * 100).toFixed(2)} → 已拒绝</small></div></article>`).join("")}</div>` : '<p>反向探针将在测试后单独灰显，不与接受路径连线。</p>'}
      </section>
      <div class="face-restart-row"><span>随机重启</span><strong>${run ? `${run.restartCount} 次` : "—"}</strong><p>${run ? "本次路径持续上升，未触发重启。若陷入局部停滞，新起点会另起一行并用断点标记，不伪装成连续变化。" : "只有连续路径停滞时才启动。"}</p></div>
      ${completed && run ? `<div class="face-path-conclusion ${run.authenticated ? "is-authenticated" : ""}"><span>最终离线评估</span><strong>${(run.similarity * 100).toFixed(2)}%</strong><b>${run.authenticated ? `越过 ${(run.threshold * 100).toFixed(0)}% 认证阈值` : `未越过 ${(run.threshold * 100).toFixed(0)}% 认证阈值`}</b></div>` : ""}
    </div>`;
  }

  function creditInferenceAttackVisual(product, step) {
    const currentStep = Math.max(0, Math.min(creditInferenceSteps.length, step));
    const run = currentStep >= 2 ? (productRecoveryRun ??= runProductRecoveryAttack(product)) : null;
    const visibleResults = run ? run.candidateResults.slice(0, currentStep >= 4 ? 12 : currentStep >= 3 ? 8 : 0) : [];
    const completed = currentStep === creditInferenceSteps.length;
    return `<div class="credit-inference-view">
      <section class="credit-inference-table">
        <div class="credit-inference-row credit-inference-head"><span>企业</span><span>产品输出</span><span>攻击推断</span><span>模拟真值</span></div>
        ${visibleResults.length ? visibleResults.map((result) => `<div class="credit-inference-row ${completed ? result.predictedMember ? "is-correct" : "is-error" : ""}"><span><b>${escapeHtml(result.target.name)}</b><small>${escapeHtml(result.target.id)}</small></span><span>${escapeHtml(product.id === "finance-index" ? `${Number(result.target.observedOutput).toFixed(1)}分` : product.id === "city-grade" ? `${result.target.observedOutput}级` : product.id === "content-rank" ? `第${result.target.observedOutput}名` : `${(Number(result.target.observedOutput) * 100).toFixed(1)}%`)}</span><strong>${product.id === "city-grade" || product.id === "content-rank" ? `${result.minimum.toFixed(1)}%—${result.maximum.toFixed(1)}%` : `${result.estimate.toFixed(1)}%`}</strong><em>${completed ? `${result.actual.toFixed(1)}%` : "—"}</em></div>`).join("") : '<div class="membership-empty">等待执行</div>'}
      </section>
      ${completed && run ? `<div class="credit-inference-summary"><article><span>产品输出读取</span><strong>${run.queryCount}</strong></article><article><span>目标企业</span><strong>${run.targetCount}</strong></article><article><span>${product.id === "city-grade" ? "区间覆盖率" : "平均绝对误差"}</span><strong>${product.id === "city-grade" ? `${(run.recall * 100).toFixed(1)}%` : `${run.meanAbsoluteError.toFixed(2)} 个百分点`}</strong></article><article><span>真实公式读取</span><strong>${run.formulaAccessCount}</strong></article></div>` : ""}
    </div>`;
  }

  function productRecoveryAttackVisual(product, step) {
    if (product.id === "city-existence") return membershipRecoveryAttackVisual(step);
    if (product.id === "content-voice") return faceHillClimbAttackVisual(product, step);
    if (creditProductIds.has(product.id)) return creditInferenceAttackVisual(product, step);
    const config = recoveryAttackConfigs.get(product.id);
    if (!config) return renderVisual(current().activeSeries, product, 3);
    const currentStep = Math.max(0, Math.min(membershipRecoverySteps.length, step));
    const run = currentStep >= 2 ? (productRecoveryRun ??= runProductRecoveryAttack(product)) : null;
    const processedCount = currentStep < 2 ? 0 : currentStep === 2 ? Math.ceil(config.targets.length / 2) : config.targets.length + 12;
    const processedResults = run?.candidateResults.slice(0, processedCount) ?? [];
    const resultById = new Map(processedResults.map((result) => [result.candidate.id, result]));
    const visibleRecoveredResults = processedResults.filter((result) => result.predictedMember);
    return `<div class="membership-recovery-view">
      <div class="membership-query-track"><header><span>代码运行</span><strong>${run ? `${run.queryCount} 次${productUsageLabel(product).replace("次数", "")}` : "等待执行"}</strong></header></div>
      <div class="membership-dataset-compare">
        <section class="membership-dataset ground-truth-dataset">
          <header><div><span>${escapeHtml(config.groundTruthLabel)}</span></div><strong>${config.targets.length} 条</strong></header>
          <div class="membership-table"><div class="membership-row membership-head"><span>${product.id === "finance-graph" || product.id === "finance-graph-query" ? "关系编号" : "记录编号"}</span><span>真实内容</span><span>对照</span></div>${config.targets.map((target) => {
            const result = resultById.get(target.id);
            const recovered = result?.predictedMember === true;
            const missed = currentStep === membershipRecoverySteps.length && result?.predictedMember === false;
            return `<div class="membership-row ${recovered ? "recovered" : missed ? "missed" : "pending"}"><b>${escapeHtml(target.id)}</b><span>${escapeHtml(target.summary)}</span><em>${recovered ? "已恢复" : missed ? "遗漏" : "待判定"}</em></div>`;
          }).join("")}</div>
        </section>
        <section class="membership-dataset recovered-dataset">
          <header><div><span>${escapeHtml(config.recoveredLabel)}</span></div><strong>${visibleRecoveredResults.length} 条</strong></header>
          <div class="membership-table"><div class="membership-row membership-head"><span>${product.id === "finance-graph" || product.id === "finance-graph-query" ? "关系编号" : "候选编号"}</span><span>恢复内容</span><span>判断</span></div>${visibleRecoveredResults.length ? visibleRecoveredResults.map((result) => `<div class="membership-row ${result.actualMember ? "recovered" : "false-positive"}"><b>${escapeHtml(result.candidate.id)}</b><span>${escapeHtml(result.recoveredSummary || result.candidate.summary)}</span><em>${result.actualMember ? "已恢复" : "误判"}</em></div>`).join("") : '<div class="membership-empty">尚未生成恢复结果</div>'}</div>
        </section>
      </div>
      <div class="membership-legend"><span><i class="recovered"></i>成功恢复</span><span><i class="missed"></i>真实记录遗漏</span><span><i class="false-positive"></i>非真实记录误判</span></div>
    </div>`;
  }

  function relationshipVerificationVisual(product, currentPhase) {
    const exposed = currentPhase >= 4;
    const ready = currentPhase >= 3;
    return `<div class="resident-face-verification-result-view">
      <div class="existence-result ${ready ? product.outputValue === "认证" ? "is-true" : "is-false" : ""}" aria-live="polite">${ready ? `<strong>${escapeHtml(product.outputValue)}</strong>` : ""}</div>
      ${exposed ? '<div class="attack-overlay">反复替换企业主体与银行账户，可能枚举出未公开的账户归属关系。</div>' : ""}
    </div>`;
  }

  function authorizedResidentRecords() {
    return queryResidents();
  }

  function authorizedResidentVisual(product, currentPhase) {
    const ready = currentPhase >= 3;
    const rows = authorizedResidentRecords();
    return `<div class="authorized-records-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}"><span>当前条件</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      ${ready ? `<div class="authorized-record-table" aria-label="授权居民记录检索结果">
        <div class="authorized-record-row public-only authorized-record-head"><span>记录编号</span><span>返回的公开字段</span></div>
        ${rows.map((record) => `<div class="authorized-record-row public-only">
          <strong>${escapeHtml(record.residentId)}</strong>
          <div class="public-features"><span><b>街道</b>${escapeHtml(record.street)}</span><span><b>年龄</b>${escapeHtml(record.age)}</span><span><b>职业</b>${escapeHtml(record.occupation)}</span><span><b>家庭人数</b>${escapeHtml(record.householdSize)}</span><span><b>居住类型</b>${escapeHtml(record.housing)}</span></div>
        </div>`).join("")}
      </div>` : ""}
    </div>`;
  }

  function statisticsForResidentRows(rows) {
    const count = rows.length;
    const total = (field) => rows.reduce((sum, record) => sum + Number(record[field] ?? 0), 0);
    const shares = (field, values) => Object.fromEntries(values.map((value) => [value, count ? rows.filter((record) => record[field] === value).length / count : 0]));
    return {
      count,
      averageAge: count ? total("age") / count : 0,
      averageHouseholdSize: count ? total("householdSize") / count : 0,
      averageMonthlyIncome: count ? total("monthlyIncome") / count : 0,
      subsidyShares: shares("subsidyStatus", residentFields.get("subsidyStatus")?.values ?? []),
      insuranceShares: shares("insurance", residentFields.get("insurance")?.values ?? []),
    };
  }

  function residentStatistics() {
    return statisticsForResidentRows(queryResidents());
  }

  function residentStatisticsVisual(product, currentPhase) {
    const ready = currentPhase >= 3;
    const statistics = residentStatistics();
    return `<div class="resident-statistics-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}"><span>当前条件</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      ${ready ? `<div class="resident-stat-grid" aria-label="居民群体统计结果">
        <div class="resident-stat-card protected-stat"><span>平均月收入</span><strong>${Math.round(statistics.averageMonthlyIncome).toLocaleString("zh-CN")}</strong><small>元 · 受保护特征均值</small></div>
        <div class="resident-stat-card protected-stat distribution"><span>补贴状态占比</span><strong>有效 ${(statistics.subsidyShares["有效"] * 100).toFixed(1)}%<br>暂停 ${(statistics.subsidyShares["暂停"] * 100).toFixed(1)}%<br>无 ${(statistics.subsidyShares["无"] * 100).toFixed(1)}%</strong><small>类别指示变量均值</small></div>
        <div class="resident-stat-card protected-stat distribution"><span>保障类型占比</span><strong>职工 ${(statistics.insuranceShares["城镇职工"] * 100).toFixed(1)}%<br>居民 ${(statistics.insuranceShares["城乡居民"] * 100).toFixed(1)}%<br>未参保 ${(statistics.insuranceShares["未参保"] * 100).toFixed(1)}%</strong><small>类别指示变量均值</small></div>
      </div>` : ""}
    </div>`;
  }

  function processedResidentRows() {
    const method = structuredConditionValue("processingMethod", "有放回重采样");
    const count = Math.max(1, Math.min(20, Number(structuredConditionValue("sampleSize", "12")) || 12));
    const records = residentProcessingPool();
    if (!records.length) return [];
    if (method === "无放回子采样") {
      return records
        .map((record, index) => ({ record, order: (index * 37 + 9) % 101 }))
        .sort((left, right) => left.order - right.order)
        .slice(0, Math.min(count, records.length));
    }
    if (method === "合成数据") {
      return Array.from({ length: count }, (_, index) => {
        const left = records[(index * 13 + 4) % records.length];
        const right = records[(index * 29 + 11) % records.length];
        return {
          record: {
            street: index % 2 === 0 ? left.street : right.street,
            age: Math.max(18, Math.min(84, Math.round((left.age + right.age) / 2 + index % 3 - 1))),
            occupation: index % 2 === 0 ? left.occupation : right.occupation,
            householdSize: Math.max(1, Math.min(6, Math.round((left.householdSize + right.householdSize) / 2))),
            housing: index % 2 === 0 ? right.housing : left.housing,
          },
        };
      });
    }
    return Array.from({ length: count }, (_, index) => ({ record: records[(index * 7 + 3) % records.length] }));
  }

  function residentProcessingPool() {
    const filters = structuredConditions.filter((condition) => !residentProcessingSettingKeys.has(condition.field));
    return residentStore.records.filter((record) => filters.every((condition) => {
      if (condition.field === "streetRange") {
        const [minimum, maximum] = condition.value.split("—").map(Number);
        return Number(record.street) >= minimum && Number(record.street) <= maximum;
      }
      if (condition.field === "ageStage") {
        if (condition.value.startsWith("青年")) return record.age >= 18 && record.age <= 39;
        if (condition.value.startsWith("中年")) return record.age >= 40 && record.age <= 59;
        return record.age >= 60;
      }
      if (condition.field === "householdRange") {
        if (condition.value.startsWith("1")) return record.householdSize <= 2;
        if (condition.value.startsWith("3")) return record.householdSize >= 3 && record.householdSize <= 4;
        return record.householdSize >= 5;
      }
      if (condition.field === "occupation") {
        if (condition.value === "其他职业") return ["制造业", "服务业", "自由职业"].includes(record.occupation);
        return record.occupation === condition.value;
      }
      return true;
    }));
  }

  function residentProcessingInfo() {
    const method = structuredConditionValue("processingMethod", "有放回重采样");
    const rows = processedResidentRows();
    return { method, poolSize: residentProcessingPool().length, rows };
  }

  function residentProcessingVisual(product, currentPhase) {
    const ready = currentPhase >= 3;
    const processing = residentProcessingInfo();
    return `<div class="resident-processing-view">
      <div class="resident-query-summary ${currentPhase >= 1 ? "active" : ""}"><span>当前筛选与加工设置</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      ${ready ? `<div class="processed-resident-table" aria-label="居民数据加工结果"><div class="processed-resident-row processed-resident-head"><span>街道</span><span>年龄</span><span>职业</span><span>家庭人数</span><span>居住类型</span></div>${processing.rows.map((item) => `<div class="processed-resident-row"><span>${escapeHtml(item.record.street)}</span><span>${escapeHtml(item.record.age)}</span><span>${escapeHtml(item.record.occupation)}</span><span>${escapeHtml(item.record.householdSize)}</span><span>${escapeHtml(item.record.housing)}</span></div>`).join("")}</div>` : ""}
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
    if (product.id === "city-verify") return residentVerificationVisual(product, currentPhase);
    if (product.id === "content-library") return authorizedResidentVisual(product, currentPhase);
    if (product.id === "finance-graph" || product.id === "finance-graph-query") return enterpriseGraphVisual(product, currentPhase);
    if (product.id === "finance-aggregate") return residentStatisticsVisual(product, currentPhase);
    if (product.id === "finance-derived") return residentProcessingVisual(product, currentPhase);
    if (product.id === "finance-verify") return relationshipVerificationVisual(product, currentPhase);
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
    const response = ragResponseFor(product);
    const image = response?.imageId ? ragImagesById.get(response.imageId) : null;
    const question = response?.question ?? product.inputValue;
    const answer = publicRagAnswer(response?.answer ?? product.outputValue);
    const benchmark = ragMembershipResultFor(product);
    return `<div class="chat-product-view">
      <div class="chat-thread">
        ${currentPhase >= 1 ? `<div class="chat-message user">${image ? `<img src="${escapeHtml(image.path)}" alt="${escapeHtml(image.title)}" />` : ""}<p>${escapeHtml(question)}</p></div>` : '<div class="chat-welcome"><strong>请选择一个问题</strong></div>'}
        ${currentPhase >= 2 && currentPhase < 3 ? '<div class="typing" aria-label="正在生成回答"><i></i><i></i><i></i></div>' : ""}
        ${currentPhase >= 3 ? `<div class="chat-message bot"><p>${escapeHtml(answer)}</p></div>` : ""}
      </div>
      ${currentPhase >= 4 ? `<aside class="rag-membership-panel"><h3>RAG 语料成员推断</h3><p>对 ${benchmark.candidateCount} 个候选对象逐一重复查询，仅由 Chatbot 回答正文计算成员分数。</p><div class="rag-membership-flow"><span>候选对象</span><i>→</i><span>重复查询</span><i>→</i><span>正文打分</span><i>→</i><span>ROC-AUC</span></div><strong>受控候选集实测：ROC-AUC ${Number(benchmark.rocAuc).toFixed(3)}</strong></aside>` : ""}
    </div>`;
  }

  function graphVisual(product, currentPhase) {
    return `<div class="graph-product-view">
      <div class="graph-query"><span>${escapeHtml(product.inputLabel)}</span><strong>${escapeHtml(product.inputValue)}</strong></div>
      <div class="graph-canvas"><i class="graph-edge e1 ${currentPhase >= 2 ? "visible" : ""}"></i><i class="graph-edge e2 ${currentPhase >= 3 ? "visible" : ""}"></i><i class="graph-edge e3 sensitive ${currentPhase >= 4 ? "visible" : ""}"></i><i class="graph-edge e4 sensitive ${currentPhase >= 4 ? "visible" : ""}"></i><span class="graph-node n1">企业 A</span><span class="graph-node n2 ${currentPhase >= 2 ? "visible" : ""}">股东 B</span><span class="graph-node n3 ${currentPhase >= 3 ? "visible" : ""}">账户 C</span><span class="graph-node n4 sensitive ${currentPhase >= 4 ? "visible" : ""}">关联方 D</span><span class="graph-node n5 sensitive ${currentPhase >= 4 ? "visible" : ""}">隐藏路径</span></div>
      <div class="graph-result">${currentPhase >= 4 ? "攻击组合后恢复了未直接返回的关系路径" : currentPhase >= 3 ? escapeHtml(product.outputValue) : "正在展开公开关系…"}</div>
    </div>`;
  }

  function selectedCreditRecord() {
    const selectedId = String(structuredConditionValue("creditEnterprise")).split("｜").at(-1);
    return creditRecordById.get(selectedId) ?? creditExampleRecord;
  }

  function creditFormulaStrip(product) {
    const formula = product.id === "finance-model"
      ? enterpriseCreditStore.observerRule?.defaultFormula ?? ""
      : enterpriseCreditStore.observerRule?.formula ?? "";
    const gradeThresholds = enterpriseCreditStore.observerRule?.gradeThresholds ?? [35, 50, 65];
    const productRule = product.id === "city-grade"
      ? `等级：A（R＜${gradeThresholds[0]}）· B（${gradeThresholds[0]}≤R＜${gradeThresholds[1]}）· C（${gradeThresholds[1]}≤R＜${gradeThresholds[2]}）· D（R≥${gradeThresholds[2]}）`
      : product.id === "content-rank"
        ? enterpriseCreditStore.observerRule?.rankRule ?? "按风险指数 R 从高到低排列。"
        : "";
    return `<div class="credit-formula-strip"><code>${escapeHtml(formula)}</code>${productRule ? `<strong>${escapeHtml(productRule)}</strong>` : ""}</div>`;
  }

  function creditProductVisual(product, currentPhase) {
    const record = selectedCreditRecord();
    const ready = currentPhase >= 3;
    const exposed = currentPhase >= 4;
    return `<div class="credit-product-view">
      <section class="credit-enterprise-card"><header><strong>${escapeHtml(record.name)}</strong><b>${escapeHtml(record.id)}</b></header><div class="credit-feature-grid">${enterpriseCreditStore.schema.map((field) => {
        const sensitive = field.sensitive === true;
        return `<article class="${sensitive ? "is-sensitive" : ""}"><span>${escapeHtml(field.label)}</span><strong>${sensitive ? exposed ? "已被攻击反演" : "受保护" : `${escapeHtml(record[field.key])}${escapeHtml(field.unit)}`}</strong></article>`;
      }).join("")}</div></section>
      <div class="credit-output-card ${ready ? "is-ready" : ""}"><span>${escapeHtml(product.outputLabel)}</span><strong>${ready ? escapeHtml(creditOutputText(product.id, record)) : "等待读取"}</strong></div>
      ${exposed ? '<div class="attack-overlay">参考企业的完整特征—输出对被用来学习代理规则，目标企业的逾期率开始显现。</div>' : ""}
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

  function speechModelVisual(product, currentPhase) {
    return `<div class="attribute-product-view">
      <div class="subject-card"><span>输入语音</span><strong>${escapeHtml(product.inputValue)}</strong><small>合成语音演示文件</small></div>
      <div class="attribute-board"><div><span>模型处理</span><b>语音转写</b><b>说话人识别</b></div><div class="hidden-attributes ${currentPhase >= 4 ? "exposed" : ""}"><span>训练语音</span><b>${currentPhase >= 4 ? "说话人特征：已恢复" : "说话人特征：•••"}</b><b>${currentPhase >= 4 ? "成员关系：已判断" : "成员关系：•••"}</b></div></div>
      <div class="score-dial ${currentPhase >= 3 ? "ready" : ""}"><span>${escapeHtml(product.outputLabel)}</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "—"}</strong><i></i></div>
    </div>`;
  }

  function distillationModelVisual(product, currentPhase) {
    return `<div class="attribute-product-view">
      <div class="subject-card"><span>蒸馏任务</span><strong>${escapeHtml(product.inputValue)}</strong><small>离线合成模型任务</small></div>
      <div class="attribute-board"><div><span>教师模型</span><b>生成软标签</b><b>传递任务行为</b></div><div class="hidden-attributes ${currentPhase >= 4 ? "exposed" : ""}"><span>学生模型</span><b>${currentPhase >= 3 ? "D-08 · 80M 参数" : "等待训练"}</b><b>${currentPhase >= 4 ? "教师行为：已恢复" : "教师行为：•••"}</b></div></div>
      <div class="score-dial ${currentPhase >= 3 ? "ready" : ""}"><span>${escapeHtml(product.outputLabel)}</span><strong>${currentPhase >= 3 ? escapeHtml(product.outputValue) : "—"}</strong><i></i></div>
    </div>`;
  }

  function renderVisual(activeSeries, product, currentPhase) {
    if (product.id === "content-voice") return residentFaceVerificationVisual(product, currentPhase);
    if (product.id === "content-speech") return speechModelVisual(product, currentPhase);
    if (product.id === "model-distillation") return distillationModelVisual(product, currentPhase);
    if (creditProductIds.has(product.id)) return creditProductVisual(product, currentPhase);
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
        monthlyIncome: "monthly_income",
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
        output: `{ "records": ${queryResidents().length}, "returned_fields": ["resident_id", "street", "age", "occupation", "household_size", "housing"], "queryable_protected_fields": ["monthly_income", "subsidy_status", "insurance"] }`,
      };
      if (product.id === "finance-aggregate") {
        const statistics = residentStatistics();
        return {
          language: "SQL / JSON",
          code: `SELECT AVG(monthly_income) AS average_monthly_income,\n       AVG(CASE WHEN subsidy_status = '有效' THEN 1.0 ELSE 0.0 END) AS active_subsidy_share,\n       AVG(CASE WHEN subsidy_status = '暂停' THEN 1.0 ELSE 0.0 END) AS paused_subsidy_share,\n       AVG(CASE WHEN insurance = '城镇职工' THEN 1.0 ELSE 0.0 END) AS employee_insurance_share,\n       AVG(CASE WHEN insurance = '城乡居民' THEN 1.0 ELSE 0.0 END) AS resident_insurance_share\nFROM residents\nWHERE ${where};\n\nparams = ${JSON.stringify(parameters)}`,
          output: `{ "average_monthly_income": ${statistics.averageMonthlyIncome.toFixed(1)}, "subsidy_distribution": ${JSON.stringify(statistics.subsidyShares)}, "insurance_distribution": ${JSON.stringify(statistics.insuranceShares)} }`,
        };
      }
      return {
        language: "SQL / JSON",
        code: `SELECT EXISTS (\n  SELECT 1\n  FROM residents\n  WHERE ${where}\n) AS exists;\n\nparams = ${JSON.stringify(parameters)}`,
        output: `{ "exists": ${product.outputValue === "存在"}, "records": "protected" }`,
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
    if (product.id === "finance-derived") {
      const processing = residentProcessingInfo();
      const filters = structuredConditions
        .filter((condition) => !residentProcessingSettingKeys.has(condition.field))
        .map((condition) => `${structuredFields(product).get(condition.field)?.label}: ${condition.value}`);
      const operation = processing.method === "有放回重采样"
        ? "bootstrap(filtered, { size, replace: true })"
        : processing.method === "无放回子采样"
          ? "subsample(filtered, { size, replace: false })"
          : "synthesize(filtered, { size, preserveDistribution: true })";
      return {
        language: "JAVASCRIPT / JSON",
        code: `const residents = await load("resident-public-service");\nconst filtered = applyFilters(residents, ${JSON.stringify(filters)});\nconst size = ${processing.rows.length};\nconst processed = ${operation};\nreturn processed;`,
        output: JSON.stringify({ method: processing.method, filtered_records: processing.poolSize, output_records: processing.rows.length, preview: processing.rows.slice(0, 3).map((item) => item.record) }, null, 2),
      };
    }
    if (creditProductIds.has(product.id)) {
      const record = selectedCreditRecord();
      const riskCode = `const risk = clamp(\n  0.26 * enterprise.debtRatio\n  + 0.18 * enterprise.cashFlowStress\n  + 0.14 * enterprise.revenueVolatility\n  + 0.10 * enterprise.operatingAgeRisk\n  + 0.10 * enterprise.legalRisk\n  + 0.70 * enterprise.overdueRate,\n  0, 100\n);`;
      const productRuleCode = product.id === "finance-model"
        ? `const logit = -4.20\n  + 1.70 * enterprise.debtRatio / 100\n  + 1.25 * enterprise.cashFlowStress / 100\n  + 0.95 * enterprise.revenueVolatility / 100\n  + 0.55 * enterprise.operatingAgeRisk / 100\n  + 0.65 * enterprise.legalRisk / 100\n  + 2.10 * enterprise.overdueRate / 30;\nconst probability = 1 / (1 + Math.exp(-logit));\nreturn { default_probability_90d: round(probability, 4) };`
        : product.id === "finance-index"
          ? `${riskCode}\nreturn { risk_index: round(risk, 1) };`
          : product.id === "city-grade"
            ? `${riskCode}\nconst grade = risk < 35 ? "A" : risk < 50 ? "B" : risk < 65 ? "C" : "D";\nreturn { risk_grade: grade };`
            : `${riskCode}\nconst rank = cohort.sort((a, b) => b.risk - a.risk).findIndex(item => item.id === enterprise.id) + 1;\nreturn { risk_rank: rank, cohort_size: 100 };`;
      return {
        language: "产品内部 JAVASCRIPT / JSON",
        code: `// 真实产品规则：仅供演示观察者核对\n// 攻击训练函数不读取本段代码或真实系数\n${productRuleCode}`,
        output: JSON.stringify({ enterprise: record.id, product_output: creditOutputText(product.id, record), sensitive_feature_returned: false }, null, 2),
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
      language: "请求 / 回答",
      code: (() => {
        const response = ragResponseFor(product);
        return JSON.stringify({
          question: response?.question,
          image_attached: Boolean(response?.imageId),
        }, null, 2);
      })(),
      output: (() => {
        const response = ragResponseFor(product);
        return JSON.stringify({
          answer: publicRagAnswer(response?.answer ?? product.outputValue),
        }, null, 2);
      })(),
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
    if (product.id === "city-verify") {
      return `<form class="product-control structured-query-control" data-product-form><div class="condition-builder">
        <div class="condition-builder-heading"><span>资格核验条件</span></div>
        <div class="processing-setting-list verification-setting-list">${structuredConditions.map((condition, index) => {
          const field = fields.get(condition.field) ?? schema[index];
          return `<label><span>${escapeHtml(field.label)}</span>${renderStructuredValueControl(condition, field, index)}</label>`;
        }).join("")}</div>
      </div><div class="query-actions"><button type="button" class="secondary" data-reset-query>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></div></form>`;
    }
    if (product.id === "content-voice") {
      const condition = structuredConditions[0];
      const field = fields.get(condition.field) ?? schema[0];
      return `<form class="product-control structured-query-control" data-product-form><div class="condition-builder">
        <div class="condition-builder-heading"><span>人脸身份核验</span></div>
        <div class="face-verification-input-list">
          <label class="face-signature-input"><span>${escapeHtml(field.label)}</span>${renderStructuredValueControl(condition, field, 0)}</label>
          <div class="face-image-input"><span>待核验图片</span><label class="face-image-picker"><img src="${escapeHtml(faceImageUrl)}" alt="当前选择的待核验人脸" data-face-image-preview /><small>选择图片</small><input type="file" accept="image/*" data-face-image-input aria-label="选择待核验人脸图片" hidden /></label></div>
        </div>
      </div><div class="query-actions"><button type="button" class="secondary" data-reset-query>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></div></form>`;
    }
    if (product.id === "finance-verify") {
      return `<form class="product-control structured-query-control" data-product-form><div class="condition-builder">
        <div class="condition-builder-heading"><span>两主体关系核验</span></div>
        <div class="processing-setting-list verification-setting-list">${structuredConditions.map((condition, index) => {
          const field = fields.get(condition.field) ?? schema[index];
          return `<label><span>${escapeHtml(field.label)}</span>${renderStructuredValueControl(condition, field, index)}</label>`;
        }).join("")}</div>
      </div><div class="query-actions"><button type="button" class="secondary" data-reset-query>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></div></form>`;
    }
    if (creditProductIds.has(product.id)) {
      const condition = structuredConditions[0];
      const field = fields.get(condition.field) ?? schema[0];
      return `<form class="product-control structured-query-control credit-product-control" data-product-form><div class="condition-builder">
        <div class="processing-setting-list"><label><span>${escapeHtml(field.label)}</span>${renderStructuredValueControl(condition, field, 0)}</label></div>
      </div><div class="query-actions"><button type="button" class="secondary" data-reset-query>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></div></form>`;
    }
    if (product.id === "finance-derived") {
      const filterSchema = schema.filter((field) => !residentProcessingSettingKeys.has(field.key));
      const filterConditions = structuredConditions.map((condition, index) => ({ condition, index })).filter(({ condition }) => !residentProcessingSettingKeys.has(condition.field));
      const settings = structuredConditions.map((condition, index) => ({ condition, index })).filter(({ condition }) => residentProcessingSettingKeys.has(condition.field));
      return `<form class="product-control structured-query-control" data-product-form><div class="condition-builder processing-query-builder">
        <div class="condition-builder-heading"><span>筛选条件</span></div>
        <div class="condition-list">${filterConditions.map(({ condition, index }, rowIndex) => {
          const field = fields.get(condition.field) ?? filterSchema[0];
          return `<div class="condition-row processing-filter-row" data-condition-row="${index}">
            <select data-condition-field="${index}" aria-label="第 ${rowIndex + 1} 个筛选字段">${filterSchema.map((candidate) => `<option value="${escapeHtml(candidate.key)}" ${candidate.key === field.key ? "selected" : ""}>${escapeHtml(candidate.label)}</option>`).join("")}</select>
            ${renderStructuredValueControl(condition, field, index)}
            <button type="button" class="condition-remove" data-remove-condition="${index}" ${filterConditions.length === 1 ? "disabled" : ""} aria-label="删除第 ${rowIndex + 1} 个筛选条件">删除</button>
          </div>`;
        }).join("")}</div>
        <button type="button" class="condition-add" data-add-condition ${filterConditions.length >= filterSchema.length ? "disabled" : ""}>+ 添加筛选条件</button>
        <div class="condition-builder-heading processing-setting-heading"><span>加工设置</span></div>
        <div class="processing-setting-list">${settings.map(({ condition, index }) => {
          const field = fields.get(condition.field);
          return `<label><span>${escapeHtml(field.label)}</span>${renderStructuredValueControl(condition, field, index)}</label>`;
        }).join("")}</div>
      </div><div class="query-actions"><button type="button" class="secondary" data-reset-query>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></div></form>`;
    }
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
    if (ragProductIds.has(product.id)) {
      const responses = ragResponsesByProduct.get(product.id) ?? [];
      const selected = ragResponseFor(product);
      const image = selected?.imageId ? ragImagesById.get(selected.imageId) : null;
      return `<form class="product-control rag-chat-control ${product.id === "content-multimodal" ? "is-multimodal" : ""}" data-product-form>
        <fieldset>
          <legend>${product.id === "content-multimodal" ? "选择图片与对应问题" : "选择一个问题"}</legend>
          <div class="rag-question-options">${responses.map((response) => {
            const responseImage = response.imageId ? ragImagesById.get(response.imageId) : null;
            return `<label class="${responseImage ? "has-image " : ""}${response.id === selected?.id ? "is-selected" : ""}">${responseImage ? `<img src="${escapeHtml(responseImage.path)}" alt="" />` : ""}<input type="radio" name="rag-question" value="${escapeHtml(response.id)}" data-rag-question ${response.id === selected?.id ? "checked" : ""} /><span>${escapeHtml(response.question)}</span></label>`;
          }).join("")}</div>
        </fieldset>
        ${product.id === "content-multimodal" ? `<div class="rag-image-input">${image ? `<img src="${escapeHtml(image.path)}" alt="${escapeHtml(image.title)}" /><strong>${escapeHtml(image.title)}</strong>` : "<strong>尚未选择图片</strong>"}</div>` : ""}
        <div class="rag-submit"><button type="submit" data-run-product ${responses.length ? "" : "disabled"}>${escapeHtml(product.callLabel)}</button></div>
      </form>`;
    }
    if (structuredConfig(product)) return renderStructuredProductControl(product);
    return `<form class="product-control" data-product-form><label><span>${escapeHtml(product.inputLabel)}</span><input type="text" value="${escapeHtml(product.inputValue)}" data-product-input aria-label="${escapeHtml(product.inputLabel)}" /></label><button type="button" class="secondary" data-reset-input>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></form>`;
  }

  function attackProgressItems(product) {
    if (product.id === "content-voice") return faceHillClimbSteps;
    if (creditProductIds.has(product.id)) return creditInferenceSteps;
    return seriesRecoveryProductIds.has(product.id) ? membershipRecoverySteps : product.attacks;
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

  function resetFaceVerificationImage() {
    if (faceImageUrl.startsWith("blob:")) window.URL.revokeObjectURL(faceImageUrl);
    faceImageUrl = defaultFaceImageUrl;
    faceImageMatchesResident = true;
  }

  function renderLab() {
    const { activeSeries, products, product } = current();
    phase = 0;
    attackStep = 0;
    viewMode = "interface";
    inputValue = product.inputValue;
    const displayProduct = withCurrentInput(product);
    const minimalFooter = Boolean(structuredConfig(product) || ragProductIds.has(product.id));
    const progressItems = attackProgressItems(product);
    root.innerHTML = `
      <div class="series-switcher" aria-label="选择产品演示系列">${series.map((item, index) => `<button type="button" data-series="${index}" aria-pressed="${seriesIndex === index}" class="${seriesIndex === index ? "active" : ""}"><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="product-switcher" aria-label="${escapeHtml(activeSeries.name)}产品切换">${products.map((item, index) => `<button type="button" data-product="${index}" aria-pressed="${productIndex === index}" class="${productIndex === index ? "active" : ""}"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.name)}</strong></button>`).join("")}</div>
      <div class="guided-tour">
        <section class="demo-act product-demo-act">
          <header class="demo-act-heading"><strong>产品演示</strong></header>
          <article class="product-window"><header><div><span class="product-avatar">${escapeHtml(activeSeries.code)}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${escapeHtml(product.family)}</small></span></div><div class="product-header-tools"><div class="view-mode-switch" aria-label="产品展示方式">${[["interface", "产品界面"], ["technical", "代码与数据"]].map(([mode, label]) => `<button type="button" data-view-mode="${mode}" aria-pressed="${mode === viewMode}" class="${mode === viewMode ? "active" : ""}">${label}</button>`).join("")}</div><a href="security_attacks/${encodeURIComponent(product.category)}.html">类别说明</a></div></header>${creditProductIds.has(product.id) ? creditFormulaStrip(product) : ""}${renderProductUsageCounter(product)}<form class="product-control" data-product-form><label><span>${escapeHtml(product.inputLabel)}</span><input type="text" value="${escapeHtml(product.inputValue)}" data-product-input aria-label="${escapeHtml(product.inputLabel)}" /></label><button type="button" class="secondary" data-reset-input>恢复示例</button><button type="submit" data-run-product>${escapeHtml(product.callLabel)}</button></form><div class="product-canvas" data-product-canvas>${renderProductPresentation(activeSeries, displayProduct, 0)}</div><footer class="${minimalFooter ? "minimal-product-footer" : ""}">${minimalFooter ? "" : '<button type="button" data-rerun>↻ 重播当前输入</button><span data-product-status>请编辑输入并运行产品</span>'}<button type="button" class="start-attack" data-start-attack disabled>开始隐私攻击演示 →</button></footer></article>
        </section>
        <section class="demo-act attack-demo-act" data-attack-stage hidden>
          <header class="demo-act-heading inverse"><strong>隐私攻击演示</strong></header>
          <div class="attack-stage ${seriesRecoveryProductIds.has(product.id) ? "membership-recovery-stage" : ""}">
            <article class="attack-target"><header>${creditProductIds.has(product.id) ? "" : "<span>攻击对象</span>"}<strong>${escapeHtml(product.name)}</strong></header>${seriesRecoveryProductIds.has(product.id) ? "" : `<ol class="attack-progress-list" data-attack-progress>${progressItems.map((item, index) => `<li data-attack-index="${index}"><b>${index + 1}</b><span>${escapeHtml(item.name)}</span></li>`).join("")}</ol>`}<div class="attack-canvas" data-attack-canvas>${seriesRecoveryProductIds.has(product.id) ? productRecoveryAttackVisual(product, 0) : renderVisual(activeSeries, product, 3)}</div></article>
            ${seriesRecoveryProductIds.has(product.id) ? "" : `<aside class="audit-rail" aria-live="polite"><div class="audit-kicker"><span>旁路隐私评估器</span><i>已连接</i></div><h3 data-audit-title>准备执行适用攻击</h3><div class="audit-counter"><span>已完成攻击</span><strong data-risk-value>0 / ${progressItems.length}</strong></div><div class="audit-meter"><i data-risk-bar></i></div><ul data-evidence-list><li>等待攻击序列开始</li></ul></aside>`}
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
    if (initialStatus) initialStatus.textContent = ragProductIds.has(product.id) ? "请选择一个固定问题并运行" : product.id === "city-existence" ? "请设置条件并运行产品" : "请编辑输入并运行产品";
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
    refreshProductUsageCounter(product);
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
    const progressItems = attackProgressItems(product);
    attackStep = nextStep;
    const attackCanvas = root.querySelector("[data-attack-canvas]");
    if (attackCanvas) attackCanvas.innerHTML = seriesRecoveryProductIds.has(product.id) ? productRecoveryAttackVisual(product, attackStep) : renderVisual(activeSeries, displayProduct, attackStep > 0 ? 4 : 3);
    root.querySelectorAll("[data-attack-index]").forEach((item) => {
      const index = Number(item.getAttribute("data-attack-index"));
      item.classList.toggle("active", index === attackStep - 1);
      item.classList.toggle("done", index < attackStep);
    });
    const title = root.querySelector("[data-audit-title]");
    const value = root.querySelector("[data-risk-value]");
    const bar = root.querySelector("[data-risk-bar]");
    const evidence = root.querySelector("[data-evidence-list]");
    if (ragProductIds.has(product.id)) {
      const benchmark = ragMembershipResultFor(product);
      if (title) title.textContent = attackStep === 0 ? "准备语料成员推断" : "正在执行：RAG 语料成员推断";
      if (evidence) evidence.innerHTML = attackStep === 0
        ? "<li>等待对候选数据集执行重复查询</li>"
        : `<li>已完成 ${benchmark.queryCount} 次查询；仅从 Chatbot 回答正文计算候选成员分数，ROC-AUC=${Number(benchmark.rocAuc).toFixed(3)}。</li>`;
    } else if (seriesRecoveryProductIds.has(product.id)) {
      if (title) title.textContent = attackStep === 0 ? "准备居民数据库成员恢复" : progressItems[Math.min(attackStep, progressItems.length) - 1].title;
      if (evidence) evidence.innerHTML = attackStep === 0 ? "<li>等待成员恢复攻击开始</li>" : progressItems.slice(0, attackStep).map((item, index) => {
        if (membershipRecoveryRun && index === 1) return `<li>代码实际调用 ${membershipRecoveryRun.queryCount} 次：缓存命中 ${membershipRecoveryRun.cacheHits} 次，新执行 ${membershipRecoveryRun.cacheMisses} 次。</li>`;
        if (membershipRecoveryRun && index === 2) return `<li>恢复 ${membershipRecoveryRun.truePositives}/${residentStore.records.length} 条真实成员；遗漏 ${membershipRecoveryRun.falseNegatives} 条，误判 ${membershipRecoveryRun.falsePositives} 条。</li>`;
        return `<li>${escapeHtml(item.evidence)}</li>`;
      }).join("");
    } else {
      if (title) title.textContent = attackStep === 0 ? "准备执行适用攻击" : attackStep === progressItems.length ? "全部适用攻击已经完成" : `正在执行：${product.attacks[attackStep - 1].name}`;
      if (evidence) evidence.innerHTML = attackStep === 0 ? "<li>等待攻击序列开始</li>" : product.attacks.slice(0, attackStep).map((attack) => `<li>${escapeHtml(attack.name)}：${escapeHtml(attack.result)}</li>`).join("");
    }
    if (value) value.textContent = `${attackStep} / ${progressItems.length}`;
    if (bar) bar.style.width = `${attackStep / progressItems.length * 100}%`;
    if (attackStep === progressItems.length) renderResults(product);
  }

  function startAttackRun() {
    timers.forEach(window.clearTimeout);
    timers = [];
    const stage = root.querySelector("[data-attack-stage]");
    const results = root.querySelector("[data-results]");
    if (stage) stage.hidden = false;
    if (results) results.hidden = true;
    if (seriesRecoveryProductIds.has(current().product.id)) {
      membershipRecoveryRun = null;
      productRecoveryRun = null;
    }
    updateAttackStep(0);
    stage?.scrollIntoView({ behavior: "smooth", block: "start" });
    const progressItems = attackProgressItems(current().product);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updateAttackStep(progressItems.length);
      return;
    }
    timers = progressItems.map((_, index) => window.setTimeout(() => updateAttackStep(index + 1), 350 + index * 820));
  }

  function renderResults(product) {
    const candidates = candidatesByProduct[product.id] ?? [];
    const applicableCount = candidates.filter((candidate) => candidate.applicable).length;
    const executedCount = candidates.filter((candidate) => candidate.executed).length;
    const result = aggregate(product);
    const results = root.querySelector("[data-results]");
    if (!results) return;
    results.hidden = false;
    if (product.id === "city-existence") {
      const run = membershipRecoveryRun ??= runMembershipRecoveryAttack();
      results.innerHTML = `
        <header><div><h3>攻击结果</h3></div><strong>${run.truePositives} / ${residentStore.records.length}</strong></header>
        <div class="membership-result-stats"><article><span>系统真实成员</span><strong>${residentStore.records.length}</strong></article><article><span>成功恢复</span><strong>${run.truePositives}</strong></article><article><span>真实成员遗漏</span><strong>${run.falseNegatives}</strong></article><article><span>非成员误判</span><strong>${run.falsePositives}</strong></article></div>`;
      return;
    }
    if (product.id === "content-voice") {
      const run = productRecoveryRun ??= runProductRecoveryAttack(product);
      if (!run) return;
      results.innerHTML = `
        <header><div><span>离线机制演示结果</span><h3>连续人脸爬山已完成</h3></div><strong>${(run.similarity * 100).toFixed(2)}%</strong></header>
        <div class="face-final-result">${faceBlendPortrait(run.recoveredFrame, "is-final")}<p>从 ${(run.initialSimilarity * 100).toFixed(2)}% 连续提升到 ${(run.similarity * 100).toFixed(2)}%；最终产品输出为“${run.authenticated ? "认证" : "不认证"}”。</p></div>
        <div class="membership-result-stats"><article><span>连续接受步</span><strong>${run.acceptedTrajectory.length}</strong></article><article><span>拒绝探针</span><strong>${run.rejectedProbes.length}</strong></article><article><span>随机重启</span><strong>${run.restartCount}</strong></article><article><span>${(run.threshold * 100).toFixed(0)}% 认证阈值</span><strong>${run.authenticated ? "已越过" : "未越过"}</strong></article></div>`;
      return;
    }
    if (creditProductIds.has(product.id)) {
      const run = productRecoveryRun ??= runProductRecoveryAttack(product);
      if (!run) return;
      const primaryMetric = product.id === "city-grade" ? `${(run.recall * 100).toFixed(1)}%` : `${run.meanAbsoluteError.toFixed(2)} 个百分点`;
      results.innerHTML = `
        <header><div><h3>${escapeHtml(product.attacks[0].name)}</h3></div><strong>${primaryMetric}</strong></header>
        <div class="membership-result-stats ${product.id === "city-grade" ? "five-columns" : ""}"><article><span>统一数据集</span><strong>${enterpriseCreditStore.records.length} 家</strong></article><article><span>完整参考企业</span><strong>${run.referenceCount}</strong></article><article><span>待推断企业</span><strong>${run.targetCount}</strong></article>${product.id === "city-grade" ? `<article><span>平均区间长度</span><strong>${run.meanIntervalWidth.toFixed(2)} 个百分点</strong></article>` : ""}<article><span>真实公式读取</span><strong>${run.formulaAccessCount}</strong></article></div>`;
      return;
    }
    if (ragProductIds.has(product.id)) {
      const benchmark = ragMembershipResultFor(product);
      results.innerHTML = `
        <header><div><h3>RAG 语料成员推断</h3></div><strong>AUC ${Number(benchmark.rocAuc).toFixed(3)}</strong></header>
        <div class="rag-membership-summary" aria-label="RAG 语料成员推断效果指标">
          <article><span>候选对象</span><strong>${benchmark.candidateCount}</strong></article>
          <article><span>成员 / 非成员</span><strong>${benchmark.memberCount} / ${benchmark.nonmemberCount}</strong></article>
          <article><span>查询次数</span><strong>${benchmark.queryCount}</strong></article>
          <article><span>ROC-AUC</span><strong>${Number(benchmark.rocAuc).toFixed(3)}</strong></article>
        </div>
        <div class="rag-membership-score-gap">
          <article><span>成员平均分</span><strong>${Number(benchmark.meanMemberScore).toFixed(3)}</strong></article>
          <article><span>非成员平均分</span><strong>${Number(benchmark.meanNonmemberScore).toFixed(3)}</strong></article>
          <article><span>0.5 阈值准确率</span><strong>${(Number(benchmark.accuracyAtHalf) * 100).toFixed(1)}%</strong></article>
        </div>
        <p class="rag-membership-note">受控合成候选集实测；攻击分数只由 Chatbot 回答正文计算，检索结果、相似度和文档 ID 不参与打分。</p>`;
      return;
    }
    if (seriesRecoveryProductIds.has(product.id)) {
      const config = recoveryAttackConfigs.get(product.id);
      const run = productRecoveryRun ??= runProductRecoveryAttack(product);
      if (!config || !run) return;
      results.innerHTML = `
        <header><div><h3>攻击结果</h3></div><strong>${run.truePositives} / ${config.targets.length}</strong></header>
        <div class="membership-result-stats"><article><span>${escapeHtml(config.truthMetricLabel)}</span><strong>${config.targets.length}</strong></article><article><span>${escapeHtml(config.recoveredMetricLabel)}</span><strong>${run.truePositives}</strong></article><article><span>${escapeHtml(config.missedMetricLabel)}</span><strong>${run.falseNegatives}</strong></article><article><span>${escapeHtml(config.falseMetricLabel)}</span><strong>${run.falsePositives}</strong></article></div>`;
      return;
    }
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
      resetFaceVerificationImage();
      renderLab();
    } else if (productButton) {
      productIndex = Number(productButton.getAttribute("data-product"));
      structuredConditions = defaultStructuredConditions(current().product);
      resetFaceVerificationImage();
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
      if (current().product.id === "content-voice") resetFaceVerificationImage();
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
      if (consumeProductUsage(current().product)) scheduleProductRun();
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
    if (target instanceof HTMLInputElement && target.matches("[data-rag-question]")) {
      const product = current().product;
      if (!ragProductIds.has(product.id)) return;
      selectedRagQuestionIds.set(product.id, target.value);
      inputValue = ragResponseFor(product)?.question ?? product.inputValue;
      refreshProductControl();
      resetAfterControlEdit();
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-face-image-input]")) {
      const file = target.files?.[0];
      if (!file) return;
      if (faceImageUrl.startsWith("blob:")) window.URL.revokeObjectURL(faceImageUrl);
      faceImageUrl = window.URL.createObjectURL(file);
      faceImageMatchesResident = false;
      const preview = root.querySelector("[data-face-image-preview]");
      if (preview instanceof HTMLImageElement) preview.src = faceImageUrl;
      resetAfterControlEdit();
      return;
    }
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.matches("[data-product-usage-limit]")) {
      const product = current().product;
      const limit = Number(target.value);
      if (productUsageLimitOptionsFor(product).includes(limit)) {
        productUsageLimits.set(product.id, limit);
        productUsageRemaining.set(product.id, limit);
        membershipRecoveryRun = null;
        productRecoveryRun = null;
        timers.forEach(window.clearTimeout);
        timers = [];
        renderLab();
      }
      return;
    }
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
    const product = current().product;
    if (!consumeProductUsage(product)) return;
    const input = form.querySelector("[data-product-input]");
    if (input instanceof HTMLInputElement) inputValue = input.value;
    if (ragProductIds.has(product.id)) inputValue = ragResponseFor(product)?.question ?? product.inputValue;
    if (structuredConfig(product)) inputValue = formatStructuredConditions(product);
    scheduleProductRun();
  });

  structuredConditions = defaultStructuredConditions(current().product);
  renderLab();
})();
