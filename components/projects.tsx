"use client"

import { useState, type CSSProperties } from "react"
import { useScrollRhythm } from "@/hooks/use-scroll-rhythm"
import { EASING, DURATION, prefersReducedMotion } from "@/lib/motion"

const projects = [
  {
    title: "Automation platform",
    category: "FINTECH",
    backColor: "#E16A2D",
    description: "I’m building an automation and testing platform for fintech systems that move real money. It’s focused on reliability, edge cases, and things breaking before users notice.",
  },
  {
    title: "Bender — AI testing assistant",
    category: "AI",
    backColor: "#E5D04F",
    description: "An AI assistant focused on making test results understandable for humans. Less logs. Less guessing. More context when something breaks.",
  },
  {
    title: "Testing, reliability, and feedback loops",
    category: "QUALITY PROCESSES",
    backColor: "#8C2F23",
    description: "I work on quality as an ongoing process, not a phase. Clear signals, early failures, and feedback you can actually act on.",
  },
  {
    title: "Experiments & side projects",
    category: "EXPERIMENTS",
    backColor: "#3F5E4E",
    description: "Small systems and experiments where I explore ideas around design, tooling, and interaction. Mostly to learn. Sometimes to ship.",
  },
]

export function Projects() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const reduceMotion = prefersReducedMotion()
  const heavyDuration = reduceMotion ? 0 : DURATION.slow
  const revealBaseDelay = reduceMotion ? 0 : 220
  const revealStagger = reduceMotion ? 0 : 140

  const { ref: headerRef, isInView: headerInView } = useScrollRhythm<HTMLDivElement>()
  const { ref: listRef, isInView: listInView } = useScrollRhythm<HTMLDivElement>({ threshold: 0.1 })

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <section id="projects" data-weight="heavy" className="py-32 px-6 bg-secondary/30 relative overflow-hidden">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-20"
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? "translateY(0)" : "translateY(24px)",
            transition: `opacity ${heavyDuration}ms ${EASING.default} ${reduceMotion ? 0 : 140}ms, transform ${heavyDuration}ms ${EASING.default} ${reduceMotion ? 0 : 140}ms`,
          }}
        >
          <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-4">
            What I’m working on
          </span>
          <p className="text-sm text-muted-foreground">
            I spend most of my time on the parts other people get bored of.
          </p>
        </div>

        {/* Projects List */}
        <div ref={listRef} className="projects-grid">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className="flip-card-wrap"
              style={{
                opacity: listInView ? 1 : 0,
                transform: listInView ? "translateY(0)" : "translateY(28px)",
                transition: `opacity ${heavyDuration}ms ${EASING.default} ${revealBaseDelay + index * revealStagger}ms, transform ${heavyDuration}ms ${EASING.default} ${revealBaseDelay + index * revealStagger}ms`,
              }}
            >
              <button
                type="button"
                data-cursor="card"
                className="flip-card"
                data-open={openIndex === index ? "true" : "false"}
                aria-pressed={openIndex === index}
                aria-label={`${project.category} details`}
                onClick={() => handleToggle(index)}
                style={{ "--card-back": project.backColor } as CSSProperties}
              >
                <span className="flip-card__inner">
                  <span
                    className="flip-card__face flip-card__back"
                    aria-hidden={openIndex === index}
                  >
                    <span className="flip-card__pattern" aria-hidden="true">
                      {Array.from({ length: 9 }).map((_, lineIndex) => (
                        <span key={`${project.category}-pattern-${lineIndex}`} className="flip-card__pattern-line">
                          {Array.from({ length: 6 }).fill(project.category).join(" ")}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span
                    className="flip-card__face flip-card__front"
                    aria-hidden={openIndex !== index}
                  >
                    <span className="flip-card__category">{project.category}</span>
                    <span className="flip-card__title">{project.title}</span>
                    <span className="flip-card__description">{project.description}</span>
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
