"use client"

import { useScrollRhythm } from "@/hooks/use-scroll-rhythm"
import { getStaggeredRevealStyles, EASING, DURATION } from "@/lib/motion"

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "GitHub", href: "https://github.com" },
  { label: "Email", href: "mailto:hello@example.com" },
]

export function Contact() {
  const { ref, isInView, scrollStyles } = useScrollRhythm<HTMLElement>({ 
    threshold: 0.2,
    offset: 0.05,
    triggerOnce: false,
  })

  return (
    <section
      ref={ref}
      id="contact"
      className="py-32 px-6 bg-foreground text-background relative overflow-hidden"
      style={scrollStyles}
    >
      <div className="mx-auto max-w-6xl">
        <div
          style={getStaggeredRevealStyles(isInView, 0)}
        >
          <span className="text-xs tracking-[0.2em] uppercase opacity-60 block mb-12">
            Contact
          </span>

          <div className="relative inline-block">
            <h2
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-light"
              data-emphasis
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(32px)",
                transition: `opacity ${DURATION.slow}ms ${EASING.default} 200ms, transform ${DURATION.slow}ms ${EASING.default} 200ms`,
              }}
            >
              Let&apos;s talk.
            </h2>
            {/* Accent underline */}
            <div 
              className="absolute -bottom-2 left-0 h-[3px] bg-accent origin-left"
              style={{
                width: isInView ? "6rem" : "0",
                transform: "rotate(-1deg)",
                transition: `width ${DURATION.slow}ms ${EASING.default} 500ms`,
              }}
            />
          </div>

          <div
            className="flex flex-wrap gap-8 pt-12"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(24px)",
              transition: `opacity ${DURATION.slow}ms ${EASING.default} 400ms, transform ${DURATION.slow}ms ${EASING.default} 400ms`,
            }}
          >
            {socialLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-lg opacity-70 hover:opacity-100 hover-underline"
                style={{ 
                  transition: `opacity var(--motion-fast) var(--motion-ease)`,
                  transitionDelay: `${500 + index * 100}ms`,
                }}
              >
                <span 
                  className="group-hover:text-accent"
                  style={{ transition: `color var(--motion-fast) var(--motion-ease)` }}
                >
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
