import type { Metadata } from "next";

import { MirrorExperience } from "@/components/experiments/mirror/MirrorExperience";

export const metadata: Metadata = {
  title: "Mirror · juan.software",
  description: "Reflective object study: object-first mirror with phased material iteration.",
};

export default function MirrorPage() {
  return (
    <main className="mirror-page">
      <MirrorExperience />
    </main>
  );
}
