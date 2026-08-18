import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { categories, groups, series } from "../app/data.ts";
import { candidateAttacks, demoSuites } from "../app/demo-data.ts";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "github-pages");
const attackOutput = path.join(outputRoot, "security_attacks");
const publicBase = "https://karlmyh.github.io/DataProductFramework";
const archivedEvidenceBase = "https://github.com/Karlmyh/DataProductFramework/tree/9394efeddab45409657fe79996de985b5e31c1a9";
const archivedEvidenceDirectories = new Set([
  "attribute_inference_demo",
  "dataset_reconstruction_demo",
  "first_batch_attack_demo",
  "membership_inference_demo",
  "method_library",
  "product_attack_docs",
]);
const legacyCodes: Record<string, string> = {
  "0101": "030401", "0102": "030402", "0103": "030403",
  "0201": "030501", "0202": "030502", "0203": "030503",
  "0301": "030101", "0302": "030102", "0303": "030103", "0304": "030104", "0305": "030105",
  "030601": "030101", "030602": "030102", "030603": "030103", "030604": "030104", "030605": "030105",
  "0401": "030701", "0402": "030702", "0403": "030703", "0404": "030704",
};

const frameworkSteps = [
  { index: "01", title: "产品表示", headline: "先确定交付的是什么", body: "把平台拆成可独立调用的原子产品，用“产品类别＋交付方式＋可见输出＋保护边界”形成统一画像。", output: "产品画像" },
  { index: "02", title: "攻击匹配", headline: "再测试所有适用攻击", body: "根据攻击者可控输入、可见输出、先验与预算匹配候选方法；适用的全部执行，不适用的记录原因。", output: "攻击结果集" },
  { index: "03", title: "统一衡量", headline: "让不同结果可以比较", body: "保留 AUC、恢复率、一致率等原始指标，再用零信息基线与完全风险参考校准为 0—100 隐私损失。", output: "统一风险分" },
  { index: "04", title: "风险聚合", headline: "主结论取最大，结果向量保留", body: "同层按最大隐私损失形成产品主结论，同时保留各攻击对象的结果向量；平均值只作为辅助描述。", output: "产品综合结论" },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function analytics() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=G-5ZH8RB1RV4"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-5ZH8RB1RV4');
    </script>`;
}

function archivedEvidenceHref(href: string) {
  const relative = href.startsWith(`${publicBase}/`) ? href.slice(publicBase.length + 1) : "";
  const topDirectory = relative.split("/", 1)[0];
  return archivedEvidenceDirectories.has(topDirectory) ? `${archivedEvidenceBase}/${relative}` : archivedEvidenceBase;
}

function documentShell({ title, description, stylesheet, canonical, body, extraHead = "" }: {
  title: string;
  description: string;
  stylesheet: string;
  canonical: string;
  body: string;
  extraHead?: string;
}) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="stylesheet" href="${stylesheet}" />
    <title>${escapeHtml(title)}</title>
    ${extraHead}
    ${analytics()}
  </head>
  <body>${body}</body>
</html>
`;
}

