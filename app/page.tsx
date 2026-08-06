import { groups, series } from "./data";

export default function Home() {
  return (
    <main>
      <header className="site-header" id="top">
        <div className="eyebrow-row">
          <span>DATA PRODUCT SECURITY FRAMEWORK</span>
          <span>分类 · 攻击 · 衡量</span>
        </div>
        <h1>专业数据产品<br />安全衡量框架</h1>
        <p className="lead">
          这是一套从“产品交付了什么”出发的数据安全分析框架：先把专业数据产品归入三级分类，
          再为每个二级类别识别其可见接口、潜在隐私暴露与适用攻击，最后用统一指标衡量真实风险。
        </p>
        <div className="intro-grid" aria-label="框架的三个环节">
          <div><span>01</span><strong>先判产品</strong><p>依据核心交付结果，而不是后台技术或行业名称分类。</p></div>
          <div><span>02</span><strong>再选攻击</strong><p>从攻击者可控输入、可见输出和查询预算确定测试方法。</p></div>
          <div><span>03</span><strong>最后衡量</strong><p>把推断、重建、抽取与绕过效果放到可比较的风险尺度。</p></div>
        </div>
        <nav className="jump-nav" aria-label="页面目录">
          <a href="#taxonomy">三级分类树</a>
          <a href="#series">产品与攻击系列</a>
          <a href="#use">使用方法</a>
        </nav>
      </header>

      <section id="taxonomy" className="section-block taxonomy-section">
        <div className="section-heading">
          <span className="section-number">01</span>
          <div>
            <h2>专业数据产品三级分类树</h2>
            <p>点击任一二级类别，进入对应的攻击页面；三级类别用于确定更具体的产品边界。</p>
          </div>
        </div>

        <figure className="taxonomy-tree" aria-labelledby="taxonomy-title">
          <figcaption id="taxonomy-title">专业数据产品</figcaption>
          <div className="tree-trunk" aria-hidden="true" />
          <div className="tree-groups">
            {groups.map((group) => (
              <article className="tree-group" key={group.code}>
                <div className="group-heading">
                  <span>{group.code}</span>
                  <h3>{group.name}</h3>
                  <p>{group.summary}</p>
                </div>
                <ol>
                  {group.categories.map((category) => (
                    <li key={category.code}>
                      <a className="category-link" href={"/attacks/" + category.code}>
                        <span>{category.code}</span>
                        <strong>{category.name}</strong>
                        <span className="link-arrow" aria-hidden="true">↗</span>
                      </a>
                      <p>{category.children.map((item) => item.replace(/^\d+\s/, "")).join("；")}</p>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </figure>
      </section>

      <section id="series" className="section-block">
        <div className="section-heading">
          <span className="section-number">02</span>
          <div>
            <h2>现有产品与攻击系列</h2>
            <p>分类树回答“它是什么”，下面的系列回答“现在有哪些可直接查看的攻击与评估”。</p>
          </div>
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

      <section id="use" className="section-block use-section">
        <div className="section-heading">
          <span className="section-number">03</span>
          <div>
            <h2>如何使用这套框架</h2>
            <p>从一个真实产品出发，三步得到可执行的安全评估入口。</p>
          </div>
        </div>
        <ol className="use-list">
          <li><span>1</span><div><strong>判定核心交付</strong><p>忽略后台是否使用数据库或模型，先看购买方最终得到的是核验状态、指标、查询结果还是模型能力。</p></div></li>
          <li><span>2</span><div><strong>落到二级类别</strong><p>根据对象数量、结果数学语义、查询响应形式或生产数据所处环节，选定唯一主类。</p></div></li>
          <li><span>3</span><div><strong>进入攻击页面</strong><p>结合可控输入、可见输出、知识假设与查询预算，选择攻击并记录统一风险指标。</p></div></li>
        </ol>
      </section>

      <footer className="site-footer">
        <p>专业数据产品安全衡量框架</p>
        <p>
          分类依据与完整判定规则见{" "}
          <a href="https://karlmyh.github.io/DataProductFramework/product_taxonomy.html" target="_blank" rel="noreferrer">
            数据产品分类目录 ↗
          </a>
        </p>
        <a href="#top">回到页首 ↑</a>
      </footer>
    </main>
  );
}
