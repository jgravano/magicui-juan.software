import Link from "next/link";
import type { CSSProperties } from "react";

import { experimentsCatalog } from "@/lib/experiments/catalog";

const statusLabelMap = {
  live: "LIVE",
  wip: "WIP",
  draft: "DRAFT",
  archive: "ARCHIVE",
} as const;

export default function HomePage() {
  const sortedExperiments = [...experimentsCatalog].sort((a, b) => a.order - b.order);

  return (
    <main className="experiments-home">
      <section className="experiments-rail" aria-label="Experiments">
        {sortedExperiments.map((experiment, index) => {
          const panelStyle = {
            "--experiment-accent": experiment.accent,
          } as CSSProperties;

          return (
            <Link
              key={experiment.slug}
              href={`/${experiment.slug}`}
              className="experiment-panel"
              style={panelStyle}
              data-card-style={experiment.cardStyle}
              aria-label={`Open ${experiment.title}`}
            >
              <div className="experiment-panel__head">
                <span className="status-pill">{statusLabelMap[experiment.status]}</span>
              </div>
              <h1 className="experiment-panel__name">
                {index + 1}. {experiment.slug}
              </h1>
              <p className="experiment-panel__teaser">{experiment.teaser}</p>
              <p className="experiment-panel__tags">{experiment.tags.join(" · ")}</p>
            </Link>
          );
        })}
      </section>
      <p className="experiments-scroll-hint" aria-hidden="true">
        scroll →
      </p>
    </main>
  );
}
