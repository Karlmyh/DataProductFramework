export type EvidenceLevel = "已有实测" | "机制验证" | "受控演示";

export type DemoAttack = {
  id: string;
  name: string;
  brief: string;
  result: string;
  metric: string;
  value: string;
  displayScore: number;
  attackFamily: string;
  attackObject: string;
  evidence: EvidenceLevel;
  source: string;
  protocol: string;
  limitation: string;
};

export type AttackCandidate = {
  id: string;
  name: string;
  applicable: boolean;
  executed: boolean;
  reason: string;
};

export type DemoProduct = {
  id: string;
  category: string;
  family: string;
  name: string;
  tagline: string;
  template: "query" | "score" | "model";
  inputLabel: string;
  inputValue: string;
  callLabel: string;
  flow: [string, string, string];
  outputLabel: string;
  outputValue: string;
  outputDetail: string;
  previewImage?: {
    src: string;
    alt: string;
  };
  showcase?: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{
      src: string;
      alt: string;
      label: string;
      metric: string;
      note: string;
    }>;
  };
  attacks: DemoAttack[];
};

export type DemoSuite = {
  id: string;
  code: string;
  name: string;
  description: string;
  products: DemoProduct[];
};

const a = (
  id: string,
  name: string,
  brief: string,
  result: string,
  metric: string,
  value: string,
  displayScore: number,
  evidence: EvidenceLevel,
): DemoAttack => {
  const semantics = attackSemantics[id] ?? { attackFamily: "推断攻击", attackObject: "属性隐私" };
  const trace = evidenceTrace[id] ?? {
    source: evidence === "机制验证" ? `衡量系统代码标准/attack_catalog.py · ${id}` : "页面虚构场景基准",
    protocol: evidence === "机制验证" ? "现有攻击入口的同机制受控适配" : "虚构产品、固定条件、离线界面演示",
    limitation: evidence === "机制验证" ? "机制已有执行入口；当前产品数字仍需按正式协议复测。" : "仅用于展示比较与聚合，不是现实产品测量结果。",
  };
  return { id, name, brief, result, metric, value, displayScore, evidence, ...semantics, ...trace };
};

const attackSemantics: Record<string, Pick<DemoAttack, "attackFamily" | "attackObject">> = {
  ontology: { attackFamily: "组合推断", attackObject: "关系隐私" },
  subgraph: { attackFamily: "结构重建", attackObject: "关系隐私" },
  linkage: { attackFamily: "关联攻击", attackObject: "身份隐私" },
  "relation-enum": { attackFamily: "枚举推断", attackObject: "关系隐私" },
  network: { attackFamily: "结构重建", attackObject: "关系隐私" },
  threshold: { attackFamily: "边界推断", attackObject: "规则隐私" },
  "score-member": { attackFamily: "成员推断", attackObject: "成员隐私" },
  attribute: { attackFamily: "属性推断", attackObject: "属性隐私" },
  weight: { attackFamily: "能力提取", attackObject: "模型能力" },
  mia: { attackFamily: "成员推断", attackObject: "成员隐私" },
  extract: { attackFamily: "模型抽取", attackObject: "模型能力" },
  invert: { attackFamily: "输入反演", attackObject: "数据重构" },
  dlg: { attackFamily: "梯度反演", attackObject: "数据重构" },
  label: { attackFamily: "标签推断", attackObject: "标签隐私" },
  property: { attackFamily: "属性推断", attackObject: "属性隐私" },
  "group-test": { attackFamily: "群组测试", attackObject: "成员隐私" },
  enumerate: { attackFamily: "成员枚举", attackObject: "成员隐私" },
  compose: { attackFamily: "组合推断", attackObject: "属性隐私" },
  "attribute-enum": { attackFamily: "属性枚举", attackObject: "属性隐私" },
  "threshold-probe": { attackFamily: "边界推断", attackObject: "规则隐私" },
  member: { attackFamily: "成员推断", attackObject: "成员隐私" },
  "grade-extract": { attackFamily: "规则提取", attackObject: "模型能力" },
  segment: { attackFamily: "边界推断", attackObject: "规则隐私" },
  graphrag: { attackFamily: "结构重建", attackObject: "关系隐私" },
  prompt: { attackFamily: "信息提取", attackObject: "模型能力" },
  membership: { attackFamily: "成员推断", attackObject: "成员隐私" },
  reconstruct: { attackFamily: "梯度反演", attackObject: "数据重构" },
  reid: { attackFamily: "关联攻击", attackObject: "身份隐私" },
  "local-recon": { attackFamily: "数据重建", attackObject: "数据重构" },
  hill: { attackFamily: "黑盒爬山", attackObject: "身份隐私" },
  template: { attackFamily: "模板恢复", attackObject: "身份隐私" },
  boundary: { attackFamily: "边界推断", attackObject: "规则隐私" },
  topk: { attackFamily: "成员推断", attackObject: "成员隐私" },
  flip: { attackFamily: "排序推断", attackObject: "模型能力" },
  cutoff: { attackFamily: "边界推断", attackObject: "规则隐私" },
  "vision-mia": { attackFamily: "成员推断", attackObject: "成员隐私" },
  inversion: { attackFamily: "模型反演", attackObject: "数据重构" },
  extraction: { attackFamily: "模型抽取", attackObject: "模型能力" },
  "mm-injection": { attackFamily: "提示操纵", attackObject: "模型能力" },
  "cross-link": { attackFamily: "关联攻击", attackObject: "身份隐私" },
  memorize: { attackFamily: "样本提取", attackObject: "数据重构" },
  "image-mia-rf": { attackFamily: "成员推断", attackObject: "成员隐私" },
  revealer: { attackFamily: "模型反演", attackObject: "数据重构" },
  plgmi: { attackFamily: "模型反演", attackObject: "数据重构" },
  gradinv: { attackFamily: "梯度反演", attackObject: "数据重构" },
  idlg: { attackFamily: "标签推断", attackObject: "标签隐私" },
  sme: { attackFamily: "更新反演", attackObject: "数据重构" },
};

