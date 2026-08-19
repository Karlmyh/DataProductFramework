import DemoLab from "./demo-lab";
import { groups, series } from "./data";
import type { CSSProperties } from "react";

const frameworkSteps = [
  {
    index: "01",
    title: "产品表示",
    headline: "先确定交付的是什么",
    body: "把平台拆成可独立调用的原子产品，用“产品类别＋交付方式＋可见输出＋保护边界”形成统一画像。",
    output: "产品画像",
  },
  {
    index: "02",
    title: "攻击匹配",
    headline: "再测试所有适用攻击",
    body: "根据攻击者可控输入、可见输出、先验与预算匹配候选方法；适用的全部执行，不适用的记录原因。",
    output: "攻击结果集",
  },
  {
    index: "03",
    title: "统一衡量",
    headline: "让不同结果可以比较",
    body: "保留 AUC、恢复率、一致率等原始指标，再用零信息基线与完全风险参考校准为 0—100 隐私损失。",
    output: "统一风险分",
  },
  {
    index: "04",
    title: "风险聚合",
    headline: "主结论取最大，结果向量保留",
    body: "同层按最大隐私损失形成产品主结论，同时保留各攻击对象的结果向量；平均值只作为辅助描述。",
    output: "产品综合结论",
  },
];

export default function Home() {
  const categoryCount = groups.reduce((sum, group) => sum + group.categories.length, 0);

  return (
    <main>
      <header className="site-header" id="top">
        <div className="eyebrow-row">
          <span>DATA PRODUCT PRIVACY LAB · 2026</span>
          <span>衡量 / 决策 / 优化</span>
        </div>
        <p className="hero-kicker">产品化隐私风险演示与统一衡量</p>
        <h1>数据产品<br />安全衡量框架</h1>
        <p className="lead">
          从产品实际交付的结果出发，识别可见接口，匹配所有适用攻击，
          再把不同攻击结果汇总成可比较、可解释的产品风险结论。
        </p>
        <div className="framework-strip" aria-label="衡量框架的四个环节">
          {frameworkSteps.map((step) => (
            <div key={step.index}>
              <span>{step.index}</span>
              <strong>{step.title}</strong>
              <p>{step.output}</p>
            </div>
          ))}
        </div>
        <nav className="hero-nav" aria-label="页面目录">
          <a className="hero-cta" href="#framework">查看衡量流程 <span aria-hidden="true">↓</span></a>
          <a href="#interactive-demo">直接进入 Demo</a>
        </nav>
      </header>

      <section className="section-block framework-section" id="framework">
        <div className="section-heading">
          <span className="section-number">01</span>
          <div>
            <p className="section-kicker">MEASUREMENT FRAMEWORK</p>
            <h2>从产品调用到风险结论</h2>
            <p>页面内容严格按“表示—匹配—衡量—聚合”的主链组织；Demo 也完整复现同一条链路。</p>
          </div>
        </div>
        <div className="framework-grid">
          {frameworkSteps.map((step, index) => (
            <article key={step.index}>
              <header><span>{step.index}</span><small>{step.title}</small></header>
              <h3>{step.headline}</h3>
              <p>{step.body}</p>
              <footer><span>输出</span><strong>{step.output}</strong></footer>
              {index < frameworkSteps.length - 1 && <i aria-hidden="true">→</i>}
            </article>
          ))}
        </div>
        <div className="framework-formula">
          <span>摘要聚合口径</span>
          <strong>产品主结论 = max（各攻击对象隐私损失），并保留完整结果向量</strong>
          <p>Demo 中未完成正式损失曲线配置的数字只标为“展示性结果强度”；平均值仅作辅助。</p>
        </div>
      </section>

      <section id="taxonomy" className="section-block taxonomy-section">
        <div className="section-heading">
          <span className="section-number">02</span>
          <div>
            <p className="section-kicker">UPDATED PRODUCT TAXONOMY</p>
            <h2>当前覆盖的五个产品类别</h2>
            <p>已按最新《数据产品隐私衡量项目摘要》更新：5 个二级类别、{categoryCount} 个三级类别。原“数据查询类”并入 0301 行业基础数据库；模型类改为按最终任务与输出划分；新增 0309 梯度类。</p>
          </div>
        </div>

        <div className="taxonomy-overview" aria-label="数据资源产品分类概览">
          <div className="taxonomy-root">
            <span>03</span>
            <strong>数据资源产品</strong>
            <small>当前框架覆盖范围</small>
          </div>
          <div className="taxonomy-line" aria-hidden="true" />
          <div className="taxonomy-groups">
            {groups.map((group) => (
              <article className="taxonomy-card" key={group.code} style={{ "--group-accent": group.accent } as CSSProperties}>
                <header>
                  <span>{group.code}</span>
                  <small>{group.categories.length} 个三级类别</small>
                </header>
                <h3>{group.name}</h3>
                <p>{group.summary}</p>
                <ol>
                  {group.categories.map((category) => (
                    <li key={category.code}>
                      <a href={`/attacks/${category.code}`}>
                        <span>{category.code}</span>
                        <strong>{category.name}</strong>
                        <i aria-hidden="true">↗</i>
                      </a>
                      <small>{category.attacks.slice(0, 2).join(" · ")}</small>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <DemoLab />

      <section id="existing" className="section-block evidence-section">
        <div className="section-heading">
          <span className="section-number">04</span>
          <div>
            <p className="section-kicker">EXISTING EVIDENCE</p>
            <h2>已完成内容与本页复用方式</h2>
            <p>已有实验继续作为“已有实测”；新增产品使用“机制验证”或“受控演示”标识，并补充来源、协议与限制，避免把演示数字误写成真实业务结论。</p>
          </div>
        </div>
        <div className="evidence-summary">
          <div><strong>3</strong><span>现有实测系列</span></div>
          <div><strong>5</strong><span>更新后二级类别</span></div>
          <div><strong>3</strong><span>多类别场景 Demo</span></div>
          <div><strong>17</strong><span>可切换产品</span></div>
        </div>
        <div className="series-list">
          {series.map((item) => (
            <a className="series-row" href={item.href} target="_blank" rel="noreferrer" key={item.index}>
              <span className="series-index">{item.index}</span>
              <span className="series-main"><strong>{item.title}</strong><small>{item.scope}</small></span>
              <span className="series-attacks">{item.attacks}</span>
              <span className="series-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section-block reading-guide" id="guide">
        <div className="section-heading">
          <span className="section-number">05</span>
          <div>
            <p className="section-kicker">HOW TO READ</p>
            <h2>如何理解页面中的结果</h2>
          </div>
        </div>
        <div className="guide-grid">
          <article><span>已有实测</span><h3>来自现有固定实验结果</h3><p>直接复用仓库中已有的查询预算、恢复率、相似度或泄露率，并在 Demo 中标出来源层级。</p></article>
          <article><span>机制验证</span><h3>攻击机制已实现或已有入口</h3><p>说明该类风险有实际代码或复现路径，但当前场景数字仍是受控适配，不外推到真实产品。</p></article>
          <article><span>受控演示</span><h3>用于展示比较与聚合逻辑</h3><p>数字是虚构产品的展示性结果强度，不是归一隐私损失；真实产品必须配置基线、参考点与损失曲线后复测。</p></article>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <span>DATA PRODUCT PRIVACY LAB</span>
          <strong>数据产品安全衡量框架</strong>
        </div>
        <p>研究用途 · 受控攻击 · 不连接真实业务系统</p>
        <a href="#top">回到页首 ↑</a>
      </footer>
    </main>
  );
}
