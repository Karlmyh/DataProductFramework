"use client";

import { useEffect, useMemo, useState } from "react";
import { candidateAttacks, demoSuites } from "./demo-data";

export default function DemoLab() {
  const [suiteIndex, setSuiteIndex] = useState(0);
  const [productIndex, setProductIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [runKey, setRunKey] = useState(0);

  const suite = demoSuites[suiteIndex];
  const product = suite.products[productIndex];
  const candidates = candidateAttacks[product.id];
  const applicableCount = candidates.filter((candidate) => candidate.applicable).length;
  const executedCount = candidates.filter((candidate) => candidate.executed).length;
  const aggregate = useMemo(() => {
    const average = product.attacks.reduce((sum, attack) => sum + attack.displayScore, 0) / product.attacks.length;
    const familyMaximums = Object.entries(product.attacks.reduce<Record<string, number>>((vector, attack) => {
      vector[attack.attackFamily] = Math.max(vector[attack.attackFamily] ?? 0, attack.displayScore);
      return vector;
    }, {}));
    const objectVector = Object.entries(product.attacks.reduce<Record<string, number>>((vector, attack) => {
      vector[attack.attackObject] = Math.max(vector[attack.attackObject] ?? 0, attack.displayScore);
      return vector;
    }, {}));
    const maximum = Math.max(...objectVector.map(([, value]) => value));
    return { average: Math.round(average), maximum, familyMaximums, objectVector };
  }, [product]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const reducedTimer = window.setTimeout(() => setPhase(4), 0);
      return () => window.clearTimeout(reducedTimer);
    }
    const timers = [
      window.setTimeout(() => setPhase(1), 180),
      window.setTimeout(() => setPhase(2), 520),
      window.setTimeout(() => setPhase(3), 860),
      window.setTimeout(() => setPhase(4), 1180),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [suiteIndex, productIndex, runKey]);

  const selectSuite = (index: number) => {
    setPhase(0);
    if (index === suiteIndex && productIndex === 0) {
      setRunKey((key) => key + 1);
      return;
    }
    setSuiteIndex(index);
    setProductIndex(0);
  };

  const selectProduct = (index: number) => {
    setPhase(0);
    if (index === productIndex) {
      setRunKey((key) => key + 1);
      return;
    }
    setProductIndex(index);
  };

  const rerun = () => {
    setPhase(0);
    setRunKey((key) => key + 1);
  };

  return (
    <section className="lab-section" id="interactive-demo" aria-labelledby="lab-title">
      <div className="section-heading lab-heading">
        <span className="section-number">03</span>
        <div>
          <p className="section-kicker">INTERACTIVE PRODUCT LAB</p>
          <h2 id="lab-title">多类别产品 · 一站式攻击结果台</h2>
          <p>选择一个业务场景，再切换其中的产品。正常调用会以动画呈现；页面随后自动执行该产品当前匹配到的全部攻击，并比较、聚合结果。</p>
        </div>
      </div>

      <div className="suite-switcher" aria-label="选择多产品演示场景">
        {demoSuites.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={suiteIndex === index}
            className={suiteIndex === index ? "active" : ""}
            onClick={() => selectSuite(index)}
          >
            <span>{item.code}</span>
            <strong>{item.name}</strong>
          </button>
        ))}
      </div>

      <div className="suite-context">
        <span>{suite.code}</span>
        <p>{suite.description}</p>
      </div>

      <div className="product-switcher" aria-label={`${suite.name}产品切换`}>
        {suite.products.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={productIndex === index}
            className={productIndex === index ? "active" : ""}
            onClick={() => selectProduct(index)}
          >
            <span>{item.category}</span>
            <strong>{item.name}</strong>
            <small>{item.family}</small>
          </button>
        ))}
      </div>

      <div className={`product-stage template-${product.template}`}>
        <div className="product-summary">
          <div>
            <span className="category-chip">{product.category} · {product.family}</span>
            <h3>{product.name}</h3>
            <p>{product.tagline}</p>
          </div>
          <a href={`/attacks/${product.category}`}>查看类别边界 ↗</a>
        </div>

        <div className="call-console">
          <div className="request-card">
            <span className="console-label">01 / INPUT · {product.inputLabel}</span>
            <strong>{product.inputValue}</strong>
            <button type="button" onClick={rerun}>
              <span aria-hidden="true">▶</span> {product.callLabel}
            </button>
          </div>

          <div className="flow-track" aria-label="产品调用流程">
            {product.flow.map((step, index) => (
              <div className={phase > index ? "flow-node active" : "flow-node"} key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
                {index < product.flow.length - 1 && <i aria-hidden="true" />}
              </div>
            ))}
          </div>

          <div className={phase >= 3 ? "response-card visible" : "response-card"} aria-live="polite">
            <span className="console-label">03 / OUTPUT · {product.outputLabel}</span>
            <strong>{phase >= 3 ? product.outputValue : "等待产品响应…"}</strong>
            <p>{product.outputDetail}</p>
          </div>
        </div>
      </div>

      <div className={phase >= 4 ? "attack-results visible" : "attack-results"} aria-live="polite">
        <div className="results-head">
          <div>
            <span className="console-label">AUTOMATED EVALUATION</span>
            <h3>{phase >= 4 ? `${product.attacks.length} 种适用攻击已全部完成` : "正在匹配并执行适用攻击…"}</h3>
            <p>攻击过程只保留一句话说明，重点比较最终泄露结果；匹配覆盖率、排除原因与证据范围均可核对。</p>
          </div>
          <span className="scope-note">受控、离线、虚构产品数据</span>
        </div>

        {phase < 4 ? (
          <div className="attack-loading" role="status">
            <span>正在冻结权限、先验与查询预算</span>
            <i /><i /><i />
          </div>
        ) : (
          <>
            <div className="attack-coverage">
              <div><strong>{candidates.length}</strong><span>候选攻击</span></div>
              <div><strong>{applicableCount}</strong><span>条件适用</span></div>
              <div><strong>{executedCount}</strong><span>已执行</span></div>
              <p><b>{executedCount === applicableCount ? "全部适用攻击均已执行" : "仍有适用攻击待执行"}</b><span>统计由下方逐项候选清单生成。</span></p>
            </div>

            <ul className="candidate-list" aria-label="候选攻击适用性与执行清单">
              {candidates.map((candidate) => (
                <li key={candidate.id} className={candidate.executed ? "executed" : "excluded"}>
                  <span>{candidate.executed ? "已执行" : "已排除"}</span>
                  <strong>{candidate.name}</strong>
                  <p>{candidate.reason}</p>
                </li>
              ))}
            </ul>

            <div className="attack-grid">
              {product.attacks.map((attack, index) => (
                <article className="attack-card" key={`${runKey}-${product.id}-${attack.id}`} style={{ transitionDelay: `${index * 90}ms` }}>
                  <header>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>{attack.evidence} · {attack.attackFamily} / {attack.attackObject}</small>
                  </header>
                  <h4>{attack.name}</h4>
                  <p className="attack-brief">{attack.brief}</p>
                  <p className="attack-outcome">{attack.result}</p>
                  <div className="attack-metric">
                    <span>{attack.metric}</span>
                    <strong>{attack.value}</strong>
                  </div>
                  <div className="risk-bar" aria-label={`展示性结果强度 ${attack.displayScore} 分`}>
                    <i style={{ width: `${attack.displayScore}%` }} />
                  </div>
                  <small className="risk-number">展示性结果强度 {attack.displayScore} / 100</small>
                  <details className="evidence-trace">
                    <summary>证据范围与限制</summary>
                    <p><b>来源</b>{attack.source}</p>
                    <p><b>协议</b>{attack.protocol}</p>
                    <p><b>限制</b>{attack.limitation}</p>
                  </details>
                </article>
              ))}
            </div>

            <div className="aggregate-panel">
              <div className="aggregate-title">
                <span>PRODUCT RESULT VECTOR / 聚合结论</span>
                <h3>{product.name}</h3>
                <p>先在攻击家族内取最大值，再按攻击对象保留完整向量；产品主结论取对象向量最大值，平均值只作辅助。本页强度用于互动比较，尚未配置 R₀、R* 与损失曲线，不等同正式隐私损失。</p>
              </div>
              <div className="aggregate-metrics">
                <div><span>平均结果强度</span><strong>{aggregate.average}</strong><small>辅助统计</small></div>
                <div className="result-primary"><span>最高结果强度</span><strong>{aggregate.maximum}</strong><small>当前主结论</small></div>
                <div><span>正式隐私损失</span><strong>—</strong><small>待校准</small></div>
              </div>
              <div className="comparison-chart" aria-label="攻击结果横向比较">
            {product.attacks.map((attack) => (
              <div className="comparison-row" key={attack.id}>
                <span>{attack.name}</span>
                <div><i style={{ width: `${attack.displayScore}%` }} /></div>
                <strong>{attack.displayScore}</strong>
              </div>
            ))}
              </div>
              <div className="aggregation-audit" aria-label="攻击家族与攻击对象聚合审计">
                <div>
                  <span>01 / 攻击家族最大值</span>
                  <ul>{aggregate.familyMaximums.map(([label, value]) => <li key={label}><b>{label}</b><strong>{value}</strong></li>)}</ul>
                </div>
                <div>
                  <span>02 / 攻击对象结果向量</span>
                  <ul>{aggregate.objectVector.map(([label, value]) => <li key={label}><b>{label}</b><strong>{value}</strong></li>)}</ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
