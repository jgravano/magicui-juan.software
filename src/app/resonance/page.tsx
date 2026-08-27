import type { Metadata } from "next";
import Link from "next/link";

import { ResonanceCanvas } from "@/components/experiments/resonance/ResonanceCanvas";

export const metadata: Metadata = {
  title: "Resonance",
  description: "Particles, movement, and sound respond to the cursor.",
};

export default function ResonancePage() {
  return (
    <main className="resonance-page">
      <Link className="site-back" href="/">juan.software</Link>
      <ResonanceCanvas />
      <p className="experience-hint">Click anywhere to enable sound.</p>
    </main>
  );
}
