import type { Metadata } from "next";
import NotFoundExperience from "./not-found-experience";

export const metadata: Metadata = {
  title: "404",
  description: "Página no encontrada en juan.software.",
};

export default function NotFound() {
  return <NotFoundExperience />;
}
