import type { Metadata } from "next";
import Link from "next/link";

import { SmileyExperience } from "@/components/experiments/smiley/SmileyExperience";

import styles from "./smiley.module.css";

export const metadata: Metadata = {
  title: "Smiley",
  description: "A soft object for the browser.",
};

export default function SmileyPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">juan.software</Link>
      <SmileyExperience />
    </main>
  );
}
