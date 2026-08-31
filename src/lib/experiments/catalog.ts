export type ExperimentEntry = {
  slug: string;
  title: string;
  description: string;
  order: number;
  landing: {
    href: string;
    className: string;
    image: string;
    external?: boolean;
  };
};

export const experimentsCatalog: ExperimentEntry[] = [
  {
    slug: "resonance",
    title: "Resonance",
    description: "Particles, movement, and sound respond to the cursor.",
    order: 10,
    landing: {
      href: "/resonance",
      className: "project--resonance",
      image: "/objects/resonance-engraving-v2.webp",
    },
  },
  {
    slug: "lupa",
    title: "Lupa",
    description: "A magnifying lens for exploring a Spanish dictionary.",
    order: 15,
    landing: {
      href: "/lupa",
      className: "project--lupa",
      image: "/objects/lupa-manifesto-canvas-v2.png",
    },
  },
  {
    slug: "mirror",
    title: "Mirror",
    description: "A live camera image rendered in liquid chrome and particles.",
    order: 20,
    landing: {
      href: "/mirror",
      className: "project--mirror",
      image: "/objects/mirror-chrome-blot-v2.png",
    },
  },
  {
    slug: "other-side",
    title: "The Other Side",
    description: "Hand tracking opens a frame to a particle self-portrait.",
    order: 25,
    landing: {
      href: "/other-side",
      className: "project--other-side",
      image: "/objects/other-side.webp",
    },
  },
  {
    slug: "notouchweb",
    title: "NoTouchWeb",
    description: "Tools and experiments for the web beyond touch.",
    order: 30,
    landing: {
      href: "https://notouchweb.com",
      className: "project--notouch",
      image: "/objects/notouch-hands.webp",
      external: true,
    },
  },
  {
    slug: "smiley",
    title: "Smiley",
    description: "A soft object for the browser.",
    order: 28,
    landing: {
      href: "/smiley",
      className: "project--smiley",
      image: "/favicon.png",
    },
  },
];
