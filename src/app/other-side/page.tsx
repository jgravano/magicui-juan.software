import type { Metadata } from "next";
import Link from "next/link";

import { TheOtherSideExperience } from "@/components/experiments/other-side/TheOtherSideExperience";

export const metadata: Metadata = {
  title: "The Other Side",
  description: "Hand tracking opens a frame to a particle self-portrait.",
};

export default function OtherSidePage() {
  return (
    <main className="other-side-page">
      <Link className="site-back" href="/">juan.software</Link>
      <TheOtherSideExperience />
    </main>
  );
}
