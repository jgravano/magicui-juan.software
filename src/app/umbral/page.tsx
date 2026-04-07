import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Umbral · juan.software",
  description: "Draft experiment.",
};

export default function UmbralPage() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 76% 18%, rgba(142, 230, 208, 0.14), transparent 40%), #050505",
        color: "rgba(255,255,255,0.84)",
        fontFamily: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
      }}
    >
      <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
        umbral · soon
      </p>
    </main>
  );
}
