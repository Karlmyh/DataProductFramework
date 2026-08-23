import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { categories, groups } from "../app/data.ts";
import { candidateAttacks, demoSuites } from "../app/demo-data.ts";

const pagesRoot = new URL("../github-pages/", import.meta.url);

test("exports the complete taxonomy and static category pages", async () => {
  const html = await readFile(new URL("index.html", pagesRoot), "utf8");
  assert.equal(groups.length, 5);
  assert.equal(categories.length, 18);
  for (const group of groups) assert.match(html, new RegExp(group.code));
  for (const category of categories) {
    assert.match(html, new RegExp(`href="(?:security_attacks/${category.code}\\.html|\\?demo=${category.code})"`));
    await access(new URL(`security_attacks/${category.code}.html`, pagesRoot));
  }
  assert.doesNotMatch(html, /0306 数据查询类/);
});

test("embeds all guided product series and their candidate attack registries", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("index.html", pagesRoot), "utf8"),
    readFile(new URL("privacy-lab.js", pagesRoot), "utf8"),
  ]);
  assert.equal(demoSuites.length, 3);
  assert.equal(demoSuites.flatMap((suite) => suite.products).length, 17);
  assert.equal(Object.keys(candidateAttacks).length, 17);
  for (const series of ["行业数据库与核验产品", "视觉理解与身份核验模型", "检索增强生成与智能问答", "知识图谱与关系查询产品", "指标发布与属性推断产品", "梯度与训练更新交付产品"]) {
    assert.match(html, new RegExp(series));
  }
  for (const product of demoSuites.flatMap((suite) => suite.products)) {
    assert.match(html, new RegExp(product.id));
    assert.equal(candidateAttacks[product.id].filter((candidate) => candidate.executed).length, product.attacks.length);
  }
  assert.match(script, /data-series/);
  assert.match(script, /data-product/);
  assert.match(script, /objectVector/);
  assert.match(script, /renderResults/);
  assert.match(script, /renderVisual/);
  assert.match(script, /audit-rail/);
  assert.match(script, /产品演示/);
  assert.match(script, /隐私攻击演示/);
  assert.match(script, /data-start-attack/);
  assert.match(script, /data-run-product/);
  assert.match(script, /data-product-input/);
  assert.match(script, /产品界面/);
  assert.match(script, /renderProductPresentation/);
  assert.match(script, /代码与数据/);
  assert.match(script, /gradient-product-view/);
  assert.match(script, /GRADIENT TENSOR/);
  assert.match(script, /loss\.backward\(\)/);
});

test("uses GitHub Pages-relative assets and includes social metadata", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("index.html", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/styles.css", pagesRoot), "utf8"),
  ]);
  assert.match(html, /src="privacy-lab\.js(?:\?[^"\s]+)?"/);
  assert.match(html, /href="security_attacks\/styles\.css(?:\?[^"\s]+)?"/);
  assert.doesNotMatch(html, /chatgpt\.site/);
  assert.doesNotMatch(html, /href="\/attacks\//);
  assert.doesNotMatch(css, /@import\s+"tailwindcss"/);
});

