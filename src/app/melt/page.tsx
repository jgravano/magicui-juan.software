import type { Metadata } from "next";

import { MeltExperience } from "@/components/experiments/melt/MeltExperience";

export const metadata: Metadata = {
  title: "Melt · juan.software",
  description: "Teach the mirror your room, then melt out of it.",
};

export default function MeltPage() {
  return (
    <main className="melt-page">
      <MeltExperience />
    </main>
  );
}
