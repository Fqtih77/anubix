import Link from "next/link";

const plannedFeatures = [
  { number: "01", title: "Portföy", detail: "CV, projeler ve bağlantılar" },
  { number: "02", title: "Kişisel alan", detail: "Planlayıcı, notlar ve takvim" },
  { number: "03", title: "Asistan", detail: "Yerel LLM ile iş akışları" },
];

export default function Home() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Anubix ana sayfa">anubix<span>.</span></Link>
        <span className="status"><span className="status-dot" /> Geliştirme aşamasında</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">KİŞİSEL DİJİTAL ALAN / 2026</p>
        <h1 id="hero-title">Bir fikirden,<br /><em>kendi alanıma.</em></h1>
        <p className="intro">
          Anubix; projelerimi, öğrendiklerimi ve günlük araçlarımı tek bir yerde
          buluşturmak için geliştirdiğim açık kaynaklı kişisel platform.
        </p>
        <a className="primary-link" href="https://github.com/Fqtih77/anubix" target="_blank" rel="noreferrer">
          GitHub&apos;da incele <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="roadmap" aria-labelledby="roadmap-title">
        <div className="section-heading">
          <p className="eyebrow">YOL HARİTASI</p>
          <h2 id="roadmap-title">Adım adım gelişiyor.</h2>
        </div>
        <div className="feature-grid">
          {plannedFeatures.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.detail}</p>
              <span className="feature-tag">Planlandı</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Anubix</span>
        <span>Öğrenerek, parça parça inşa ediliyor.</span>
      </footer>
    </main>
  );
}