test("renders face hill climbing as a continuous accepted path", async () => {
  const [script, css] = await Promise.all([
    readFile(new URL("privacy-lab.js", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/styles.css", pagesRoot), "utf8"),
  ]);
  assert.match(script, /连续人脸爬山/);
  assert.match(script, /acceptedTrajectory/);
  assert.match(script, /rejectedProbes/);
  assert.match(script, /相似度只用于演示路径，不对外暴露/);
  assert.match(script, /新起点会另起一行并用断点标记/);
  assert.doesNotMatch(script, /实际评估 \$\{run\.queryCount\}\/\$\{run\.librarySize\} 张合成人脸/);
  assert.match(css, /\.face-trajectory/);
  assert.match(css, /\.face-rejected-list/);
  assert.match(css, /\.face-oracle-boundary/);
});

test("focuses the main demo while preserving standalone verification and vision products", async () => {
  const [html, script, relationshipPage] = await Promise.all([
    readFile(new URL("index.html", pagesRoot), "utf8"),
    readFile(new URL("privacy-lab.js", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/030403.html", pagesRoot), "utf8"),
  ]);
  const seriesAdjustment = html.slice(html.indexOf("const databaseSeries"), html.indexOf("const graphAssistant"));
  assert.match(seriesAdjustment, /\["graph", "vision"\]\.includes\(item\.id\)/);
  assert.doesNotMatch(seriesAdjustment, /visionSeries|id: "verification"/);
  assert.match(html, /\?demo=030402/);
  assert.match(html, /\?demo=030403/);
  assert.match(html, /\?demo=030702/);
  assert.match(script, /values: \["有放回重采样", "无放回子采样", "合成数据"\]/);
  assert.doesNotMatch(script, /Bootstrap|Subsampling|Synthetic Data/);
  assert.match(script, /若每次核验都要求证明控制企业或账户中的一方，则该攻击不成立/);
  assert.match(relationshipPage, /分别掌握企业标识候选集和账户标识候选集/);
  assert.match(relationshipPage, /要求证明对企业或账户一方的控制权，这种关系枚举攻击就不成立/);
});

test("uses one 100-company six-feature credit dataset for 030501 through 030503 and 030704", async () => {
  const [html, dataScript, labScript, indexPage, gradePage, rankPage, modelPage] = await Promise.all([
    readFile(new URL("index.html", pagesRoot), "utf8"),
    readFile(new URL("enterprise-credit-data.js", pagesRoot), "utf8"),
    readFile(new URL("privacy-lab.js", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/030501.html", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/030502.html", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/030503.html", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/030704.html", pagesRoot), "utf8"),
  ]);
  assert.match(html, /enterprise-credit-data\.js/);
  assert.ok(html.indexOf("enterprise-credit-data.js") < html.indexOf("privacy-lab.js"));
  assert.match(dataScript, /length: 100/);
  assert.match(dataScript, /近90天逾期率/);
  assert.match(dataScript, /0\.26×资产负债率/);
  assert.match(dataScript, /defaultProbability/);
  assert.match(dataScript, /P\(未来90天违约\) = sigmoid/);
  assert.match(labScript, /formulaAccessCount: 0/);
  assert.match(labScript, /60家参考企业六维全知/);
  assert.match(labScript, /40家目标企业只暴露五个非敏感维度/);
  assert.match(labScript, /creditFormulaStrip\(product\)/);
  assert.doesNotMatch(labScript, /credit-dataset-header/);
  assert.doesNotMatch(labScript, /credit-formula-card/);
  assert.doesNotMatch(labScript, /选择同一模拟数据集中的企业/);
  assert.doesNotMatch(labScript, /三个产品共用100家企业和同一组六维信用特征/);
  assert.doesNotMatch(labScript, /目标敏感维度/);
  assert.doesNotMatch(labScript, /敏感属性反演结果/);
  assert.doesNotMatch(labScript, /credit-result-note/);
  assert.doesNotMatch(labScript, /属性反演结论/);
  assert.doesNotMatch(labScript, /credit-knowledge-boundary/);
  assert.doesNotMatch(labScript, /credit-learning-card/);
  assert.doesNotMatch(labScript, /目标企业敏感属性反演/);
  assert.doesNotMatch(labScript, /成对排序代理规则/);
  assert.doesNotMatch(labScript, /credit-knowledge-line/);
  assert.match(labScript, /平均区间长度/);
  assert.match(labScript, /"finance-index", "city-grade", "content-rank", "finance-model"/);
  assert.match(indexPage, /未知评分公式学习/);
  assert.match(gradePage, /逾期率兼容区间反演/);
  assert.match(rankPage, /成对排序代理规则学习/);
  assert.match(modelPage, /企业违约预测 API/);
  assert.match(modelPage, /近90天逾期率反演/);

  const payloadMatch = html.match(/<script>window\.__PRIVACY_LAB_DATA__=(.*?);<\/script>/s);
  assert.ok(payloadMatch);
  const context = { window: {}, document: { querySelector: () => ({}) } };
  vm.createContext(context);
  context.window.__PRIVACY_LAB_DATA__ = JSON.parse(payloadMatch[1]);
  vm.runInContext(dataScript, context);
  const marker = "  recoveryAttackConfigs.forEach((_, productId) => productUsageLimitOptions.forEach((budget) => productRecoverySavedRuns.set(`${productId}:${budget}`, simulateProductRecoveryBudget(productId, budget))));";
  const instrumented = labScript.replace(marker, `${marker}\n  globalThis.__creditRuns = Object.fromEntries(["finance-index", "city-grade", "content-rank", "finance-model"].map((id) => [id, simulateProductRecoveryBudget(id, 100)]));\n  return;`);
  assert.notEqual(instrumented, labScript);
  vm.runInContext(instrumented, context);
  const runs = context.__creditRuns;
  for (const run of Object.values(runs)) {
    assert.equal(run.queryCount, 100);
    assert.equal(run.referenceCount, 60);
    assert.equal(run.targetCount, 40);
    assert.equal(run.formulaAccessCount, 0);
  }
  assert.ok(runs["finance-index"].meanAbsoluteError < 0.2);
  assert.ok(runs["city-grade"].recall >= 0.8);
  assert.ok(new Set(runs["city-grade"].candidateResults.map((row) => `${row.minimum.toFixed(1)}-${row.maximum.toFixed(1)}`)).size >= 20);
  assert.ok(new Set(runs["city-grade"].candidateResults.map((row) => row.publicContribution.toFixed(4))).size >= 20);
  assert.ok(runs["content-rank"].meanAbsoluteError < 4);
  assert.ok(runs["content-rank"].meanIntervalWidth > 0);
  assert.ok(runs["finance-model"].meanAbsoluteError < 0.2);
});

test("uses one chatbot UI and measures answer-only RAG corpus membership with ROC-AUC", async () => {
  const [html, ragScript, membershipScript, labScript, buildScript, membershipRunner, benchmarkBuilder, textCorpus, imageCorpus] = await Promise.all([
    readFile(new URL("index.html", pagesRoot), "utf8"),
    readFile(new URL("rag-chat-data.js", pagesRoot), "utf8"),
    readFile(new URL("rag-membership-results.js", pagesRoot), "utf8"),
    readFile(new URL("privacy-lab.js", pagesRoot), "utf8"),
    readFile(new URL("../scripts/rag_chat_demo/build_rag_demo.py", pagesRoot), "utf8"),
    readFile(new URL("../scripts/rag_chat_demo/run_membership_inference.py", pagesRoot), "utf8"),
    readFile(new URL("../scripts/rag_chat_demo/prepare_membership_benchmark.py", pagesRoot), "utf8"),
    readFile(new URL("../scripts/rag_chat_demo/data/text_documents.jsonl", pagesRoot), "utf8"),
    readFile(new URL("../scripts/rag_chat_demo/data/image_documents.jsonl", pagesRoot), "utf8"),
  ]);
  assert.ok(html.indexOf("rag-chat-data.js") < html.indexOf("rag-membership-results.js"));
  assert.ok(html.indexOf("rag-membership-results.js") < html.indexOf("privacy-lab.js"));
  assert.match(html, /chatSeries\) chatSeries\.productIds = \["city-rag", "content-multimodal"\]/);
  assert.doesNotMatch(html, /chatSeries\.productIds = \["city-rag", "finance-graph"/);
  assert.match(labScript, /data-rag-question/);
  assert.match(labScript, /rag-image-input/);
  assert.match(labScript, /ragMembershipResultFor/);
  assert.match(labScript, /formatRagMetric/);
  assert.match(labScript, /rag-membership-summary/);
  assert.match(labScript, /ROC-AUC/);
  assert.match(labScript, /模型调用上限/);
  assert.match(labScript, /实际攻击查询/);
  assert.match(labScript, /不可计算/);
  assert.match(labScript, /候选对象/);
  assert.match(labScript, /ragProductUsageLimitOptions = \[2, 5, 10\]/);
  assert.match(labScript, /productUsageLimitOptionsFor\(product\)\.map/);
  assert.match(labScript, /productUsageLimitOptionsFor\(product\)\.includes\(limit\)/);
  assert.doesNotMatch(labScript, /rag-membership-note|受控合成候选集实测/);
  assert.doesNotMatch(labScript, /4 \/ 4|正文命中率|命中关键词|ragTextInferenceFor/);
  for (const hiddenCopy of ["Qwen2.5-7B + RAG", "默认链路", "政策知识库已连接", "基于检索结果", "生成耗时", "固定问题预生成结果", "RAG 检索记录"]) {
    assert.equal(labScript.includes(hiddenCopy), false);
  }
  assert.match(buildScript, /CREATE TABLE rag_documents/);
  assert.match(buildScript, /Qwen\/Qwen2\.5-7B-Instruct/);
  assert.match(buildScript, /BAAI\/bge-small-en-v1\.5/);
  assert.match(buildScript, /不得输出资料编号、文件名、来源、引用或检索过程/);
  assert.match(membershipRunner, /roc_auc_score/);
  assert.match(membershipRunner, /def answer_score/);
  assert.match(membershipRunner, /def summarize_budgets/);
  assert.match(membershipRunner, /chatbot_answer_text_only/);
  assert.match(membershipRunner, /CREATE TABLE rag_documents/);
  assert.match(benchmarkBuilder, /TEXT_COUNT = 40/);
  assert.match(benchmarkBuilder, /IMAGE_COUNT = 24/);
  assert.equal(textCorpus.trim().split("\n").length, 9);
  assert.equal(imageCorpus.trim().split("\n").length, 3);

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(ragScript, context);
  vm.runInContext(membershipScript, context);
  const ragData = context.window.__RAG_CHAT_DATA__;
  const membershipResults = context.window.__RAG_MEMBERSHIP_RESULTS__;
  assert.equal(ragData.schemaVersion, 2);
  assert.equal(ragData.responses.length, 6);
  assert.equal(membershipResults.schemaVersion, 2);
  assert.deepEqual(
    Array.from(membershipResults.results, (result) => [result.productCode, result.candidateCount, result.memberCount, result.nonmemberCount, result.queryCount]),
    [["030701", 40, 20, 20, 80], ["030705", 24, 12, 12, 48]],
  );
  for (const result of membershipResults.results) {
    assert.ok(result.rocAuc >= 0.5 && result.rocAuc <= 1);
    assert.equal(result.scoreSource, "chatbot_answer_text_only");
    assert.equal(result.budgetResults.length, 11);
    const oneQuery = result.budgetResults.find((row) => row.queryCount === 1);
    const fourQueries = result.budgetResults.find((row) => row.queryCount === 4);
    const nineQueries = result.budgetResults.find((row) => row.queryCount === 9);
    assert.deepEqual([oneQuery.memberCount, oneQuery.nonmemberCount, oneQuery.rocAuc], [1, 0, null]);
    assert.deepEqual([fourQueries.memberCount, fourQueries.nonmemberCount, fourQueries.rocAuc], [2, 2, 1]);
    assert.deepEqual([nineQueries.memberCount, nineQueries.nonmemberCount, nineQueries.rocAuc], [5, 4, 1]);
  }
  for (const image of ragData.images) await access(new URL(image.path, pagesRoot));
  assert.deepEqual([...new Set(ragData.responses.map((response) => response.productCode))], ["030701", "030705"]);
  for (const response of ragData.responses) {
    assert.ok(response.answer.length > 20);
    assert.equal(Object.hasOwn(response, "retrieved"), false);
    assert.equal(Object.hasOwn(response, "generationSeconds"), false);
    assert.doesNotMatch(response.answer, /依据\s*[:：]/);
    assert.doesNotMatch(response.answer, /(?:TXT|IMG)-[A-Z0-9-]+/);
  }
});

test("keeps intentionally retired evidence pages offline and links to Git history", async () => {
  const detail = await readFile(new URL("security_attacks/030101.html", pagesRoot), "utf8");
  assert.match(detail, /github\.com\/Karlmyh\/DataProductFramework\/tree\/9394efed/);
  assert.doesNotMatch(detail, /href="https:\/\/karlmyh\.github\.io\/DataProductFramework\/first_batch_attack_demo/);
});
