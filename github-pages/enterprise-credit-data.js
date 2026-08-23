(() => {
  const companyPrefixes = ["远澜", "海岸", "星桥", "东浦", "安禾", "启明", "华清", "云港", "晨星", "嘉禾"];
  const companyIndustries = ["科技", "制造", "能源", "物流", "材料", "数科", "实业", "供应链", "工程", "服务"];
  const schema = [
    { key: "debtRatio", label: "资产负债率", unit: "%", sensitive: false, scale: 100 },
    { key: "cashFlowStress", label: "现金流紧张度", unit: "/100", sensitive: false, scale: 100 },
    { key: "revenueVolatility", label: "营收波动度", unit: "/100", sensitive: false, scale: 100 },
    { key: "operatingAgeRisk", label: "经营年限风险", unit: "/100", sensitive: false, scale: 100 },
    { key: "legalRisk", label: "司法风险", unit: "/100", sensitive: false, scale: 100 },
    { key: "overdueRate", label: "近90天逾期率", unit: "%", sensitive: true, scale: 30 },
  ];
  const coefficients = {
    debtRatio: 0.26,
    cashFlowStress: 0.18,
    revenueVolatility: 0.14,
    operatingAgeRisk: 0.10,
    legalRisk: 0.10,
    overdueRate: 0.70,
  };
  const gradeThresholds = [35, 50, 65];
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const riskIndexFor = (record) => Math.round(clamp(
    coefficients.debtRatio * record.debtRatio
      + coefficients.cashFlowStress * record.cashFlowStress
      + coefficients.revenueVolatility * record.revenueVolatility
      + coefficients.operatingAgeRisk * record.operatingAgeRisk
      + coefficients.legalRisk * record.legalRisk
      + coefficients.overdueRate * record.overdueRate,
    0,
    100,
  ) * 10) / 10;
  const gradeFor = (riskIndex) => riskIndex < gradeThresholds[0]
    ? "A"
    : riskIndex < gradeThresholds[1]
      ? "B"
      : riskIndex < gradeThresholds[2]
        ? "C"
        : "D";
  const records = Array.from({ length: 100 }, (_, index) => {
    const serial = index + 1;
    const record = {
      id: `CR-${String(serial).padStart(3, "0")}`,
      name: `${companyPrefixes[index % companyPrefixes.length]}${companyIndustries[Math.floor(index / companyPrefixes.length) % companyIndustries.length]}${String(serial).padStart(3, "0")}`,
      debtRatio: 28 + ((index * 37 + 3) % 61),
      cashFlowStress: 12 + ((index * 29 + 17) % 79),
      revenueVolatility: 8 + ((index * 43 + 11) % 77),
      operatingAgeRisk: 10 + ((index * 31 + 7) % 81),
      legalRisk: ((index * 17 + 5) % 10) * 9,
      overdueRate: Math.round((((index * 19 + Math.floor(index / 7) * 11) % 61) / 2) * 10) / 10,
    };
    record.riskIndex = riskIndexFor(record);
    record.grade = gradeFor(record.riskIndex);
    return record;
  });
  [...records]
    .sort((left, right) => right.riskIndex - left.riskIndex || left.id.localeCompare(right.id))
    .forEach((record, index) => {
      record.riskRank = index + 1;
      record.riskPercentile = 100 - index;
    });

  window.__ENTERPRISE_CREDIT_DATA__ = {
    name: "100家模拟企业信用数据集",
    schema,
    records,
    split: { reference: 60, target: 40 },
    observerRule: {
      formula: "R = clip[0,100](0.26×资产负债率 + 0.18×现金流紧张度 + 0.14×营收波动度 + 0.10×经营年限风险 + 0.10×司法风险 + 0.70×近90天逾期率)",
      coefficients,
      gradeThresholds,
      rankRule: "按风险指数 R 从高到低排列；第1名风险最高。",
    },
  };
})();
