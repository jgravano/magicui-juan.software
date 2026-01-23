import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Statement } from "@/components/statement"
import { Projects } from "@/components/projects"
import { Principles } from "@/components/principles"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-background scroll-smooth">
        <Header />
        <Hero />
        <Statement />
        <Projects />
        <Principles />
        <Contact />
        <Footer />
      </main>
    </>
  )
}
