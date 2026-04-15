export type ExperimentStatus = "live" | "wip" | "draft" | "archive";
export type ExperimentCardStyle = "resonance" | "mirror" | "alma" | "umbral";

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
    slug: "mirror",
    title: "Mirror",
    teaser: "A persistent mirror that shifts between liquid chrome and human particles.",
    status: "live",
    tags: ["camera", "segmentation", "mirror"],
    order: 20,
    accent: "#c9d0de",
    cardStyle: "mirror",
  },
  {
    slug: "alma",
    title: "Alma",
    teaser: "A memory chamber made of text, light leaks, and unstable timing.",
    status: "wip",
    tags: ["poetry-engine", "generative-type", "memory"],
    order: 30,
    accent: "#ff9b6a",
    cardStyle: "alma",
  },
  {
    slug: "umbral",
    title: "Umbral",
    teaser: "A brittle threshold where lines split, mirror, and dissolve.",
    status: "draft",
    tags: ["soon"],
    order: 40,
    accent: "#8ee6d0",
    cardStyle: "umbral",
  },
];
