import type { Metadata } from "next";
import Link from "next/link";

import { MirrorExperience } from "@/components/experiments/mirror/MirrorExperience";

export const metadata: Metadata = {
  title: "Mirror",
  description: "A live camera image rendered in liquid chrome and particles.",
};

export default function MirrorPage() {
  return (
    <main className="mirror-page">
      <Link className="site-back" href="/">juan.software</Link>
      <MirrorExperience />
    </main>
  );
}
