import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alma · juan.software",
  description: "Work in progress experiment.",
};

export default function AlmaPage() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 24% 16%, rgba(255, 162, 117, 0.16), transparent 42%), #050505",
        color: "rgba(255,255,255,0.84)",
        fontFamily: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
      }}
    >
      <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
        alma · wip
      </p>
    </main>
  );
}
