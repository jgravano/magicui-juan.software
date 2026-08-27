import Link from "next/link";

import { experimentsCatalog } from "@/lib/experiments/catalog";

export default function HomePage() {
  const sortedExperiments = [...experimentsCatalog].sort((a, b) => a.order - b.order);

  return (
    <main className="experiments-home">
      <header className="site-header">
        <h1 className="site-wordmark">juan.software</h1>
        <p>Selected work</p>
      </header>
      <ol className="experiments-index" aria-label="Selected work">
        {sortedExperiments.map((experiment, index) => {
          return (
            <li key={experiment.slug}>
              <Link href={`/${experiment.slug}`} className="experiment-row">
                <span className="experiment-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{experiment.title}</h2>
                <p>{experiment.description}</p>
                <span className="experiment-arrow" aria-hidden="true">↗</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
