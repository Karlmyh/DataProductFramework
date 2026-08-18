export type AttackLink = { label: string; href: string; note: string };

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
  shortName: string;
  summary: string;
  accent: string;
  categories: Category[];
};

const base = "https://karlmyh.github.io/DataProductFramework";

const docs = (label: string, path: string, note: string): AttackLink => ({
  label,
  href: `${base}/${path}`,
  note,
});

export const groups: ProductGroup[] = [
  {
    code: "0301",
    name: "行业基础数据库类数据产品",
    shortName: "行业基础数据库",
    summary: "面向特定行业开放受控查询与处理能力，风险取决于可见字段、查询组合和累计预算。",
    accent: "#0d684f",
    categories: [
      {
        code: "030101",
        name: "存在性查询",
        definition: "提交开放条件，只返回是否存在匹配对象，不枚举对象及其取值。",
        exposure: "真假响应可成为群组测试预言机；重复组合条件会逐步定位私有库成员。",
        boundary: "最终只返回是否存在；返回具体记录时归入 030102。",
        children: ["标识符与资源存在性", "关键词与内容命中存在性", "条件记录存在性", "开放关系存在性"],
        attacks: ["自适应群组测试", "成员枚举", "二分条件探测", "查询组合攻击"],
        links: [
          docs("Adult 存在性群组测试", "first_batch_attack_demo/#existence", "512 次受控查询恢复 32/32 个隐藏成员。"),
          docs("查询组合风险", "product_attack_docs/knowledge/query-composition-risk.html", "说明多次安全响应如何累积为隐私泄露。"),
        ],
      },
      {
        code: "030102",
        name: "记录与子集查询",
        definition: "按关键词、字段、谓词、时空范围或分页返回匹配记录与字段。",
        exposure: "记录级结果会直接产生再识别、跨库链接、敏感属性披露与局部数据重建风险。",
        boundary: "主要交付数据单元本身；仅交付统计摘要时归入 030104。",
        children: ["资源与文档结果", "表格与业务记录结果", "字段与属性切片", "时空窗口与批次数据"],
        attacks: ["记录再识别", "跨库链接", "背景知识属性披露", "局部数据重建"],
        links: [
          docs("背景知识属性披露", "product_attack_docs/knowledge/background-attribute-disclosure.html", "组合准标识符与辅助数据推断敏感字段。"),
          docs("数据集重建系列", "dataset_reconstruction_demo/", "观察查询预算与记录恢复效果。"),
        ],
      },
      {
        code: "030103",
        name: "关系发现与路径查询",
        definition: "给定锚点或关系条件，返回未知关联对象、关系边、邻域或路径。",
        exposure: "开放关系查询可恢复敏感边、组织控制路径、隐含群体与跨来源主体映射。",
        boundary: "返回未预先指定的对象或路径；确认两个已给定对象关系时归入 030403。",
        children: ["邻接对象集合", "关系元组与连接表", "路径与子图", "跨来源对应关系"],
        attacks: ["敏感边枚举", "本体蕴含推断", "邻域与子图重建", "跨源实体关联"],
        links: [
          docs("知识图谱与本体隐私评测", "kg_ontology_privacy_demo/", "受控测量敏感蕴含、成员与子图重建风险。"),
          docs("查询组合风险", "product_attack_docs/knowledge/query-composition-risk.html", "从多次关系响应拼接隐藏结构。"),
        ],
      },
      {
        code: "030104",
        name: "聚合统计查询",
        definition: "对匹配子集计算计数、比例、分组汇总、分布或其他统计摘要。",
        exposure: "相邻查询差、重叠区间和大量线性聚合可消去群体贡献并恢复个体信息。",
        boundary: "响应为统计摘要；若直接返回记录或字段值，归入 030102。",
        children: ["标量聚合", "分组与交叉表", "多维聚合", "分布与分位摘要"],
        attacks: ["相邻查询差分", "平均与线性系统重建", "区间查询重建", "预算组合攻击"],
        links: [
          docs("差分重建", "product_attack_docs/knowledge/aggregate-query-differencing.html", "让相邻聚合相减，暴露个体贡献。"),
          docs("平均与线性重建", "product_attack_docs/knowledge/averaging-linear-reconstruction.html", "用聚合响应组成方程组恢复记录。"),
        ],
      },
      {
        code: "030105",
        name: "派生与处理查询",
        definition: "选择底层数据并指定转换或计算，取得具有新结构、属性或表示的派生结果。",
        exposure: "转换后的表示、特征和残差仍会保留原数据结构，并可被反演或链接。",
        boundary: "服务方底层数据是处理对象；若最终交付模型生成回答，归入 0307。",
        children: ["表示与坐标转换", "质量修正与标准化", "语义与特征派生", "分辨率与尺度变换"],
        attacks: ["变换反演", "特征残留分析", "分辨率恢复", "重复处理组合"],
        links: [
          docs("查询组合风险", "product_attack_docs/knowledge/query-composition-risk.html", "评估多次处理请求叠加后的累计泄露。"),
          docs("攻击方法库", "method_library/", "检索嵌入反演、表示重建与链接方法。"),
        ],
      },
    ],
  },
  {
    code: "0304",
    name: "核验类数据产品",
    shortName: "核验",
    summary: "对完整给定命题返回有限状态；重复核验仍可能暴露属性、身份绑定与关系网络。",
    accent: "#4b50a1",
    categories: [
      {
        code: "030401",
        name: "单体断言核验",
        definition: "判断一个对象是否具有某项属性、满足某个条件或处于某种状态。",
        exposure: "有限状态仍会泄露对象属性、名单命中与规则阈值。",
        boundary: "只确认一个对象的一项属性或状态；同一实体比对归入 030402。",
        children: ["权威记录核验", "文档与数字凭证核验", "测试、测量与检验核验", "第三方声明与见证核验", "规则或模型推定核验"],
        attacks: ["敏感属性枚举", "名单与状态探测", "规则阈值推断", "硬标签成员推断"],
        links: [docs("核验类攻击目录", "product_attack_docs/verification/", "从有限反馈组织属性、成员与边界攻击。")],
      },
      {
        code: "030402",
        name: "对象同一性核验",
        definition: "比较同类实体的两个或多个表征，判断它们是否指向同一实体或内容。",
        exposure: "相似度与失败模式可被用于身份绑定、跨库关联、模板恢复和核验绕过。",
        boundary: "判断同一性关系；独立业务对象间的关系确认归入 030403。",
        children: ["生物特征或物理表征比对", "密码学身份绑定", "跨来源记录同一性关联"],
        attacks: ["相似度黑盒爬山", "参照模板恢复", "实体链接与再识别", "匹配边界推断"],
        links: [docs("CASIA-FaceV5 核验爬山", "first_batch_attack_demo/#identity", "512 次查询将相似度从 -0.214 提升到 0.905。")],
      },
      {
        code: "030403",
        name: "多体关系核验",
        definition: "判断多个独立业务对象之间是否存在所有、任职、授权、控制、交易或绑定关系。",
        exposure: "单次关系判断可被组合成组织、交易、设备或社会网络。",
        boundary: "对象具有独立业务角色；返回开放关系对象或路径时归入 030103。",
        children: ["权威登记关系核验", "合同、证照与授权关系核验", "账户、设备、交易与行为关系核验", "多源关联与关系推定核验"],
        attacks: ["关系枚举", "账户与设备绑定探测", "控制关系图重建", "多源关联推断"],
        links: [docs("查询组合风险", "product_attack_docs/knowledge/query-composition-risk.html", "多次核验结果可能拼出敏感关系网络。")],
      },
    ],
  },
  {
    code: "0305",
    name: "指标型数据产品",
    shortName: "指标",
    summary: "发布针对既定对象、时期和口径计算完成的数值、等级或相对位置。",
    accent: "#b64d2f",
    categories: [
      {
        code: "030501",
        name: "数值型指标",
        definition: "直接交付具有独立量纲或稳定数值含义的结果。",
        exposure: "连续数值提供强排序与优化信号，可能暴露个体贡献、权重、成员与隐藏输入。",
        boundary: "指标针对既定对象和口径预先形成；任意新输入的预测函数归入 0307。",
        children: ["总量与计数", "比率、比例与份额", "均值与分布统计量", "变化率与单一定基测度", "线性加权合成", "几何或乘法合成", "非补偿性与多准则数值合成", "其他非线性数值合成"],
        attacks: ["评分属性推断", "评分成员推断", "置信度反演", "分项权重恢复"],
        links: [docs("指标类攻击目录", "product_attack_docs/indicator/", "连续评分与相对位置的统一攻击入口。")],
      },
      {
        code: "030502",
        name: "标准参照等级与分段",
        definition: "依据固定标准、目标、阈值、规则或模型边界交付有限有序类别。",
        exposure: "离散等级可通过阈值试探、主动学习和替代模型复制恢复分段边界。",
        boundary: "对象不变时不受其他参评对象影响；依赖比较集合的结果归入 030503。",
        children: ["绝对数值阈值分级", "固定参照偏离分级", "多条件规则分级", "学习型固定边界分级"],
        attacks: ["阈值试探", "等级规则提取", "替代模型训练", "分段边界泄露"],
        links: [docs("Adult 等级规则提取", "first_batch_attack_demo/#grade", "1024 次标签查询复制等级规则，一致率 83.2%。")],
      },
      {
        code: "030503",
        name: "集合参照排名与相对位置",
        definition: "依据当期集合或参照分布交付名次、百分位、分位层级或其他相对位置。",
        exposure: "排名与前 K 名结果会泄露次序、群体分布、入选边界及集合成员变化。",
        boundary: "结果依赖比较集合；固定标准或阈值分级归入 030502。",
        children: ["名次、顺序与 Top-K", "百分位、分位位置与分位分层", "成对关系与偏序位置", "支配关系与效率前沿位置"],
        attacks: ["Top-K 成员探测", "排序翻转分析", "分位边界恢复", "参照集合推断"],
        links: [docs("排序与分段泄露", "product_attack_docs/indicator/rank-segment-leakage.html", "从排名与分段响应恢复入选边界。")],
      },
    ],
  },
  {
    code: "0307",
    name: "模型类数据产品",
    shortName: "模型",
    summary: "交付当前版本内固定的模型文件、组件或调用能力，按最终任务与输出组织。",
    accent: "#2a5a89",
    categories: [
      {
        code: "030701",
        name: "文本生成与语言处理服务",
        definition: "交付文本理解、翻译转换、生成摘要、问答或对话能力。",
        exposure: "输出可能泄露训练成员、记忆语料、系统提示、检索上下文与模型能力。",
        boundary: "最终交付模型生成结果；仅返回检索记录的产品归入 0301。",
        children: ["文本理解与分类", "机器翻译与转换", "文本生成与摘要", "问答与对话"],
        attacks: ["训练数据提取", "成员推断", "提示与上下文泄露", "模型抽取"],
        links: [docs("RAG 隐私演示", "rag_privacy_demo/", "多轮问答中的语料外泄与成员风险。")],
      },
      {
        code: "030702",
        name: "图像视频理解与生成服务",
        definition: "交付分类识别、检测分割、场景动作理解或图像视频生成修复能力。",
        exposure: "标签、置信度与生成结果可暴露训练成员、人物原型和模型边界。",
        boundary: "产品承诺是固定模型能力；只做人脸同一性事实确认时归入 030402。",
        children: ["图像分类与识别", "目标检测与分割", "场景与动作理解", "图像视频生成与修复"],
        attacks: ["图像成员推断", "模型反演", "训练样本提取", "模型抽取"],
        links: [docs("成员推断评估", "membership_inference_demo/", "图像模型的标签稳定性与边界成员信号。")],
      },
      {
        code: "030703",
        name: "语音识别与合成服务",
        definition: "交付语音转文字、说话人识别、语音合成或音频事件情绪分析能力。",
        exposure: "声学表征与置信度可暴露说话人是否参与训练、身份特征与语音原型。",
        boundary: "固定模型提供语音任务能力；只核验两个声纹是否同一人时归入 030402。",
        children: ["语音转文字", "说话人与声纹识别", "语音合成", "音频事件与情绪分析"],
        attacks: ["说话人成员推断", "声纹属性推断", "语音模型反演", "黑盒模型抽取"],
        links: [docs("模型类攻击目录", "product_attack_docs/model/", "成员、属性、反演与抽取的统一方法。")],
      },
      {
        code: "030704",
        name: "预测、分类与推荐服务",
        definition: "交付分类、风险判断、数值时序预测、排序推荐或决策控制能力。",
        exposure: "标签、评分、排序与解释会暴露成员、敏感属性、决策边界与模型能力。",
        boundary: "允许任意新输入反复调用；针对既定对象预先发布的结果归入 0305。",
        children: ["分类与风险判断", "数值与时序预测", "排序与推荐", "决策与控制"],
        attacks: ["评分成员推断", "属性推断", "决策边界反演", "模型抽取"],
        links: [docs("模型类攻击目录", "product_attack_docs/model/", "按黑盒、评分与白盒访问方式组织攻击。")],
      },
      {
        code: "030705",
        name: "多模态综合模型服务",
        definition: "交付图文、音视频联合理解，多模态生成或多模态决策交互能力。",
        exposure: "跨模态对齐与生成会放大身份关联、成员泄露、提示注入与训练样本再现风险。",
        boundary: "单一模态任务分别归入 030701—030703；联合输入输出归入本类。",
        children: ["图文联合理解", "音视频联合理解", "多模态内容生成", "多模态决策与交互"],
        attacks: ["跨模态成员推断", "多模态提示注入", "身份再识别", "训练样本提取"],
        links: [docs("攻击方法库", "method_library/", "检索多模态、提示注入与训练数据泄露方法。")],
      },
      {
        code: "030706",
        name: "模型蒸馏服务",
        definition: "交付响应蒸馏、表示蒸馏、任务学生模型或压缩端侧模型。",
        exposure: "软标签与学生模型会复制教师边界，并可能继承教师对训练成员和敏感样本的记忆。",
        boundary: "核心交付承诺是把教师能力迁移为学生模型，而非一般预测调用。",
        children: ["响应蒸馏", "特征与表示蒸馏", "任务专用学生模型", "压缩与端侧部署蒸馏"],
        attacks: ["教师模型抽取", "蒸馏成员推断", "软标签反演", "能力复制率测量"],
        links: [docs("模型抽取", "product_attack_docs/model/model-extraction.html", "利用批量响应训练高保真替代模型。")],
      },
    ],
  },
  {
    code: "0309",
    name: "其他数据产品",
    shortName: "梯度",
    summary: "当前仅覆盖可独立交付的梯度、参数增量以及聚合或受保护梯度结果。",
    accent: "#7a4c16",
    categories: [
      {
        code: "030901",
        name: "梯度类数据产品",
        definition: "交付单方梯度、批次梯度、参数增量或聚合、受保护后的梯度结果。",
        exposure: "梯度可能泄露训练样本、标签、成员身份、敏感属性与参与方信息。",
        boundary: "固定模型或模型调用归入 0307；训练过程单独交付的更新结果归入本类。",
        children: ["单方梯度", "批次梯度", "参数增量", "聚合或受保护梯度"],
        attacks: ["梯度重建", "标签泄露", "群体属性推断", "恶意更新与后门"],
        links: [docs("攻击方法库", "method_library/", "检索梯度反演、属性推断与联邦训练攻击。")],
      },
    ],
  },
];

export const categories = groups.flatMap((group) =>
  group.categories.map((category) => ({ ...category, group })),
);

export const series = [
  {
    index: "A",
    title: "第一批受控攻击实测",
    scope: "030101 存在性查询 · 030402 对象同一性核验 · 030502 等级与分段",
    attacks: "群组测试、相似度爬山、等级规则提取",
    href: `${base}/first_batch_attack_demo/`,
  },
  {
    index: "B",
    title: "知识图谱与本体隐私评测",
    scope: "030103 关系发现 · 030701 文本问答 · 030704 预测评分",
    attacks: "本体蕴含、KGE 成员推断、GraphRAG 子图重建",
    href: `${base}/kg_ontology_privacy_demo/`,
  },
  {
    index: "C",
    title: "模型与数据攻击系列",
    scope: "图像模型 · 表格模型 · 聚合与记录查询",
    attacks: "成员推断、属性推断、模型反演、数据库重建",
    href: `${base}/product_attack_docs/`,
  },
];

export function findCategory(code: string) {
  return categories.find((category) => category.code === code);
}