function renderHome() {
  const categoryCount = groups.reduce((sum, group) => sum + group.categories.length, 0);
  const frameworkStrip = frameworkSteps.map((step) => `<div><span>${step.index}</span><strong>${step.title}</strong><p>${step.output}</p></div>`).join("");
  const frameworkCards = frameworkSteps.map((step, index) => `<article><header><span>${step.index}</span><small>${step.title}</small></header><h3>${step.headline}</h3><p>${step.body}</p><footer><span>输出</span><strong>${step.output}</strong></footer>${index < frameworkSteps.length - 1 ? '<i aria-hidden="true">→</i>' : ""}</article>`).join("");
  const taxonomyCards = groups.map((group) => `
            <article class="taxonomy-card" style="--group-accent:${group.accent}">
              <header><span>${group.code}</span><small>${group.categories.length} 个三级类别</small></header>
              <h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.summary)}</p>
              <ol>${group.categories.map((category) => `<li><a href="security_attacks/${category.code}.html"><span>${category.code}</span><strong>${escapeHtml(category.name)}</strong><i aria-hidden="true">↗</i></a><small>${category.attacks.slice(0, 2).map(escapeHtml).join(" · ")}</small></li>`).join("")}</ol>
            </article>`).join("");
  const archivedEvidencePaths: Record<string, string> = { A: "/first_batch_attack_demo", B: "", C: "/product_attack_docs" };
  const seriesRows = series.map((item) => `<a class="series-row" href="${archivedEvidenceBase}${archivedEvidencePaths[item.index] ?? ""}" target="_blank" rel="noreferrer"><span class="series-index">${item.index}</span><span class="series-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.scope)}</small></span><span class="series-attacks">${escapeHtml(item.attacks)}</span><span class="series-arrow" aria-hidden="true">↗</span></a>`).join("");
  const payload = JSON.stringify({ suites: demoSuites, candidatesByProduct: candidateAttacks }).replaceAll("<", "\\u003c");

  const body = `
    <main>
      <header class="site-header" id="top">
        <div class="eyebrow-row"><span>DATA PRODUCT PRIVACY LAB · 2026</span><span>衡量 / 决策 / 优化</span></div>
        <p class="hero-kicker">产品化隐私风险演示与统一衡量</p>
        <h1>数据产品<br />安全衡量框架</h1>
        <p class="lead">从产品实际交付的结果出发，识别可见接口，匹配所有适用攻击，再把不同攻击结果汇总成可比较、可解释的产品风险结论。</p>
        <div class="framework-strip" aria-label="衡量框架的四个环节">${frameworkStrip}</div>
        <nav class="hero-nav" aria-label="页面目录"><a class="hero-cta" href="#framework">查看衡量流程 <span aria-hidden="true">↓</span></a><a href="#interactive-demo">直接进入 Demo</a></nav>
      </header>

      <section class="section-block framework-section" id="framework">
        <div class="section-heading"><span class="section-number">01</span><div><p class="section-kicker">MEASUREMENT FRAMEWORK</p><h2>从产品调用到风险结论</h2><p>页面内容严格按“表示—匹配—衡量—聚合”的主链组织；Demo 也完整复现同一条链路。</p></div></div>
        <div class="framework-grid">${frameworkCards}</div>
        <div class="framework-formula"><span>摘要聚合口径</span><strong>产品主结论 = max（各攻击对象隐私损失），并保留完整结果向量</strong><p>Demo 中未完成正式损失曲线配置的数字只标为“展示性结果强度”；平均值仅作辅助。</p></div>
      </section>

      <section id="taxonomy" class="section-block taxonomy-section">
        <div class="section-heading"><span class="section-number">02</span><div><p class="section-kicker">UPDATED PRODUCT TAXONOMY</p><h2>当前覆盖的五个产品类别</h2><p>已按最新《数据产品隐私衡量项目摘要》更新：5 个二级类别、${categoryCount} 个三级类别。原“数据查询类”并入 0301 行业基础数据库；模型类改为按最终任务与输出划分；新增 0309 梯度类。</p></div></div>
        <div class="taxonomy-overview" aria-label="数据资源产品分类概览">
          <div class="taxonomy-root"><span>03</span><strong>数据资源产品</strong><small>当前框架覆盖范围</small></div><div class="taxonomy-line" aria-hidden="true"></div>
          <div class="taxonomy-groups">${taxonomyCards}</div>
        </div>
      </section>

      <section class="lab-section" id="interactive-demo" aria-labelledby="lab-title">
        <div class="section-heading lab-heading"><span class="section-number">03</span><div><p class="section-kicker">INTERACTIVE PRODUCT LAB</p><h2 id="lab-title">多类别产品 · 一站式攻击结果台</h2><p>选择一个业务场景，再切换其中的产品。正常调用会以动画呈现；页面随后自动执行该产品当前匹配到的全部攻击，并比较、聚合结果。</p></div></div>
        <div id="privacy-lab-root"><p class="static-loading">正在载入互动产品实验室…</p></div>
      </section>

      <section id="existing" class="section-block evidence-section">
        <div class="section-heading"><span class="section-number">04</span><div><p class="section-kicker">EXISTING EVIDENCE</p><h2>已完成内容与本页复用方式</h2><p>已有实验继续作为“已有实测”；新增产品使用“机制验证”或“受控演示”标识，并补充来源、协议与限制，避免把演示数字误写成真实业务结论。</p></div></div>
        <div class="evidence-summary"><div><strong>3</strong><span>现有实测系列</span></div><div><strong>5</strong><span>更新后二级类别</span></div><div><strong>3</strong><span>多类别场景 Demo</span></div><div><strong>15</strong><span>可切换产品</span></div></div>
        <div class="series-list">${seriesRows}</div>
      </section>

      <section class="section-block reading-guide" id="guide">
        <div class="section-heading"><span class="section-number">05</span><div><p class="section-kicker">HOW TO READ</p><h2>如何理解页面中的结果</h2></div></div>
        <div class="guide-grid"><article><span>已有实测</span><h3>来自现有固定实验结果</h3><p>直接复用仓库中已有的查询预算、恢复率、相似度或泄露率，并在 Demo 中标出来源层级。</p></article><article><span>机制验证</span><h3>攻击机制已实现或已有入口</h3><p>说明该类风险有实际代码或复现路径，但当前场景数字仍是受控适配，不外推到真实产品。</p></article><article><span>受控演示</span><h3>用于展示比较与聚合逻辑</h3><p>数字是虚构产品的展示性结果强度，不是归一隐私损失；真实产品必须配置基线、参考点与损失曲线后复测。</p></article></div>
      </section>

      <footer class="site-footer"><div><span>DATA PRODUCT PRIVACY LAB</span><strong>数据产品安全衡量框架</strong></div><p>研究用途 · 受控攻击 · 不连接真实业务系统</p><a href="#top">回到页首 ↑</a></footer>
    </main>
    <script>window.__PRIVACY_LAB_DATA__=${payload};</script>
    <script src="privacy-lab.js" defer></script>`;

  return documentShell({
    title: "数据产品安全衡量框架",
    description: "覆盖行业基础数据库、核验、指标、模型与梯度产品的互动式隐私攻击演示和统一风险衡量。",
    stylesheet: "security_attacks/styles.css",
    canonical: `${publicBase}/`,
    body,
    extraHead: `<meta property="og:title" content="数据产品安全衡量框架" />
    <meta property="og:description" content="五类数据产品 · 互动调用演示 · 多攻击结果聚合" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${publicBase}/" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="数据产品安全衡量框架" />
    <meta name="twitter:description" content="五类数据产品 · 互动调用演示 · 多攻击结果聚合" />`,
  });
}

