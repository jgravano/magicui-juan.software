import { experimentsCatalog, type ExperimentEntry } from "@/lib/experiments/catalog";

function ProjectObject({ experiment }: { experiment: ExperimentEntry }) {
  const { landing } = experiment;
  const isLupa = experiment.slug === "lupa";

  return (
    <a
      className={`project ${landing.className}`}
      href={landing.href}
      target={landing.external ? "_blank" : undefined}
      rel={landing.external ? "noreferrer" : undefined}
      aria-label={`${experiment.title} — open project`}
    >
      <div className="project-object">
        {isLupa ? (
          <>
            <span className="lupa-manifesto" aria-hidden="true">
              <span>the web is not a feed.</span>
              <span>software should leave a trace.</span>
              <span>useful things can still be strange.</span>
              <span>build for curiosity, not capture.</span>
            </span>
            <img
              className="object-image lupa-photo-layer lupa-photo-layer--lens"
              src={landing.image}
              alt=""
              draggable="false"
            />
            <img
              className="object-image lupa-photo-layer lupa-photo-layer--handle"
              src={landing.image}
              alt=""
              draggable="false"
            />
          </>
        ) : (
          <img className="object-image" src={landing.image} alt="" draggable="false" />
        )}
        <span className="project-hitbox" aria-hidden="true" />
      </div>
      <span className="project-tag" aria-hidden="true">
        {experiment.title.toLowerCase()}
      </span>
    </a>
  );
}

export default function HomePage() {
  const sortedExperiments = [...experimentsCatalog].sort((a, b) => a.order - b.order);

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="juan.software, home">
          juan.software
        </a>

        <nav aria-label="Contact and social links">
          <a href="mailto:juan@notouchweb.com">juan@notouchweb.com</a>
          <a href="https://github.com/jgravano" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <section id="top" className="object-stage" aria-label="Selected projects">
        <div className="composition">
          {sortedExperiments.map((experiment) => (
            <ProjectObject key={experiment.slug} experiment={experiment} />
          ))}
        </div>
      </section>

      <footer>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
