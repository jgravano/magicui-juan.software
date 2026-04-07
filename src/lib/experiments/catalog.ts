export type ExperimentStatus = "live" | "wip" | "draft" | "archive";
export type ExperimentCardStyle = "resonance" | "alma" | "umbral";

export type ExperimentEntry = {
  slug: string;
  title: string;
  teaser: string;
  status: ExperimentStatus;
  tags: string[];
  featured?: boolean;
  order: number;
  accent: string;
  cardStyle: ExperimentCardStyle;
};

export const experimentsCatalog: ExperimentEntry[] = [
  {
    slug: "resonance",
    title: "Resonance",
    teaser: "Dense particles that fracture and recover under your presence.",
    status: "live",
    tags: ["canvas2d", "particles", "tonejs"],
    featured: true,
    order: 10,
    accent: "#9ab4ff",
    cardStyle: "resonance",
  },
  {
    slug: "alma",
    title: "Alma",
    teaser: "A memory chamber made of text, light leaks, and unstable timing.",
    status: "wip",
    tags: ["poetry-engine", "generative-type", "memory"],
    order: 20,
    accent: "#ff9b6a",
    cardStyle: "alma",
  },
  {
    slug: "umbral",
    title: "Umbral",
    teaser: "A brittle threshold where lines split, mirror, and dissolve.",
    status: "draft",
    tags: ["soon"],
    order: 30,
    accent: "#8ee6d0",
    cardStyle: "umbral",
  },
];