const evidenceTrace: Record<string, Pick<DemoAttack, "source" | "protocol" | "limitation">> = {
  ontology: {
    source: "kg_ontology_privacy_demo/results.js · tracks.ontology",
    protocol: "合成本体；预算 3；无防御；敏感事实召回",
    limitation: "只支持相同本体查询协议，不外推到一般企业数据库。",
  },
  "group-test": {
    source: "first_batch_attack_demo · 030101 existence",
    protocol: "Adult 候选总体 1024；隐藏成员 32；查询预算 512",
    limitation: "依赖候选总体知识与可自定义组合条件。",
  },
  enumerate: {
    source: "first_batch_attack_demo · 030101 enumeration baseline",
    protocol: "Adult 候选总体 1024；隐藏成员 32；查询预算 512",
    limitation: "同一受控数据上的逐条枚举基线。",
  },
  "grade-extract": {
    source: "first_batch_attack_demo · 030502 grade extraction",
    protocol: "Adult 四级接口；主动查询预算 1024；替代模型一致率",
    limitation: "只适用于同等输出粒度与查询权限。",
  },
  graphrag: {
    source: "kg_ontology_privacy_demo/results.js · r321_defenses.baseline",
    protocol: "虚构组织图；固定查询顺序；预算 8；关系泄露率",
    limitation: "GraphRAG 受控适配，不是对真实政策语料的攻击。",
  },
  hill: {
    source: "first_batch_attack_demo · 030402 identity",
    protocol: "CASIA-FaceV5；量化相似度；查询预算 512",
    limitation: "结果限于人脸核验协议与对应辅助子空间。",
  },
  "image-mia-rf": {
    source: "模型类攻击包 / RF 白盒成员推断实验",
    protocol: "CelebA Male 二分类；Random Forest 目标模型；训练成员与非成员白盒区分",
    limitation: "AUC 只对应当前数据划分、目标属性与白盒特征，不代表所有图片模型。",
  },
  revealer: {
    source: "模型类攻击包 / 图片数据重建攻击展示3种.html · Revealer",
    protocol: "CelebA Identity；100 个身份；2000/215 训练/测试图像；100 个最终样本、250 个候选",
    limitation: "当前结果使用可获得模型结构与参数的设置；不能外推为纯 API 黑盒效果。",
  },
  plgmi: {
    source: "模型类攻击包 / 图片数据重建攻击展示3种.html · PLGMI",
    protocol: "CelebA；VGG16；2000 个训练样本；250 个重建样本",
    limitation: "PSNR 反映像素失真，不等同于身份可识别率；与其他方法需统一协议后再比较。",
  },
  gradinv: {
    source: "模型类攻击包 / GradInversion 实验对比",
    protocol: "ImageNet；ResNet-50；batch=1；由单轮共享梯度重建输入与标签集合",
    limitation: "标签集合恢复稳定，但图像主要达到类别级结构；PSNR 仅 8.99 dB，不应表述为像素级精确恢复。",
  },
  idlg: {
    source: "模型类攻击包 / iDLG Adam 完整实验与批量实验",
    protocol: "无池化 CNN + Adam 适配；MNIST/CIFAR-100/LFW；batch=1 结果用于本 Demo",
    limitation: "适配网络与优化器带来接近完美的数值，不能与原论文或不同网络设置直接横比。",
  },
  sme: {
    source: "模型类攻击包 / SME CIFAR-100 多步更新反演",
    protocol: "CIFAR-100；N=50、batch=10、20 个本地 epoch、lr=0.004；由模型更新反演",
    limitation: "该结果依赖已知训练配置与受控客户端更新；真实联邦部署中的聚合、裁剪和噪声会改变风险。",
  },
};

