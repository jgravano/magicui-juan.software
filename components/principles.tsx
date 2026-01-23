"use client"

import { useScrollRhythm } from "@/hooks/use-scroll-rhythm"
import { getStaggeredRevealStyles, EASING, DURATION, STAGGER } from "@/lib/motion"

const principles = [
  "Build foundations.",
  "Reduce friction.",
  "Think long-term.",
]

export function Principles() {
  const { ref: headerRef, isInView: headerInView } = useScrollRhythm<HTMLDivElement>()
  const { ref: listRef, isInView: listInView } = useScrollRhythm<HTMLDivElement>({ threshold: 0.2 })

  return (
    <section className="py-32 px-6 relative">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div
          ref={headerRef}
          style={getStaggeredRevealStyles(headerInView, 0)}
        >
          <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-20">
            Principles
          </span>
        </div>

        {/* Principles List */}
        <div ref={listRef} className="space-y-8">
          {principles.map((principle, index) => (
            <div
              key={principle}
              className="group"
              style={{
                opacity: listInView ? 1 : 0,
                transform: listInView ? "translateX(0)" : "translateX(-32px)",
                transition: `opacity ${DURATION.slow}ms ${EASING.default} ${index * STAGGER.dramatic}ms, transform ${DURATION.slow}ms ${EASING.default} ${index * STAGGER.dramatic}ms`,
              }}
            >
              <p 
                className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground relative inline-block"
                data-emphasis
              >
                <span className="relative">
                  {principle}
                  {/* Subtle accent marker */}
                  <span 
                    className="absolute -left-6 top-1/2 w-2 h-2 bg-accent"
                    style={{ 
                      opacity: listInView ? 1 : 0,
                      transform: listInView 
                        ? `translateY(-50%) rotate(${index % 2 === 0 ? '45' : '-12'}deg) scale(1)` 
                        : `translateY(-50%) rotate(${index % 2 === 0 ? '45' : '-12'}deg) scale(0)`,
                      transition: `opacity ${DURATION.normal}ms ${EASING.default} ${index * STAGGER.dramatic + 400}ms, transform ${DURATION.normal}ms ${EASING.default} ${index * STAGGER.dramatic + 400}ms`,
                    }}
                  />
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
