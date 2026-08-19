import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { categories, groups } from "../app/data.ts";
import { candidateAttacks, demoSuites } from "../app/demo-data.ts";

const pagesRoot = new URL("../github-pages/", import.meta.url);

test("exports the complete taxonomy and static category pages", async () => {
  const html = await readFile(new URL("index.html", pagesRoot), "utf8");
  assert.equal(groups.length, 5);
  assert.equal(categories.length, 18);
  for (const group of groups) assert.match(html, new RegExp(group.code));
  for (const category of categories) {
    assert.match(html, new RegExp(`security_attacks/${category.code}\\.html`));
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
  assert.match(script, /产品调用演示/);
  assert.match(script, /隐私攻击演示/);
  assert.match(script, /data-start-attack/);
});

test("uses GitHub Pages-relative assets and includes social metadata", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("index.html", pagesRoot), "utf8"),
    readFile(new URL("security_attacks/styles.css", pagesRoot), "utf8"),
  ]);
  assert.match(html, /src="privacy-lab\.js"/);
  assert.match(html, /href="security_attacks\/styles\.css"/);
  assert.doesNotMatch(html, /chatgpt\.site/);
  assert.doesNotMatch(html, /href="\/attacks\//);
  assert.doesNotMatch(css, /@import\s+"tailwindcss"/);
});

test("keeps intentionally retired evidence pages offline and links to Git history", async () => {
  const detail = await readFile(new URL("security_attacks/030101.html", pagesRoot), "utf8");
  assert.match(detail, /github\.com\/Karlmyh\/DataProductFramework\/tree\/9394efed/);
  assert.doesNotMatch(detail, /href="https:\/\/karlmyh\.github\.io\/DataProductFramework\/first_batch_attack_demo/);
});