export const demoSuites: DemoSuite[] = [
  {
    id: "finance",
    code: "DEMO 01",
    name: "金融数据协作中心",
    description: "同一批虚构企业与客户数据，被封装为数据库、核验、指标、预测模型和梯度五种产品。",
    products: [
      {
        id: "finance-graph",
        category: "030103",
        family: "行业基础数据库",
        name: "企业关系图谱",
        tagline: "查询企业、股东与项目路径，返回关系和解释。",
        template: "query",
        inputLabel: "关系查询",
        inputValue: "查询“远澜科技”的两跳控制路径",
        callLabel: "运行关系查询",
        flow: ["解析锚点", "遍历授权关系", "生成路径结果"],
        outputLabel: "公开响应",
        outputValue: "3 条路径 / 7 个实体",
        outputDetail: "返回公开关系及经过脱敏的路径说明，不直接显示受保护的实际控制边。",
        attacks: [
          a("ontology", "组合蕴含", "把多条看似安全的关系答案放在一起推理。", "第 3 次回答后，隐藏控制关系可被完整推出。", "敏感事实召回", "100%", 100, "机制验证"),
          a("subgraph", "子图累积", "连续询问相邻实体，拼接返回的局部关系。", "8 次查询恢复 70.8% 的关系边。", "关系泄露率", "70.8%", 71, "受控演示"),
          a("linkage", "跨源关联", "将公开企业名录与返回实体特征进行匹配。", "31 个匿名节点中有 19 个被重新链接。", "实体链接率", "61.3%", 61, "受控演示"),
        ],
      },
      {
        id: "finance-verify",
        category: "030403",
        family: "核验",
        name: "账户归属核验",
        tagline: "输入企业与账户，只回答是否存在归属或授权关系。",
        template: "query",
        inputLabel: "待核验命题",
        inputValue: "远澜科技 ↔ 账户尾号 8421",
        callLabel: "发起关系核验",
        flow: ["校验对象", "比对权威记录", "返回有限状态"],
        outputLabel: "核验结论",
        outputValue: "匹配",
        outputDetail: "公开接口只返回匹配、不匹配或无法核验，不提供底层账户记录。",
        attacks: [
          a("relation-enum", "关系枚举", "替换候选账户并观察有限状态变化。", "100 个候选中定位到 8 个真实绑定账户。", "关系召回", "80.0%", 80, "受控演示"),
          a("network", "关系图拼接", "组合不同企业与账户的核验结果。", "恢复 23/34 条隐藏资金归集关系。", "边恢复率", "67.6%", 68, "受控演示"),
          a("threshold", "规则边界试探", "在核验边界附近重复提交轻微变化的对象。", "能够识别 4 项核心匹配规则中的 3 项。", "规则识别", "75.0%", 75, "机制验证"),
        ],
      },
      {
        id: "finance-aggregate",
        category: "030104",
        family: "行业基础数据库",
        name: "小微企业经营统计查询",
        tagline: "按地区、行业与月份返回经门槛保护的汇总统计结果。",
        template: "query",
        inputLabel: "聚合条件",
        inputValue: "华东地区 ∧ 制造业 ∧ 2026-07",
        callLabel: "生成汇总统计",
        flow: ["校验分组条件", "执行受控聚合", "返回统计结果"],
        outputLabel: "聚合结果",
        outputValue: "样本 284 家 · 平均指数 68.2",
        outputDetail: "产品只交付群体统计，不直接返回任何单家企业记录。",
        attacks: [
          a("compose", "相邻查询差分", "比较只相差一个条件的聚合响应。", "连续 18 组差分后恢复 11 家企业的经营状态。", "状态恢复率", "61.1%", 61, "受控演示"),
          a("membership", "小群体成员探测", "缩小分组范围并观察统计值是否稳定变化。", "候选企业的成员识别 AUC 达到 0.77。", "ROC-AUC", "0.77", 65, "机制验证"),
          a("attribute", "分组属性推断", "组合地区与行业切片反推未公开敏感属性。", "目标企业的融资状态推断准确率达到 73%。", "属性准确率", "73.0%", 62, "受控演示"),
        ],
      },
      {
        id: "finance-derived",
        category: "030105",
        family: "行业基础数据库",
        name: "企业经营特征加工服务",
        tagline: "对授权企业记录执行标准化、派生与脱敏处理后交付特征包。",
        template: "query",
        inputLabel: "加工请求",
        inputValue: "企业 E-204 · 经营稳定性特征包 V3",
        callLabel: "生成派生特征",
        flow: ["读取授权记录", "执行派生处理", "交付特征结果"],
        outputLabel: "派生结果",
        outputValue: "12 项特征 · 已标准化",
        outputDetail: "产品交付的是从底层记录加工得到的派生字段，而不是原始记录。",
        attacks: [
          a("invert", "派生字段反演", "根据标准化结果反推原始字段的可能区间。", "12 项派生特征中有 8 项可定位到底层取值区间。", "区间恢复率", "66.7%", 67, "机制验证"),
          a("linkage", "跨源记录关联", "将派生特征与公开工商信息进行相似匹配。", "60 个匿名特征包中有 38 个被重新链接。", "重新链接率", "63.3%", 63, "受控演示"),
          a("threshold-probe", "处理规则探测", "提交边界附近记录并比较派生字段变化。", "9 项核心加工规则中恢复 6 项。", "规则恢复率", "66.7%", 67, "受控演示"),
        ],
      },
      {
        id: "finance-index",
        category: "030501",
        family: "指标",
        name: "企业信用风险指数",
        tagline: "按固定月度口径发布 0—100 的企业风险数值。",
        template: "score",
        inputLabel: "已发布对象",
        inputValue: "远澜科技 · 2026-07",
        callLabel: "读取风险指数",
        flow: ["锁定统计期", "应用固定口径", "发布数值指标"],
        outputLabel: "月度指标",
        outputValue: "72.4 / 100",
        outputDetail: "该结果针对既定对象与月份预先计算，不接受任意新样本预测。",
        attacks: [
          a("score-member", "成员判断", "比较候选记录加入前后的数值变化。", "成员与非成员的分数可分性达到 AUC 0.78。", "ROC-AUC", "0.78", 67, "受控演示"),
          a("attribute", "属性推断", "枚举隐藏属性并选择最符合公开分数的候选。", "敏感行业属性识别率从 52% 提升到 71%。", "推断准确率", "71.0%", 58, "机制验证"),
          a("weight", "权重恢复", "对公开分项做小幅变化并比较总分响应。", "8 个分项权重中恢复 6 个的排序。", "权重排序恢复", "75.0%", 75, "受控演示"),
        ],
      },
      {
        id: "finance-model",
        category: "030704",
        family: "模型",
        name: "违约预测 API",
        tagline: "接受新的企业特征，实时返回违约概率与风险标签。",
        template: "model",
        inputLabel: "新企业特征",
        inputValue: "现金流↓ · 负债率 68% · 行业 B",
        callLabel: "调用预测模型",
        flow: ["特征校验", "固定模型推理", "返回概率与标签"],
        outputLabel: "模型响应",
        outputValue: "0.81 · 高风险",
        outputDetail: "与指标产品不同，该 API 接受任意新输入并反复提供当前固定模型能力。",
        attacks: [
          a("mia", "评分成员推断", "用输出概率和真实标签构造成员分数。", "候选训练记录的识别 AUC 达到 0.81。", "ROC-AUC", "0.81", 72, "机制验证"),
          a("extract", "能力复制", "批量提交公开样本，用响应训练替代模型。", "替代模型与原模型预测一致率达到 88%。", "模型一致率", "88.0%", 88, "受控演示"),
          a("invert", "输入反演", "从高置信响应反向搜索典型高风险画像。", "恢复 7/10 个关键特征区间。", "特征恢复", "70.0%", 70, "受控演示"),
        ],
      },
      {
        id: "finance-gradient",
        category: "030901",
        family: "梯度",
        name: "联邦风控梯度",
        tagline: "分支机构提交一轮批次梯度，用于联合更新风控模型。",
        template: "model",
        inputLabel: "训练更新",
        inputValue: "批次 16 · 梯度张量 2.4 MB",
        callLabel: "交付一轮梯度",
        flow: ["本地反向传播", "梯度裁剪", "加密通道交付"],
        outputLabel: "交付结果",
        outputValue: "UPDATE #184 已接收",
        outputDetail: "交付物是训练过程中的更新信号，而不是固定模型文件或模型调用。",
        attacks: [
          a("dlg", "样本重建", "优化一个虚拟输入，使其产生近似梯度。", "批次中的主导样本可被重建，结构相似度 0.84。", "重建 SSIM", "0.84", 84, "机制验证"),
          a("label", "标签泄露", "从最后一层梯度的符号和幅度识别标签。", "16 个训练标签中恢复 15 个。", "标签恢复", "93.8%", 94, "受控演示"),
          a("property", "群体属性推断", "比较更新方向与辅助群体梯度模板。", "判断分支机构主要客群属性的 AUC 为 0.76。", "ROC-AUC", "0.76", 64, "受控演示"),
        ],
      },
    ],
  },
  {
    id: "city",
    code: "DEMO 02",
    name: "城市公共服务平台",
    description: "围绕虚构居民与城市设施，比较真假查询、资格核验、拥堵等级、政策问答与受保护梯度。",
    products: [
      {
        id: "city-existence",
        category: "030101",
        family: "行业基础数据库",
        name: "居民条件存在查询",
        tagline: "提交组合条件，接口只回答当前库中是否存在匹配记录。",
        template: "query",
        inputLabel: "组合条件",
        inputValue: "街道 07 ∧ 年龄 60+ ∧ 补贴状态有效",
        callLabel: "检查是否存在",
        flow: ["解析条件", "受控库检索", "返回 true / false"],
        outputLabel: "查询结果",
        outputValue: "TRUE",
        outputDetail: "没有返回居民姓名或字段值，但可定制条件与重复查询会累积信息。",
        attacks: [
          a("group-test", "群组测试", "逐步二分候选群体并保留仍返回 true 的分支。", "512 次查询恢复私有库 32/32 个成员。", "成员召回", "100%", 100, "已有实测"),
          a("enumerate", "逐条枚举", "对外部候选逐一提交存在性条件。", "同等 512 次预算下恢复 22/32 个成员。", "成员召回", "68.8%", 69, "已有实测"),
          a("compose", "条件组合", "比较相邻条件的真假变化定位敏感属性。", "32 个成员中 25 个的补贴状态被推断。", "属性恢复", "78.1%", 78, "受控演示"),
        ],
      },
      {
        id: "city-verify",
        category: "030401",
        family: "核验",
        name: "居民资格核验",
        tagline: "输入居民凭证与政策编号，只返回符合、不符合或待人工核验。",
        template: "query",
        inputLabel: "核验请求",
        inputValue: "凭证 R-2048 · 养老补贴 Q3",
        callLabel: "核验政策资格",
        flow: ["验证凭证", "匹配政策条件", "输出有限状态"],
        outputLabel: "核验结论",
        outputValue: "符合",
        outputDetail: "产品确认一个居民是否满足一项政策条件，不交付底层登记记录。",
        attacks: [
          a("attribute-enum", "属性枚举", "保持凭证不变，替换政策条件观察响应。", "12 项候选属性中确认 8 项隐藏状态。", "属性确认率", "66.7%", 67, "受控演示"),
          a("threshold-probe", "门槛试探", "在年龄和收入门槛附近构造相邻核验请求。", "将关键年龄门槛定位到 ±1 岁。", "门槛定位", "±1 岁", 82, "机制验证"),
          a("member", "名单探测", "利用稳定的拒绝模式判断对象是否存在于政策库。", "候选成员识别 AUC 为 0.73。", "ROC-AUC", "0.73", 57, "受控演示"),
        ],
      },
      {
        id: "city-grade",
        category: "030502",
        family: "指标",
        name: "街区拥堵等级",
        tagline: "每小时按固定阈值发布 A—D 四档拥堵等级。",
        template: "score",
        inputLabel: "既定对象与时段",
        inputValue: "街区 07 · 08:00—09:00",
        callLabel: "读取拥堵等级",
        flow: ["汇总固定时段", "应用分段规则", "发布等级"],
        outputLabel: "公开等级",
        outputValue: "C · 拥堵",
        outputDetail: "发布对象与时段已经固定，使用者不能上传新路况进行预测。",
        attacks: [
          a("grade-extract", "等级规则复制", "把等级响应作为硬标签训练替代规则。", "1024 次查询后，等级一致率达到 83.2%。", "规则一致率", "83.2%", 83, "已有实测"),
          a("segment", "分段边界恢复", "在边界附近改变单一流量特征。", "4 个等级阈值中恢复 3 个，误差小于 4%。", "阈值恢复", "75.0%", 75, "受控演示"),
          a("attribute", "隐藏分项推断", "比较同类街区等级，反推未公开事故权重。", "隐藏事件状态识别准确率达到 69%。", "属性准确率", "69.0%", 56, "受控演示"),
        ],
      },
      {
        id: "city-rag",
        category: "030701",
        family: "模型",
        name: "城市政策问答助手",
        tagline: "检索授权政策库并生成面向公众的自然语言回答。",
        template: "model",
        inputLabel: "公众问题",
        inputValue: "哪些部门与“梧桐计划”存在执行关系？",
        callLabel: "发送问题",
        flow: ["理解问题", "检索政策上下文", "生成综合回答"],
        outputLabel: "助手回答",
        outputValue: "已找到 3 条依据",
        outputDetail: "最终交付的是模型生成回答，因此归入文本生成与语言处理服务。",
        attacks: [
          a("graphrag", "子图重建", "围绕相邻实体连续提问并累积回答中的关系。", "8 轮后恢复 70.8% 的关系边。", "关系泄露率", "70.8%", 71, "已有实测"),
          a("prompt", "提示泄露", "用多轮冲突指令探测系统规则与内部字段。", "10 项受保护规则中有 4 项被部分复述。", "规则泄露", "40.0%", 40, "受控演示"),
          a("membership", "语料成员判断", "比较候选段落的回答稳定性与引用特征。", "候选政策段落的成员识别 AUC 为 0.74。", "ROC-AUC", "0.74", 59, "机制验证"),
        ],
      },
      {
        id: "city-gradient",
        category: "030901",
        family: "梯度",
        name: "受保护客流梯度",
        tagline: "多站点安全聚合、裁剪并加噪后交付批次更新。",
        template: "model",
        inputLabel: "聚合配置",
        inputValue: "12 站点 · clip 1.0 · noise 0.8",
        callLabel: "生成受保护更新",
        flow: ["站点本地计算", "安全聚合与加噪", "交付聚合梯度"],
        outputLabel: "交付结果",
        outputValue: "AGG UPDATE #72",
        outputDetail: "页面同时展示保护机制降低风险后，模型效用是否仍能维持。",
        attacks: [
          a("reconstruct", "样本重建", "在聚合梯度上优化虚拟客流序列。", "只能恢复模糊总体形状，SSIM 降至 0.21。", "重建 SSIM", "0.21", 21, "受控演示"),
          a("label", "标签泄露", "从聚合后梯度方向判断站点事件标签。", "标签识别率为 57%，接近多数类基线。", "标签准确率", "57.0%", 18, "受控演示"),
          a("property", "群体属性推断", "判断聚合批次是否包含大型活动时段。", "属性推断 AUC 为 0.59。", "ROC-AUC", "0.59", 23, "受控演示"),
        ],
      },
    ],
  },
  {
    id: "content",
    code: "DEMO 03",
    name: "智能内容服务台",
    description: "用同一组虚构媒体内容演示记录查询、人脸核验、热度排名、视觉模型与多模态助手。",
    products: [
      {
        id: "content-library",
        category: "030102",
        family: "行业基础数据库",
        name: "授权语料检索库",
        tagline: "按主题、时间与授权字段返回文章记录和内容片段。",
        template: "query",
        inputLabel: "检索条件",
        inputValue: "主题=新能源 ∧ 时间=2026-Q2",
        callLabel: "检索授权语料",
        flow: ["检查权限", "执行字段检索", "返回记录子集"],
        outputLabel: "检索结果",
        outputValue: "24 条记录",
        outputDetail: "产品直接交付记录和字段，因此不是 RAG 或生成式模型产品。",
        attacks: [
          a("reid", "记录再识别", "用公开时间、主题与作者特征链接匿名记录。", "40 条匿名记录中重新识别 25 条。", "再识别率", "62.5%", 63, "受控演示"),
          a("attribute", "敏感属性披露", "结合公开作者档案推断未展示的合同类型。", "敏感字段识别准确率达到 69%。", "属性准确率", "69.0%", 56, "受控演示"),
          a("local-recon", "局部数据重建", "利用分页、筛选与稳定记录句柄拼接被隐藏字段。", "恢复目标子集 71% 的字段单元。", "单元恢复率", "71.0%", 71, "机制验证"),
        ],
      },
      {
        id: "content-voice",
        category: "030402",
        family: "核验",
        name: "创作者人脸核验",
        tagline: "比较待审头像与注册模板，返回相似度和同一性结论。",
        template: "query",
        inputLabel: "待核验头像",
        inputValue: "portrait_2048.jpg ↔ 注册模板 F-19",
        callLabel: "运行人脸核验",
        flow: ["提取人脸表征", "计算量化相似度", "返回同一性状态"],
        outputLabel: "核验结论",
        outputValue: "0.87 · 同一人",
        outputDetail: "即使返回相似度，核心承诺仍是确认两个人脸表征是否属于同一实体。",
        attacks: [
          a("hill", "相似度爬山", "反复调整候选表征，让公开相似度持续上升。", "512 次查询后相似度从 -0.214 升至 0.905。", "最佳相似度", "0.905", 91, "已有实测"),
          a("template", "参照模板逼近", "利用辅助人脸子空间估计注册模板方向。", "隐藏模板的表征余弦相似度达到 0.78。", "模板相似度", "0.78", 78, "机制验证"),
          a("boundary", "匹配边界恢复", "提交边界附近头像，定位通过阈值。", "将实际通过阈值定位在 ±0.015 范围内。", "阈值误差", "±0.015", 73, "受控演示"),
        ],
      },
      {
        id: "content-rank",
        category: "030503",
        family: "指标",
        name: "内容热度 Top-20",
        tagline: "按当期内容集合发布名次、百分位和入榜状态。",
        template: "score",
        inputLabel: "榜单周期",
        inputValue: "短视频 · 华北区 · 2026-W32",
        callLabel: "读取热度榜",
        flow: ["冻结比较集合", "计算相对位置", "发布 Top-20"],
        outputLabel: "榜单结果",
        outputValue: "#7 · 97.4 百分位",
        outputDetail: "结果会随比较集合变化，因此属于集合参照排名而不是固定等级。",
        attacks: [
          a("topk", "入榜成员探测", "加入探针内容并观察目标是否被挤出 Top-K。", "目标是否处于候选集合的识别准确率为 84%。", "成员准确率", "84.0%", 74, "受控演示"),
          a("flip", "排序翻转", "微调探针特征，记录与目标发生名次交换的位置。", "恢复目标相对权重的 Spearman 相关为 0.71。", "秩相关", "0.71", 61, "机制验证"),
          a("cutoff", "入榜边界恢复", "在多个周期重复提交相邻分数探针。", "Top-20 入选分数误差缩小到 2.8%。", "边界误差", "2.8%", 77, "受控演示"),
        ],
      },
      {
        id: "content-vision",
        category: "030702",
        family: "模型",
        name: "视频内容理解 API",
        tagline: "接受新视频片段，返回场景、动作和风险置信度。",
        template: "model",
        inputLabel: "新视频片段",
        inputValue: "clip_0818.mp4 · 12 秒",
        callLabel: "调用视觉模型",
        flow: ["抽取视频帧", "固定模型推理", "返回标签与置信度"],
        outputLabel: "模型响应",
        outputValue: "户外运动 · 0.92",
        outputDetail: "产品对任意新输入重复提供固定模型能力，区别于既定对象的发布指标。",
        attacks: [
          a("vision-mia", "训练成员判断", "比较原片与轻微变换版本的标签稳定性。", "候选片段的成员识别 AUC 为 0.75。", "ROC-AUC", "0.75", 61, "机制验证"),
          a("inversion", "视觉原型反演", "优化输入使目标类别置信度最大。", "生成结果保留 6/9 个类别关键视觉属性。", "属性恢复", "66.7%", 67, "受控演示"),
          a("extraction", "模型能力复制", "用公开视频批量查询并训练替代模型。", "替代模型标签一致率达到 86%。", "模型一致率", "86.0%", 86, "受控演示"),
        ],
      },
      {
        id: "content-multimodal",
        category: "030705",
        family: "模型",
        name: "多模态内容助手",
        tagline: "联合理解图片、音频与文本，并生成审核说明。",
        template: "model",
        inputLabel: "多模态请求",
        inputValue: "海报.png + 旁白.wav + 审核问题",
        callLabel: "发送联合请求",
        flow: ["编码多模态输入", "跨模态对齐推理", "生成审核解释"],
        outputLabel: "助手回答",
        outputValue: "可发布 · 2 项提示",
        outputDetail: "图片、音频和文本共同决定输出，属于多模态综合模型服务。",
        attacks: [
          a("mm-injection", "多模态提示注入", "把隐藏指令嵌入图像或音频内容中。", "20 个受控探针中 12 个改变了审核回答。", "攻击成功率", "60.0%", 60, "受控演示"),
          a("cross-link", "跨模态身份关联", "组合画面与声学表征链接匿名创作者。", "50 个匿名样本中关联成功 36 个。", "再识别率", "72.0%", 72, "受控演示"),
          a("memorize", "训练样本提取", "用跨模态线索诱导模型复现训练内容片段。", "25 个记忆探针中 12 个触发近似复现。", "提取成功率", "48.0%", 48, "机制验证"),
        ],
      },
    ],
  },
  {
    id: "model-attack-evidence",
    code: "DEMO 04",
    name: "模型攻击实测实验室",
    description: "把模型类攻击包中的固定实验结果接入框架：比较图片预测模型与联邦训练更新两种交付物的正常输出、适用攻击和重建证据。",
    products: [
      {
        id: "experiment-image-prediction",
        category: "030702",
        family: "模型",
        name: "人脸身份图片预测模型",
        tagline: "输入一张新的人脸图像，固定分类模型返回身份标签；攻击者再利用模型输出或白盒信息探测训练成员并重建身份原型。",
        template: "model",
        inputLabel: "待预测图片",
        inputValue: "CelebA · identity_00015.jpg",
        callLabel: "运行图片预测",
        flow: ["标准化人脸图像", "固定分类模型推理", "返回身份标签"],
        outputLabel: "预测结果",
        outputValue: "Identity 15 · Top-1",
        outputDetail: "正常产品只返回当前图片的身份预测；下方攻击结果与图片均来自已带入的模型类攻击实验包。",
        previewImage: {
          src: "/demo-assets/model-attack/face-input-00015.jpg",
          alt: "CelebA 身份 15 的输入人脸样例",
        },
        showcase: {
          eyebrow: "MODEL INVERSION EVIDENCE",
          title: "图片预测之后，模型仍可能暴露训练成员与身份原型",
          description: "同一产品边界下保留原始指标与真实重建图；不同方法的访问权限和实验协议并不完全相同，因此不做方法排名。",
          items: [
            {
              src: "/demo-assets/model-attack/face-reconstruction-00015.jpg",
              alt: "InvAlignment 对身份 15 的重建人脸",
              label: "InvAlignment · 单身份重建",
              metric: "Identity 15",
              note: "黑盒 softmax 后验训练解码器得到的身份原型。",
            },
            {
              src: "/demo-assets/model-attack/invalignment-comparison.png",
              alt: "InvAlignment 二十组原图和重建图对比",
              label: "InvAlignment · 原图 / 重建对照",
              metric: "20 组身份",
              note: "左列为原图，右列为重建结果；可见身份级结构但细节明显模糊。",
            },
            {
              src: "/demo-assets/model-attack/revealer-contact-sheet.png",
              alt: "Revealer 五十个身份类别的重建联系表",
              label: "Revealer · 50 类总览",
              metric: "Top-5 68%",
              note: "100 个身份评估中的 50 类可视化总览；Top-1 为 28%。",
            },
          ],
        },
        attacks: [
          a("image-mia-rf", "图片训练成员推断", "读取目标 Random Forest 的白盒特征，区分一张人脸是否出现在训练集中。", "CelebA Male 目标模型准确率 77.0%；成员推断 AUC 为 0.6393。", "ROC-AUC", "0.6393", 64, "已有实测"),
          a("revealer", "身份原型重建", "利用身份分类模型结构与参数生成候选人脸，并由评估模型匹配身份。", "100 个身份上的 Top-1 命中 28%，Top-5 命中 68%；FID 为 98.95。", "Top-5 身份命中", "68%", 68, "已有实测"),
          a("plgmi", "生成式模型反演", "用身份分类模型信号约束生成器，恢复训练身份的代表性图像。", "250 个 CelebA 重建样本的 PSNR 为 12.38 dB，SSIM 为 0.189。", "重建 PSNR", "12.38 dB", 62, "已有实测"),
        ],
      },
      {
        id: "experiment-gradient-update",
        category: "030901",
        family: "梯度",
        name: "联邦图像训练更新交付",
        tagline: "客户端完成本地训练后交付梯度或多步参数增量；接收方不需要原始图片，也可能从更新信号中恢复标签和视觉内容。",
        template: "model",
        inputLabel: "本地训练批次",
        inputValue: "图像批次 · B=1 / 本地更新 E=20",
        callLabel: "生成并交付更新",
        flow: ["本地前向与反向传播", "导出梯度或参数增量", "服务器接收并聚合"],
        outputLabel: "训练交付结果",
        outputValue: "UPDATE #020 · 已接收",
        outputDetail: "Demo 同时覆盖单轮共享梯度和多步模型更新，分别对应 GradInversion、iDLG 与 SME 的固定实验结果。",
        showcase: {
          eyebrow: "GRADIENT & UPDATE EVIDENCE",
          title: "不交付原图，也可能从训练信号看到原图轮廓",
          description: "三张图分别对应单轮梯度、标签泄露适配与多步更新反演；批量大小、网络结构和防御条件会显著改变风险。",
          items: [
            {
              src: "/demo-assets/model-attack/gradinv-batch1.png",
              alt: "GradInversion ImageNet batch 1 原图与重建图",
              label: "GradInversion · ImageNet B=1",
              metric: "FeatCos 0.901",
              note: "标签集合恢复 100%，PSNR 8.99 dB；主要保留类别级结构。",
            },
            {
              src: "/demo-assets/model-attack/idlg-lfw-batch1.png",
              alt: "iDLG LFW batch 1 原图与重建图",
              label: "iDLG · LFW B=1",
              metric: "标签 100%",
              note: "适配无池化 CNN + Adam；高数值不可与原论文设置直接比较。",
            },
            {
              src: "/demo-assets/model-attack/sme-cifar100.png",
              alt: "SME CIFAR-100 多步模型更新反演对比",
              label: "SME · CIFAR-100 E=20",
              metric: "PSNR 20.56 dB",
              note: "相对多步 IG 基线 13.85 dB 提升 6.70 dB。",
            },
          ],
        },
        attacks: [
          a("gradinv", "单轮梯度图像重建", "优化虚拟图片，使其产生与客户端共享梯度一致的更新信号。", "ImageNet / ResNet-50 / B=1 下标签集合恢复 100%，特征余弦为 0.901，PSNR 为 8.99 dB。", "特征余弦", "0.901", 90, "已有实测"),
          a("idlg", "梯度标签泄露", "从最后一层梯度符号确定标签，再联合优化输入图像。", "适配实验的 MNIST、CIFAR-100 与 LFW 标签恢复率均为 100%；B=1 重建良好率为 100%。", "标签恢复率", "100%", 100, "已有实测"),
          a("sme", "多步模型更新反演", "从连续本地训练后的参数增量估计隐式梯度，再反演训练批次。", "CIFAR-100 上 SME PSNR 为 20.56 dB，高于多步 IG 基线 13.85 dB。", "PSNR 提升", "+6.70 dB", 82, "已有实测"),
        ],
      },
    ],
  },
];

