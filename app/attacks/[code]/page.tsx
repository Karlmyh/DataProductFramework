import type { Metadata } from "next";
import { categories, findCategory } from "../../data";

type PageProps = { params: Promise<{ code: string }> };

export function generateStaticParams() {
  return categories.map((category) => ({ code: category.code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const category = findCategory(code);
  return category
    ? { title: category.code + " " + category.name + "攻击", description: category.exposure }
    : { title: "攻击类别未找到" };
}

export default async function AttackPage({ params }: PageProps) {
  const { code } = await params;
  const category = findCategory(code);

  if (!category) {
    return (
      <main className="detail-main">
        <header className="detail-header">
          <a href="/">← 返回分类树</a>
          <h1>未找到该类别</h1>
        </header>
      </main>
    );
  }

  const currentIndex = categories.findIndex((item) => item.code === code);
  const previous = categories[(currentIndex - 1 + categories.length) % categories.length];
  const next = categories[(currentIndex + 1) % categories.length];

  return (
    <main className="detail-main">
      <header className="detail-header">
        <nav className="breadcrumbs" aria-label="面包屑">
          <a href="/">分类树</a><span>/</span>
          <span>{category.group.code} {category.group.name}</span><span>/</span>
          <strong>{category.code}</strong>
        </nav>
        <span className="category-code">ATTACK SURFACE · {category.code}</span>
        <h1>{category.name}<br />攻击页面</h1>
        <p className="lead">{category.definition}</p>
      </header>

      <section className="detail-section">
        <h2>攻击面判定</h2>
        <div className="facts-grid">
          <div className="fact"><span>核心交付</span><p>{category.definition}</p></div>
          <div className="fact"><span>主要暴露</span><p>{category.exposure}</p></div>
          <div className="fact"><span>分类边界</span><p>{category.boundary}</p></div>
        </div>
      </section>

      <section className="detail-section detail-columns">
        <div>
          <h2>三级产品分支</h2>
          <ol className="numbered-list">
            {category.children.map((child) => <li key={child}>{child}</li>)}
          </ol>
        </div>
        <div>
          <h2>主要攻击</h2>
          <ol className="attack-list">
            {category.attacks.map((attack, index) => (
              <li key={attack}><span>{String(index + 1).padStart(2, "0")}</span><strong>{attack}</strong></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="detail-section">
        <h2>攻击文档与实验入口</h2>
        <div className="reference-list">
          {category.links.map((link) => (
            <a className="reference-link" href={link.href} target="_blank" rel="noreferrer" key={link.href}>
              <strong>{link.label}</strong><span>{link.note}</span><b aria-hidden="true">↗</b>
            </a>
          ))}
        </div>
      </section>

      <nav className="detail-nav" aria-label="相邻类别">
        <a href={"/attacks/" + previous.code}><small>← 上一个类别</small><strong>{previous.code} {previous.name}</strong></a>
        <a href={"/attacks/" + next.code}><small>下一个类别 →</small><strong>{next.code} {next.name}</strong></a>
      </nav>
    </main>
  );
}