function renderAttackPage(category: (typeof categories)[number], index: number) {
  const previous = categories[(index - 1 + categories.length) % categories.length];
  const next = categories[(index + 1) % categories.length];
  const children = category.children.map((child) => `<li>${escapeHtml(child)}</li>`).join("");
  const attacks = category.attacks.map((attack, attackIndex) => `
                <li><span>${String(attackIndex + 1).padStart(2, "0")}</span><strong>${escapeHtml(attack)}</strong></li>`).join("");
  const links = category.links.map((link) => `
            <a class="reference-link" href="${archivedEvidenceHref(link.href)}" target="_blank" rel="noreferrer">
              <strong>${escapeHtml(link.label)}</strong><span>${escapeHtml(link.note)}</span><b aria-hidden="true">↗</b>
            </a>`).join("");

  const body = `
    <main class="detail-main">
      <header class="detail-header">
        <nav class="breadcrumbs" aria-label="面包屑">
          <a href="../">分类树</a><span>/</span>
          <span>${category.group.code} ${escapeHtml(category.group.name)}</span><span>/</span>
          <strong>${category.code}</strong>
        </nav>
        <span class="category-code">攻击面 · ${category.code}</span>
        <h1>${escapeHtml(category.name)}<br />攻击页面</h1>
        <p class="lead">${escapeHtml(category.definition)}</p>
      </header>

      <section class="detail-section">
        <h2>攻击面判定</h2>
        <div class="facts-grid">
          <div class="fact"><span>核心交付</span><p>${escapeHtml(category.definition)}</p></div>
          <div class="fact"><span>主要暴露</span><p>${escapeHtml(category.exposure)}</p></div>
          <div class="fact"><span>分类边界</span><p>${escapeHtml(category.boundary)}</p></div>
        </div>
      </section>

      <section class="detail-section detail-columns">
        <div><h2>四级产品分支</h2><ol class="numbered-list">${children}</ol></div>
        <div><h2>主要攻击</h2><ol class="attack-list">${attacks}</ol></div>
      </section>

      <section class="detail-section">
        <h2>攻击文档与实验入口</h2>
        <div class="reference-list">${links}
        </div>
      </section>

      <nav class="detail-nav" aria-label="相邻类别">
        <a href="${previous.code}.html"><small>← 上一个类别</small><strong>${previous.code} ${escapeHtml(previous.name)}</strong></a>
        <a href="${next.code}.html"><small>下一个类别 →</small><strong>${next.code} ${escapeHtml(next.name)}</strong></a>
      </nav>
      <footer class="detail-footer"><a href="../">返回数据产品安全衡量框架</a></footer>
    </main>`;

  return documentShell({
    title: `${category.code} ${category.name}攻击｜数据产品安全衡量框架`,
    description: category.exposure,
    stylesheet: "styles.css",
    canonical: `${publicBase}/security_attacks/${category.code}.html`,
    body,
  });
}