const excludedAttacks: Record<string, { name: string; reason: string }> = {
  "finance-graph": { name: "敏感边逐条枚举", reason: "当前接口不返回单边存在状态，缺少逐边枚举所需反馈。" },
  "finance-verify": { name: "账户—设备绑定探测", reason: "演示产品只核验企业—账户关系，没有设备对象。" },
  "finance-aggregate": { name: "记录直接读取", reason: "产品只返回满足最小群体门槛的聚合统计，不提供记录级读取。" },
  "finance-derived": { name: "训练成员推断", reason: "产品执行确定性数据加工，不包含可被探测的模型训练集。" },
  "finance-index": { name: "置信度反演", reason: "该产品只发布既定对象的月度指标，不接受可优化的新输入。" },
  "finance-model": { name: "白盒成员推断", reason: "产品只开放黑盒 API，不提供参数、梯度或逐样本损失。" },
  "finance-gradient": { name: "恶意更新后门", reason: "演示权限为只读评估者，不能向训练流程写入更新。" },
  "city-existence": { name: "记录直接再识别", reason: "接口不返回记录、字段或稳定记录句柄。" },
  "city-verify": { name: "对象同一性模板恢复", reason: "产品确认资格属性，不输出相似度或生物模板反馈。" },
  "city-grade": { name: "集合成员变化探测", reason: "等级使用固定阈值，不依赖当期比较集合。" },
  "city-rag": { name: "工具劫持", reason: "该助手没有外部工具调用权限，只读取离线政策库。" },
  "city-gradient": { name: "单样本梯度精确反演", reason: "只交付 12 站点安全聚合并加噪后的批次更新。" },
  "content-library": { name: "聚合差分重建", reason: "产品返回记录子集，不提供可定制的聚合统计。" },
  "content-voice": { name: "跨来源记录同一性关联", reason: "演示只开放单一注册域，没有第二个外部身份库。" },
  "content-rank": { name: "固定阈值规则提取", reason: "Top-20 取决于当期集合，不使用稳定绝对阈值。" },
  "content-vision": { name: "白盒模型反演", reason: "API 不交付模型参数，只返回标签和置信度。" },
  "content-multimodal": { name: "工具劫持", reason: "产品没有执行工具或外部写操作的能力。" },
  "experiment-image-prediction": { name: "模型能力复制", reason: "当前实验包没有统一查询预算下的替代模型训练协议，因此本 Demo 不执行模型抽取。" },
  "experiment-gradient-update": { name: "恶意更新后门", reason: "当前角色只接收并评估既有更新，不能向训练流程写入恶意参数。" },
};

/**
 * 候选清单是覆盖率的唯一数据源：每项都具有适用性、执行状态与判定理由。
 * 已执行项来自各产品的显式攻击协议；未执行项必须给出产品边界或权限原因。
 */
export const candidateAttacks: Record<string, AttackCandidate[]> = Object.fromEntries(
  demoSuites.flatMap((suite) => suite.products.map((product) => {
    const excluded = excludedAttacks[product.id];
    return [
      product.id,
      [
        ...product.attacks.map((attack) => ({
          id: attack.id,
          name: attack.name,
          applicable: true,
          executed: true,
          reason: `适用：${attack.brief}`,
        })),
        {
          id: `${product.id}-excluded`,
          name: excluded.name,
          applicable: false,
          executed: false,
          reason: `排除：${excluded.reason}`,
        },
      ],
    ];
  })),
);
