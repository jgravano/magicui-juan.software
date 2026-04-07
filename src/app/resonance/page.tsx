import type { Metadata } from "next";

import { ResonanceCanvas } from "@/components/experiments/resonance/ResonanceCanvas";

export const metadata: Metadata = {
  title: "Resonance · juan.software",
  description: "Interactive particle system with reactive audio.",
};

export default function ResonancePage() {
  return (
    <main className="resonance-page">
      <ResonanceCanvas />
      <p className="resonance-label">resonance · click for sound</p>
    </main>
  );
}
