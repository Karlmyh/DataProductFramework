import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/", headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html", ...headers } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the measurement framework and updated product taxonomy", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /数据产品安全衡量框架/);
  assert.match(html, /产品表示/);
  assert.match(html, /攻击匹配/);
  assert.match(html, /统一衡量/);
  assert.match(html, /风险聚合/);

  for (const category of [
    "0301",
    "行业基础数据库类数据产品",
    "0304",
    "核验类数据产品",
    "0305",
    "指标型数据产品",
    "0307",
    "模型类数据产品",
    "0309",
    "梯度类数据产品",
  ]) assert.match(html, new RegExp(category));

  assert.doesNotMatch(html, /0306 数据查询类/);
  assert.doesNotMatch(html, /codex-preview|Building your site|Starter Project/i);
});

test("server-renders all four multi-product demos and aggregation language", async () => {
  const html = await (await render()).text();
  for (const suite of ["金融数据协作中心", "城市公共服务平台", "智能内容服务台", "模型攻击实测实验室"]) {
    assert.match(html, new RegExp(suite));
  }
  assert.match(html, /19/);
  assert.match(html, /匹配到的全部攻击/);
  assert.match(html, /主结论 = max/);
  assert.match(html, /完整结果向量/);
  assert.match(html, /展示性结果强度/);
  assert.match(html, /不是归一隐私损失/);
  assert.match(html, /已有实测/);
  assert.match(html, /机制验证/);
  assert.match(html, /受控演示/);
});

test("renders representative category detail routes with route-specific metadata", async () => {
  for (const [path, title, attack] of [
    ["/attacks/030101", "存在性查询", "自适应群组测试"],
    ["/attacks/030705", "多模态综合模型服务", "多模态提示注入"],
    ["/attacks/030901", "梯度类数据产品", "梯度重建"],
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(title));
    assert.match(html, new RegExp(attack));
    assert.match(html, new RegExp(`<title>${title === "梯度类数据产品" ? "030901 梯度类数据产品" : path.slice(-6) + " " + title}攻击`));
    assert.doesNotMatch(html, /og\.png/);
  }
});

test("returns a real 404 for unknown category codes", async () => {
  const response = await render("/attacks/not-real");
  assert.equal(response.status, 404);
});

test("falls back safely when a forwarded host contains an invalid port", async () => {
  const response = await render("/", { "x-forwarded-host": "safe.example:65536" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>数据产品安全衡量框架<\/title>/);
  assert.match(html, /og-privacy-lab\.png/);
});

test("source keeps the product-switch interaction and accessible state", async () => {
  const [lab, data] = await Promise.all([
    readFile(new URL("../app/demo-lab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/demo-data.ts", import.meta.url), "utf8"),
  ]);
  assert.match(lab, /aria-pressed/);
  assert.doesNotMatch(lab, /role="tab(list)?"/);
  assert.match(lab, /aria-live="polite"/);
  assert.match(lab, /product\.attacks\.map/);
  assert.match(lab, /Math\.max/);
  assert.match(lab, /candidateAttacks/);
  assert.match(lab, /objectVector/);
  assert.match(lab, /familyMaximums/);
  assert.match(data, /applicable: boolean/);
  assert.match(data, /attackFamily/);
  assert.match(data, /人脸身份图片预测模型/);
  assert.match(data, /联邦图像训练更新交付/);
  assert.match(data, /Top-5 68%/);
  assert.match(data, /PSNR 20\.56 dB/);
  assert.doesNotMatch(lab, /average \* 0\.4 \+ maximum \* 0\.6/);
  assert.equal((data.match(/id: "(finance|city|content|experiment)-/g) ?? []).length, 19);
});
