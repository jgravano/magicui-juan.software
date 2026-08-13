import type { Metadata } from "next";

import { TheOtherSideExperience } from "@/components/experiments/other-side/TheOtherSideExperience";

export const metadata: Metadata = {
  title: "The Other Side · juan.software",
  description: "Open a dark frame and meet your particle double on the other side.",
};

export default function OtherSidePage() {
  return (
    <main className="other-side-page">
      <TheOtherSideExperience />
    </main>
  );
}
