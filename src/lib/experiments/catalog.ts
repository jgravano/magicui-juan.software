export type ExperimentEntry = {
  slug: string;
  title: string;
  description: string;
  order: number;
};

export const experimentsCatalog: ExperimentEntry[] = [
  {
    slug: "resonance",
    title: "Resonance",
    description: "Particles, movement, and sound respond to the cursor.",
    order: 10,
  },
  {
    slug: "lupa",
    title: "Lupa",
    description: "A magnifying lens for exploring a Spanish dictionary.",
    order: 15,
  },
  {
    slug: "mirror",
    title: "Mirror",
    description: "A live camera image rendered in liquid chrome and particles.",
    order: 20,
  },
  {
    slug: "other-side",
    title: "The Other Side",
    description: "Hand tracking opens a frame to a particle self-portrait.",
    order: 25,
  },
  {
    slug: "smiley",
    title: "Smiley",
    description: "A soft object for the browser.",
    order: 30,
  },
];
