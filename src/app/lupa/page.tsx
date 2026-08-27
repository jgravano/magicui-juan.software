import type { Metadata } from "next";
import Link from "next/link";

import { LupaExperience } from "@/components/lupa/LupaExperience";

export const metadata: Metadata = {
  title: "Lupa",
  description: "A magnifying lens for exploring a Spanish dictionary.",
};

export default function LupaPage() {
  return (
    <main className="lupa-page">
      <Link className="site-back" href="/">juan.software</Link>
      <LupaExperience />
    </main>
  );
}
