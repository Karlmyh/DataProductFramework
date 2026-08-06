export type AttackLink = {
  label: string;
  href: string;
  note: string;
};

export type Category = {
  code: string;
  name: string;
  definition: string;
  exposure: string;
  boundary: string;
  children: string[];
  attacks: string[];
  links: AttackLink[];
};

export type ProductGroup = {
  code: string;
  name: string;
  summary: string;
  categories: Category[];
};

const base = "https://karlmyh.github.io/DataProductFramework";

export const groups: ProductGroup[] = [
  {
    code: "01",
    name: "核验类数据产品",
    summary: "围绕一个可判定命题返回通过、不通过、匹配或无法核验等有限状态。",
    categories: [
      {
        code: "0101",
        name: "单体断言核验",
        definition: "判断一个对象是否具有某项属性、满足某个条件或处于某种状态。",
        exposure: "有限状态仍会泄露对象属性、名单命中与规则阈值；重复查询会把核验接口变成可枚举的判断预言机。",
        boundary: "只确认一个对象的一项属性或状态；若比较两个表征是否属于同一实体，归入 0102。",
        children: [
          "010101 权威记录核验",
          "010102 文档与数字凭证核验",
          "010103 测试、测量与检验核验",
          "010104 第三方声明与见证核验",
          "010105 规则或模型推定核验",
        ],
        attacks: ["敏感属性枚举", "名单与状态探测", "规则阈值推断", "硬标签成员推断"],
        links: [
          { label: "硬标签属性推断", href: `${base}/product_attack_docs/verification/hard-label-attribute-inference.html`, note: "利用候选属性与核验反馈识别隐藏属性。" },
          { label: "核验成员推断", href: `${base}/product_attack_docs/verification/verification-membership-inference.html`, note: "利用稳定性、边界距离和错误模式判断成员关系。" },
          { label: "决策边界推断", href: `${base}/product_attack_docs/verification/decision-boundary-inference.html`, note: "通过自适应试探逼近阈值、规则条件或模型边界。" },
        ],
      },
      {
        code: "0102",
        name: "对象同一性核验",
        definition: "比较同一类实体的两个或多个表征，判断它们是否指向同一实体或同一内容。",
        exposure: "相似度、匹配状态和失败模式可被用于身份绑定、跨库关联、模板方向恢复和核验绕过。",
        boundary: "判断的是同一性关系；两个具有独立业务角色的对象之间的任职、授权等关系归入 0103。",
        children: [
          "010201 生物特征或物理表征比对",
          "010202 密码学身份绑定",
          "010203 跨来源记录同一性关联",
        ],
        attacks: ["相似度黑盒爬山", "参照模板恢复", "实体链接与再识别", "匹配边界推断"],
        links: [
          { label: "CASIA-FaceV5 核验爬山", href: `${base}/first_batch_attack_demo/#identity`, note: "用量化相似度和辅助人脸子空间逼近注册模板。" },
          { label: "决策边界推断", href: `${base}/product_attack_docs/verification/decision-boundary-inference.html`, note: "恢复同一性核验接口的阈值与局部边界。" },
          { label: "属性推断系列", href: `${base}/attribute_inference_demo/`, note: "观察核验反馈如何暴露目标的隐藏属性。" },
        ],
      },
      {
        code: "0103",
        name: "多体关系核验",
        definition: "判断两个或多个独立业务对象之间是否存在所有、任职、授权、控制、交易或绑定等关系。",
        exposure: "单次关系判断可被组合为组织、交易、设备或社会网络，并进一步揭示未公开的控制与关联结构。",
        boundary: "对象具有独立业务角色且确认的是非同一性关系；返回开放关系对象或路径时归入 0303。",
        children: [
          "010301 权威登记关系核验",
          "010302 合同、证照与授权关系核验",
          "010303 账户、设备、交易与行为关系核验",
          "010304 多源关联与关系推定核验",
        ],
        attacks: ["关系枚举", "账户与设备绑定探测", "控制关系图重建", "多源关联推断"],
        links: [
          { label: "核验类攻击目录", href: `${base}/product_attack_docs/verification/`, note: "从有限核验反馈出发组织属性、成员与边界攻击。" },
          { label: "查询组合风险", href: `${base}/product_attack_docs/knowledge/query-composition-risk.html`, note: "说明多次安全响应如何组合出敏感关系。" },
          { label: "攻击方法库", href: `${base}/method_library/`, note: "检索实体链接、关系重建与推断规则。" },
        ],
      },
    ],
  },
  {
    code: "02",
    name: "指标型数据产品",
    summary: "以稳定口径交付数值、标准参照等级或集合参照相对位置。",
    categories: [
      {
        code: "0201",
        name: "数值型指标",
        definition: "直接交付具有独立量纲或稳定数值含义的结果。",
        exposure: "连续数值提供强排序和优化信号，可能暴露个体贡献、分项权重、训练成员及隐藏输入。",
        boundary: "指标面向既定对象、时期和口径预先形成；若向任意新输入反复提供预测函数，归入模型类。",
        children: [
          "020101 总量与计数",
          "020102 比率、比例与份额",
          "020103 均值与分布统计量",
          "020104 变化率与单一定基测度",
          "020105 线性加权合成",
          "020106 几何或乘法合成",
          "020107 非补偿性与多准则数值合成",
          "020108 其他非线性数值合成",
        ],
        attacks: ["评分属性推断", "评分成员推断", "置信度模型反演", "训练属性推断"],
        links: [
          { label: "评分属性推断", href: `${base}/product_attack_docs/indicator/score-attribute-inference.html`, note: "比较候选属性对应的数值响应。" },
          { label: "评分成员推断", href: `${base}/product_attack_docs/indicator/score-membership-inference.html`, note: "以置信度、损失、间隔或熵构造成员分数。" },
          { label: "置信度模型反演", href: `${base}/product_attack_docs/indicator/confidence-model-inversion.html`, note: "利用连续输出优化并恢复隐藏输入。" },
        ],
      },
      {
        code: "0202",
        name: "标准参照等级与分段",
        definition: "依据预先确定的标准、目标、阈值、规则或模型边界交付有限有序类别。",
        exposure: "离散等级压缩精确值，但仍可通过阈值试探、主动学习和替代模型复制恢复分段边界。",
        boundary: "保持对象不变而增删其他参评对象，结果不变；若结果随比较集合变化，归入 0203。",
        children: [
          "020201 绝对数值阈值分级",
          "020202 固定参照偏离分级",
          "020203 多条件规则分级",
          "020204 学习型固定边界分级",
        ],
        attacks: ["阈值试探", "等级规则提取", "替代模型训练", "分段边界泄露"],
        links: [
          { label: "Adult 等级规则提取", href: `${base}/first_batch_attack_demo/#grade`, note: "仅凭 A—D 等级训练替代模型并复制边界。" },
          { label: "排序与分段泄露", href: `${base}/product_attack_docs/indicator/rank-segment-leakage.html`, note: "从等级与分段响应中恢复阈值和相对敏感性。" },
          { label: "模型抽取", href: `${base}/product_attack_docs/model/model-extraction.html`, note: "用批量查询输出训练替代模型。" },
        ],
      },
      {
        code: "0203",
        name: "集合参照排名与相对位置",
        definition: "依据当期比较集合或参照分布交付名次、百分位、分位层级或其他相对位置。",
        exposure: "排名和 Top-K 会泄露对象间次序、群体分布、入选边界及参照集合成员变化。",
        boundary: "结果依赖比较集合；若只按固定标准或阈值分级，归入 0202。",
        children: [
          "020301 名次、顺序与 Top-K",
          "020302 百分位、分位位置与分位分层",
          "020303 成对关系与偏序位置",
          "020304 支配关系与效率前沿位置",
        ],
        attacks: ["Top-K 成员探测", "排序翻转分析", "分位边界恢复", "参照集合推断"],
        links: [
          { label: "排序与分段泄露", href: `${base}/product_attack_docs/indicator/rank-segment-leakage.html`, note: "从名次、Top-K、等级和分段推断边界。" },
          { label: "指标类攻击目录", href: `${base}/product_attack_docs/indicator/`, note: "查看连续评分与相对位置的攻击入口。" },
          { label: "指标统一尺度", href: `${base}/product_attack_docs/metrics-normalization.html`, note: "把不同攻击结果归一到可比较的风险尺度。" },
        ],
      },
    ],
  },
  {
    code: "03",
    name: "数据查询类数据产品",
    summary: "让使用者在受控查询空间内取得存在性、记录、关系、聚合或派生结果。",
    categories: [
      {
        code: "0301",
        name: "存在性查询",
        definition: "保留至少一个开放变量，但只返回是否存在匹配对象，不枚举对象及其取值。",
        exposure: "真假响应可成为群组测试预言机；灵活条件和自适应查询会逐步定位私有库成员。",
        boundary: "最终只返回是否存在；即使攻击恢复出具体成员，产品仍属于存在性查询。",
        children: [
          "030101 标识符与资源存在性",
          "030102 关键词与内容命中存在性",
          "030103 条件记录存在性",
          "030104 开放关系存在性",
        ],
        attacks: ["自适应群组测试", "成员枚举", "二分条件探测", "查询组合攻击"],
        links: [
          { label: "Adult 存在性群组测试", href: `${base}/first_batch_attack_demo/#existence`, note: "用真假响应和组合条件逐步恢复私有库成员。" },
          { label: "查询组合风险", href: `${base}/product_attack_docs/knowledge/query-composition-risk.html`, note: "刻画重复、自适应查询带来的累计泄露。" },
          { label: "核验成员推断", href: `${base}/product_attack_docs/verification/verification-membership-inference.html`, note: "对比有限状态接口中的成员信号。" },
        ],
      },
      {
        code: "0302",
        name: "记录与子集查询",
        definition: "返回匹配对象及字段值，允许通过关键词、字段、谓词、时空范围或分页选择数据子集。",
        exposure: "记录级结果会直接产生再识别、跨库链接、敏感属性披露和局部数据集重建风险。",
        boundary: "主要返回数据单元本身；若最终只交付统计摘要，归入 0304。",
        children: [
          "030201 资源与文档结果",
          "030202 表格与业务记录结果",
          "030203 字段与属性切片",
          "030204 时空窗口与批次数据",
        ],
        attacks: ["记录再识别", "跨库链接", "敏感属性披露", "局部数据重建"],
        links: [
          { label: "背景知识属性披露", href: `${base}/product_attack_docs/knowledge/background-attribute-disclosure.html`, note: "结合准标识符和辅助数据推断敏感属性。" },
          { label: "数据集重建系列", href: `${base}/dataset_reconstruction_demo/`, note: "观察查询预算与记录恢复效果的关系。" },
          { label: "数据库类攻击目录", href: `${base}/product_attack_docs/knowledge/`, note: "汇总记录、聚合与组合查询风险。" },
        ],
      },
      {
        code: "0303",
        name: "关系发现与路径查询",
        definition: "给定锚定实体或关系条件，返回未知关联对象、关系边、邻域、连接结果或路径。",
        exposure: "开放关系查询可恢复敏感边、隐含群体、组织控制路径和跨来源主体对应关系。",
        boundary: "返回的是未预先指定的关联对象或路径；只确认两个已给定对象的关系时归入 0103。",
        children: [
          "030301 邻接对象集合",
          "030302 关系元组与连接表",
          "030303 路径与子图",
          "030304 跨来源对应关系",
        ],
        attacks: ["敏感边枚举", "邻域与子图重建", "路径隐私泄露", "跨源实体关联"],
        links: [
          { label: "查询组合风险", href: `${base}/product_attack_docs/knowledge/query-composition-risk.html`, note: "从多次关系响应拼接敏感图结构。" },
          { label: "背景知识属性披露", href: `${base}/product_attack_docs/knowledge/background-attribute-disclosure.html`, note: "使用公开关系和准标识符推断隐藏属性。" },
          { label: "攻击方法库", href: `${base}/method_library/`, note: "检索图模型、链接重建与实体泄露规则。" },
        ],
      },
      {
        code: "0304",
        name: "聚合统计查询",
        definition: "对匹配子集计算计数、比例、分组汇总、分布或其他统计摘要，而不返回匹配记录本身。",
        exposure: "相邻查询的差、重叠区间和大量线性聚合可消去群体贡献，最终恢复个体或记录级信息。",
        boundary: "最终响应为统计摘要；如果使用者直接获得记录或字段值，归入 0302。",
        children: [
          "030401 标量聚合",
          "030402 分组与交叉表",
          "030403 多维聚合",
          "030404 分布与分位摘要",
        ],
        attacks: ["相邻查询差分", "平均与线性系统重建", "区间查询重建", "预算组合攻击"],
        links: [
          { label: "差分重建", href: `${base}/product_attack_docs/knowledge/aggregate-query-differencing.html`, note: "让相邻聚合结果相减以暴露个体贡献。" },
          { label: "平均与线性系统重建", href: `${base}/product_attack_docs/knowledge/averaging-linear-reconstruction.html`, note: "用大量聚合响应组成方程组恢复记录。" },
          { label: "区间查询重建", href: `${base}/product_attack_docs/knowledge/range-query-reconstruction.html`, note: "利用范围、访问模式或响应量恢复隐藏字段。" },
        ],
      },
      {
        code: "0305",
        name: "派生与处理查询",
        definition: "选择底层数据并指定转换或计算操作，取得具有新结构、新属性或新表示的派生数据。",
        exposure: "转换后的表示、特征和残差仍可能保留原数据结构，并通过反演、链接或重复处理恢复敏感信息。",
        boundary: "服务方底层数据是被处理对象；若数据只作为模型综合回答的上下文，归入 0403。",
        children: [
          "030501 表示与坐标转换",
          "030502 质量修正与标准化",
          "030503 语义与特征派生",
          "030504 分辨率与尺度变换",
        ],
        attacks: ["变换反演", "特征残留分析", "分辨率恢复", "重复处理组合"],
        links: [
          { label: "区间查询重建", href: `${base}/product_attack_docs/knowledge/range-query-reconstruction.html`, note: "展示处理与访问模式如何暴露隐藏结构。" },
          { label: "查询组合风险", href: `${base}/product_attack_docs/knowledge/query-composition-risk.html`, note: "评估不同处理请求叠加后的累计泄露。" },
          { label: "攻击方法库", href: `${base}/method_library/`, note: "检索嵌入反演、解释泄露和表示重建方法。" },
        ],
      },
    ],
  },
  {
    code: "04",
    name: "模型类数据产品",
    summary: "特定生产数据在训练、参数、推理上下文或反馈更新环节形成可交付价值。",
    categories: [
      {
        code: "0401",
        name: "训练时数据贡献型",
        definition: "提供方以生产数据完成训练、微调、对齐或适配，并交付相应训练产物。",
        exposure: "梯度、更新和适配参数会泄露原始记录、标签与训练集属性；恶意参与方还可注入后门。",
        boundary: "购买方取得一次明确训练过程的产物；现成模型能力的重复使用归入 0402。",
        children: [
          "040101 完整训练结果",
          "040102 模型部件与适配参数",
          "040103 单方梯度与模型更新",
          "040104 聚合或受保护更新",
        ],
        attacks: ["梯度与更新反演", "标签泄露", "训练属性推断", "恶意更新与后门"],
        links: [
          { label: "白盒成员推断", href: `${base}/product_attack_docs/model/white-box-membership-inference.html`, note: "利用参数、损失、间隔和梯度近似信号。" },
          { label: "训练属性推断", href: `${base}/product_attack_docs/model/property-inference.html`, note: "判断训练数据的群体性质与敏感分布。" },
          { label: "攻击方法库", href: `${base}/method_library/`, note: "检索联邦训练、梯度重建与后门攻击规则。" },
        ],
      },
      {
        code: "0402",
        name: "参数内化使用型",
        definition: "生产数据已内化为参数、表示或决策边界，使用者取得现成且可重复使用的模型能力。",
        exposure: "从参数、后验分数、标签或本地执行环境可实施成员推断、模型抽取、反演和对抗样本攻击。",
        boundary: "生产数据不随每次请求重新读取；运行时按请求检索外部数据并综合回答时归入 0403。",
        children: [
          "040201 完整参数访问",
          "040202 部分参数或模型部件访问",
          "040203 本地封装执行",
          "040204 远程黑盒调用",
        ],
        attacks: ["仅标签与评分成员推断", "模型抽取", "模型反演", "对抗样本"],
        links: [
          { label: "模型类攻击目录", href: `${base}/product_attack_docs/model/`, note: "按黑盒、评分与白盒访问方式组织攻击。" },
          { label: "模型抽取", href: `${base}/product_attack_docs/model/model-extraction.html`, note: "用公共输入和目标输出复制预测函数。" },
          { label: "模型反演", href: `${base}/product_attack_docs/model/model-inversion.html`, note: "利用输出或梯度恢复原型与隐藏属性。" },
        ],
      },
      {
        code: "0403",
        name: "推理时上下文供给型",
        definition: "生产数据与基础模型逻辑分离，在运行时作为证据、工具结果或会话上下文参与生成。",
        exposure: "私有语料可被越权检索、提示注入或逐字外泄；向量、访问模式和工具结果也会暴露成员与属性。",
        boundary: "修改底层上下文可直接改变后续回答而无需重训；若产品直接返回检索记录而非综合回答，归入 03。",
        children: [
          "040301 非结构化语料与索引",
          "040302 结构化数据库与知识图谱",
          "040303 实时外部服务与工具",
          "040304 用户与会话临时上下文",
        ],
        attacks: ["RAG 私有语料外泄", "间接提示注入", "检索向量成员推断", "工具劫持"],
        links: [
          { label: "攻击方法库", href: `${base}/method_library/`, note: "检索 RAG、智能体、提示注入和上下文外泄规则。" },
          { label: "模型类攻击目录", href: `${base}/product_attack_docs/model/`, note: "参照模型输出侧的统一攻击与评估口径。" },
          { label: "查询组合风险", href: `${base}/product_attack_docs/knowledge/query-composition-risk.html`, note: "理解多轮检索和生成中的累计泄露。" },
        ],
      },
      {
        code: "0404",
        name: "部署后反馈更新型",
        definition: "部署后输入、输出、评价或环境结果持续回流，用于改变参数、记忆、画像或后续版本。",
        exposure: "反馈链路会泄露用户行为与纠错样本，也可能被利用进行数据投毒、偏好操纵、记忆污染和后门植入。",
        boundary: "关键价值来自部署后的持续更新；一次性训练或微调服务归入 0401。",
        children: [
          "040401 隐式交互行为",
          "040402 显式人工评价",
          "040403 业务或环境结果",
          "040404 纠错与标注样本",
        ],
        attacks: ["反馈数据投毒", "持续学习后门", "用户画像泄露", "记忆与纠错样本提取"],
        links: [
          { label: "对抗样本与稳定性", href: `${base}/product_attack_docs/model/adversarial-examples.html`, note: "连接运行时操纵与部署后反馈风险。" },
          { label: "训练属性推断", href: `${base}/product_attack_docs/model/property-inference.html`, note: "由模型变化反推反馈数据的群体性质。" },
          { label: "攻击方法库", href: `${base}/method_library/`, note: "检索投毒、后门、记忆与持续学习攻击规则。" },
        ],
      },
    ],
  },
];

