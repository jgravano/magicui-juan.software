import type { Metadata } from "next";

import { LupaExperience } from "@/components/lupa/LupaExperience";

export const metadata: Metadata = {
  title: "Lupa · juan.software",
  description: "Interactive optical study over a typographic dictionary surface.",
};

export default function LupaPage() {
  return (
    <main className="lupa-page">
      <LupaExperience />
    </main>
  );
}
