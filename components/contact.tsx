"use client"

import { useScrollRhythm } from "@/hooks/use-scroll-rhythm"

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "GitHub", href: "https://github.com" },
  { label: "Email", href: "mailto:hello@example.com" },
]

export function Contact() {
  const { ref, scrollStyles } = useScrollRhythm<HTMLElement>({ 
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
        <p className="font-serif text-lg md:text-xl opacity-90">
          I don’t take every project.
        </p>

        <div className="flex flex-wrap gap-6 pt-8">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm opacity-60 hover:opacity-100 hover-underline"
              style={{ transition: `opacity var(--motion-fast) var(--motion-ease)` }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
