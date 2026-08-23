import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { categories, groups } from "../app/data.ts";
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
  { index: "04", title: "风险聚合", headline: "形成效用—隐私损失曲线", body: "根据各攻击对象的结果向量，再结合有限调查、行业信息和业务要求建立效用—隐私损失曲线。", output: "最终隐私结论" },
];

const showcaseSeries = [
  { id: "data", code: "S1", name: "行业数据库与核验产品", visual: "data", productIds: ["city-existence", "content-library", "finance-graph", "finance-aggregate", "finance-derived", "city-verify", "content-voice", "finance-verify"] },
  { id: "vision", code: "S2", name: "视觉理解与身份核验模型", visual: "vision", productIds: ["content-voice", "content-vision"] },
  { id: "chat", code: "S3", name: "检索增强生成与智能问答", visual: "chat", productIds: ["city-rag", "content-multimodal"] },
  { id: "graph", code: "S4", name: "知识图谱与关系查询产品", visual: "graph", productIds: ["finance-graph"] },
  { id: "attribute", code: "S5", name: "指标发布与属性推断产品", visual: "attribute", productIds: ["finance-index", "city-grade", "content-rank", "finance-model"] },
  { id: "gradient", code: "S6", name: "梯度与训练更新交付产品", visual: "gradient", productIds: ["finance-gradient"] },
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
  const frameworkRows = frameworkSteps.map((step) => `<tr><td>${step.index}</td><th scope="row">${step.title}</th><td>${step.body}</td><td>${step.output}</td></tr>`).join("");
  const taxonomyBranches = groups.map((group) => `
            <div class="tree-branch">
              <p class="tree-branch-title"><span>${group.code}</span>${escapeHtml(group.name)}</p>
              <ul class="tree-nodes">${group.categories.map((category) => `<li><a href="security_attacks/${category.code}.html"><strong>${category.code} ${escapeHtml(category.name)}</strong></a></li>`).join("")}</ul>
            </div>`).join("");
  const productsById = Object.fromEntries(demoSuites.flatMap((suite) => suite.products).map((product) => [product.id, product]));
  const payload = JSON.stringify({ series: showcaseSeries, productsById, candidatesByProduct: candidateAttacks }).replaceAll("<", "\\u003c");

  const body = `
    <main id="top">
      <header class="site-header">
        <h1>数据产品安全衡量框架</h1>
      </header>

      <div class="document-layout">
        <nav class="page-nav" aria-label="页面目录">
          <h2>目录</h2>
          <ol>
            <li><a href="#framework">衡量框架</a></li>
            <li><a href="#taxonomy">产品类别</a></li>
            <li><a href="#interactive-demo">互动演示</a></li>
          </ol>
          <p class="toc-top"><a href="#top">返回页面顶部</a></p>
        </nav>

        <div class="document-content">
          <section id="framework">
            <h2>一、衡量框架</h2>
            <div class="chain-line">产品表示 → 攻击匹配 → 统一衡量 → 风险聚合</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th scope="col">步骤</th><th scope="col">环节</th><th scope="col">主要工作</th><th scope="col">输出</th></tr></thead>
                <tbody>${frameworkRows}</tbody>
              </table>
            </div>
          </section>

          <section id="taxonomy">
            <h2>二、产品类别</h2>
            <figure class="taxonomy-tree">
              <figcaption>本框架当前覆盖的数据资源产品三级分类树</figcaption>
              <div class="tree-root">03 数据资源产品</div>
              <div class="tree-branches">${taxonomyBranches}</div>
            </figure>
          </section>

          <section id="interactive-demo" aria-labelledby="lab-title">
            <h2 id="lab-title">三、互动演示</h2>
            <div id="privacy-lab-root"><p>正在载入互动演示…</p></div>
          </section>

          <footer class="site-footer"><p>数据产品安全衡量框架 · 研究用途</p><a href="#top">返回页面顶部</a></footer>
        </div>
      </div>
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
  const css = await readFile(path.join(projectRoot, "scripts/privacy-lab-static.css"), "utf8");
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
