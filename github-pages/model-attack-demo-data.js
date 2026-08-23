(() => {
  const data = window.__PRIVACY_LAB_DATA__;
  if (!data) return;

  const registerCandidates = (product, excluded) => {
    data.candidatesByProduct[product.id] = [
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
    ];
  };

  const imageProduct = data.productsById["content-vision"];
  Object.assign(imageProduct, {
    name: "人脸身份图片预测模型",
    tagline: "输入人脸图片并返回身份标签，再按相同产品边界执行成员推断与模型反演。",
    inputLabel: "待预测图片",
    inputValue: "CelebA · identity_00015.jpg",
    callLabel: "运行图片预测",
    flow: ["标准化人脸图像", "固定分类模型推理", "返回身份标签"],
    outputLabel: "预测结果",
    outputValue: "Identity 15 · Top-1",
    outputDetail: "正常产品只返回当前图片的身份预测；攻击阶段使用模型类攻击包中的固定实验结果。",
    previewImage: {
      src: "demo-assets/model-attack/face-input-00015.jpg",
      alt: "CelebA 身份 15 的输入人脸样例",
    },
    showcase: {
      title: "图片预测模型攻击结果",
      description: "保留原始指标与真实重建图；不同方法的访问权限和协议不同，因此不做横向排名。",
      items: [
        {
          src: "demo-assets/model-attack/face-reconstruction-00015.jpg",
          alt: "InvAlignment 对身份 15 的重建人脸",
          label: "InvAlignment · 单身份重建",
          metric: "Identity 15",
          note: "黑盒 softmax 后验训练解码器得到的身份原型。",
        },
        {
          src: "demo-assets/model-attack/invalignment-comparison.png",
          alt: "InvAlignment 二十组原图和重建图对比",
          label: "InvAlignment · 原图 / 重建",
          metric: "20 组身份",
          note: "可见身份级结构，但像素细节明显模糊。",
        },
        {
          src: "demo-assets/model-attack/revealer-contact-sheet.png",
          alt: "Revealer 五十个身份类别的重建联系表",
          label: "Revealer · 50 类总览",
          metric: "Top-5 68%",
          note: "100 个身份评估中 Top-1 为 28%，Top-5 为 68%。",
        },
      ],
    },
    attacks: [
      {
        id: "image-mia-rf",
        name: "图片训练成员推断",
        brief: "读取目标 Random Forest 的白盒特征，区分图片是否进入训练集。",
        result: "CelebA Male 目标模型准确率 77.0%；成员推断 AUC 为 0.6393。",
        metric: "ROC-AUC",
        value: "0.6393",
        displayScore: 64,
        evidence: "已有实测",
        attackFamily: "成员推断",
        attackObject: "成员隐私",
        source: "模型类攻击包 / RF 白盒成员推断实验",
        protocol: "CelebA Male 二分类；Random Forest 目标模型；训练成员与非成员白盒区分",
        limitation: "结果只对应当前数据划分、目标属性与白盒特征。",
      },
      {
        id: "revealer",
        name: "身份原型重建",
        brief: "利用身份分类模型结构与参数生成候选人脸，并匹配目标身份。",
        result: "100 个身份上的 Top-1 命中 28%，Top-5 命中 68%；FID 为 98.95。",
        metric: "Top-5 身份命中",
        value: "68%",
        displayScore: 68,
        evidence: "已有实测",
        attackFamily: "模型反演",
        attackObject: "数据重构",
        source: "模型类攻击包 / Revealer",
        protocol: "CelebA Identity；100 个身份；2000/215 训练/测试图像；100 个最终样本、250 个候选",
        limitation: "当前结果可获得模型结构与参数，不能外推为纯 API 黑盒效果。",
      },
      {
        id: "plgmi",
        name: "生成式模型反演",
        brief: "用身份分类模型信号约束生成器，恢复训练身份的代表性图像。",
        result: "250 个 CelebA 重建样本的 PSNR 为 12.38 dB，SSIM 为 0.189。",
        metric: "重建 PSNR",
        value: "12.38 dB",
        displayScore: 62,
        evidence: "已有实测",
        attackFamily: "模型反演",
        attackObject: "数据重构",
        source: "模型类攻击包 / PLGMI",
        protocol: "CelebA；VGG16；2000 个训练样本；250 个重建样本",
        limitation: "PSNR 不等同身份可识别率；需统一协议后再与其他方法比较。",
      },
    ],
  });
  registerCandidates(imageProduct, {
    name: "模型能力复制",
    reason: "实验包没有统一查询预算下的替代模型训练协议。",
  });

  const gradientProduct = data.productsById["finance-gradient"];
  Object.assign(gradientProduct, {
    name: "联邦图像训练更新交付",
    tagline: "客户端完成图像模型本地训练后交付梯度或参数增量，再评估更新信号中的样本泄露。",
    inputLabel: "本地训练批次",
    inputValue: "图像批次 · B=1 / 本地更新 E=20",
    callLabel: "生成并交付更新",
    flow: ["本地前向与反向传播", "导出梯度或参数增量", "服务器接收并聚合"],
    outputLabel: "训练交付结果",
    outputValue: "UPDATE #020 · 已接收",
    outputDetail: "同一产品覆盖单轮共享梯度和多步参数更新，攻击阶段展示 GradInversion、iDLG 与 SME。",
    showcase: {
      title: "梯度与训练更新攻击结果",
      description: "三组结果对应单轮梯度、标签泄露适配与多步更新反演；批量、网络和防御会改变风险。",
      items: [
        {
          src: "demo-assets/model-attack/gradinv-batch1.png",
          alt: "GradInversion ImageNet batch 1 原图与重建图",
          label: "GradInversion · ImageNet B=1",
          metric: "FeatCos 0.901",
          note: "标签集合恢复 100%，PSNR 8.99 dB；主要保留类别级结构。",
        },
        {
          src: "demo-assets/model-attack/idlg-lfw-batch1.png",
          alt: "iDLG LFW batch 1 原图与重建图",
          label: "iDLG · LFW B=1",
          metric: "标签 100%",
          note: "无池化 CNN + Adam 适配；不可与原论文设置直接比较。",
        },
        {
          src: "demo-assets/model-attack/sme-cifar100.png",
          alt: "SME CIFAR-100 多步模型更新反演对比",
          label: "SME · CIFAR-100 E=20",
          metric: "PSNR 20.56 dB",
          note: "相对多步 IG 基线 13.85 dB 提升 6.70 dB。",
        },
      ],
    },
    attacks: [
      {
        id: "gradinv",
        name: "单轮梯度图像重建",
        brief: "优化虚拟图片，使其产生与共享梯度一致的更新信号。",
        result: "ImageNet / ResNet-50 / B=1 下标签集合恢复 100%，特征余弦 0.901，PSNR 8.99 dB。",
        metric: "特征余弦",
        value: "0.901",
        displayScore: 90,
        evidence: "已有实测",
        attackFamily: "梯度反演",
        attackObject: "数据重构",
        source: "模型类攻击包 / GradInversion 实验对比",
        protocol: "ImageNet；ResNet-50；batch=1；由单轮共享梯度重建输入与标签集合",
        limitation: "图像主要达到类别级结构；PSNR 仅 8.99 dB。",
      },
      {
        id: "idlg",
        name: "梯度标签泄露",
        brief: "从最后一层梯度符号确定标签，再联合优化输入图像。",
        result: "适配实验的 MNIST、CIFAR-100 与 LFW 标签恢复率均为 100%。",
        metric: "标签恢复率",
        value: "100%",
        displayScore: 100,
        evidence: "已有实测",
        attackFamily: "标签推断",
        attackObject: "标签隐私",
        source: "模型类攻击包 / iDLG Adam 完整实验与批量实验",
        protocol: "无池化 CNN + Adam 适配；MNIST/CIFAR-100/LFW；B=1",
        limitation: "适配设置产生接近完美数值，不能与原论文或其他网络直接横比。",
      },
      {
        id: "sme",
        name: "多步模型更新反演",
        brief: "从连续本地训练后的参数增量估计隐式梯度，再反演训练批次。",
        result: "CIFAR-100 上 SME PSNR 为 20.56 dB，高于多步 IG 基线 13.85 dB。",
        metric: "PSNR 提升",
        value: "+6.70 dB",
        displayScore: 82,
        evidence: "已有实测",
        attackFamily: "更新反演",
        attackObject: "数据重构",
        source: "模型类攻击包 / SME CIFAR-100 多步更新反演",
        protocol: "CIFAR-100；N=50、batch=10、20 个本地 epoch、lr=0.004",
        limitation: "已知训练配置的受控更新；聚合、裁剪与噪声会改变风险。",
      },
    ],
  });
  registerCandidates(gradientProduct, {
    name: "恶意更新后门",
    reason: "当前角色只接收并评估既有更新，不能向训练流程写入恶意参数。",
  });
})();