function renderLegacyRedirect(oldCode: string, newCode: string) {
  const body = `
    <main class="detail-main">
      <header class="detail-header">
        <span class="category-code">分类编号已更新</span>
        <h1>${oldCode}<br />已调整为 ${newCode}</h1>
        <p class="lead">该类别已纳入“03 数据资源产品”大框架，正在跳转到新的攻击页面。</p>
        <p><a href="${newCode}.html">立即前往 ${newCode} →</a></p>
      </header>
    </main>`;
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${newCode}.html" />
    <link rel="canonical" href="${publicBase}/security_attacks/${newCode}.html" />
    <link rel="stylesheet" href="styles.css" />
    <title>分类编号更新｜数据产品安全衡量框架</title>
  </head>
  <body>${body}</body>
</html>
`;
}

async function main() {
  await mkdir(attackOutput, { recursive: true });
  const sourceCss = await readFile(path.join(projectRoot, "app/globals.css"), "utf8");
  const css = sourceCss.replace(/^@import\s+"tailwindcss";\s*/, "") + `
.detail-footer { margin-top: 34px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 13px; }
`;
  await writeFile(path.join(outputRoot, "index.html"), renderHome(), "utf8");
  await copyFile(path.join(projectRoot, "scripts/privacy-lab-static.js"), path.join(outputRoot, "privacy-lab.js"));
  await writeFile(path.join(attackOutput, "styles.css"), css, "utf8");
  await Promise.all(categories.map((category, index) =>
    writeFile(path.join(attackOutput, `${category.code}.html`), renderAttackPage(category, index), "utf8")
  ));
  await Promise.all(Object.entries(legacyCodes).map(([oldCode, newCode]) =>
    writeFile(path.join(attackOutput, `${oldCode}.html`), renderLegacyRedirect(oldCode, newCode), "utf8")
  ));
  console.log(`已生成 1 个首页、${categories.length} 个新编号攻击页面、${Object.keys(legacyCodes).length} 个旧链接跳转页和 1 个样式文件。`);
}

await main();