export const categories = groups.flatMap((group) =>
  group.categories.map((category) => ({ ...category, group }))
);

export const series = [
  {
    index: "A",
    title: "第一批补充攻击评估",
    scope: "0102 对象同一性核验 · 0202 标准参照等级 · 0301 存在性查询",
    attacks: "相似度黑盒爬山、等级规则提取、自适应群组测试",
    href: `${base}/first_batch_attack_demo/`,
  },
  {
    index: "B",
    title: "成员推断评估系列",
    scope: "CASIA-FaceV5 · CelebA · 黑盒与边界信号",
    attacks: "采样攻击、标签稳定性、边界攻击、迁移攻击",
    href: `${base}/membership_inference_demo/`,
  },
  {
    index: "C",
    title: "属性推断评估系列",
    scope: "Adult 指标与核验产品 · 辅助数据设定",
    attacks: "硬标签属性推断、分数属性推断、辅助信息敏感性",
    href: `${base}/attribute_inference_demo/`,
  },
  {
    index: "D",
    title: "数据集重建评估系列",
    scope: "Adult 聚合与查询产品 · 查询预算矩阵",
    attacks: "差分重建、平均与线性系统重建、记录恢复",
    href: `${base}/dataset_reconstruction_demo/`,
  },
  {
    index: "E",
    title: "产品攻击文档",
    scope: "核验 · 指标 · 数据查询 · 模型",
    attacks: "攻击原理、威胁模型、评估指标与统一风险尺度",
    href: `${base}/product_attack_docs/`,
  },
  {
    index: "F",
    title: "攻击方法库",
    scope: "隐私 · 稳定性 · 策略与智能体安全",
    attacks: "规则化方法页、适用边界、论文依据与实施路径",
    href: `${base}/method_library/`,
  },
];

export function findCategory(code: string) {
  return categories.find((category) => category.code === code);
}
