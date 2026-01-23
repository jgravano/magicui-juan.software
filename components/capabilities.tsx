'use client';

import { useScrollRhythm } from '@/hooks/use-scroll-rhythm';
import { DURATION, EASING, prefersReducedMotion } from '@/lib/motion';

const capabilities = [
  {
    title: 'Automation',
    description: 'I automate the parts that break first.',
  },
  {
    title: 'Quality Strategy',
    description: 'I set quality rules based on real risk, not checklists.',
  },
  {
    title: 'Fintech APIs',
    description: 'I test API behavior the way money moves: carefully and end to end.',
  },
  {
    title: 'Tooling & Systems',
    description: 'I build internal tools that remove manual work and stay boring.',
  },
];

export function Capabilities() {
  const reduceMotion = prefersReducedMotion();
  const lightDuration = reduceMotion ? 0 : DURATION.normal;
  const headerDelay = reduceMotion ? 0 : 80;
  const itemBaseDelay = reduceMotion ? 0 : 120;
  const itemStagger = reduceMotion ? 0 : 80;

  const { ref: headerRef, isInView: headerInView } = useScrollRhythm<HTMLDivElement>();
  const { ref: gridRef, isInView: gridInView } = useScrollRhythm<HTMLDivElement>({
    threshold: 0.2,
  });

  return (
    <section id="capabilities" data-weight="light" className="py-32 px-6 relative">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div
          ref={headerRef}
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? 'translateY(0)' : 'translateY(12px)',
            transition: `opacity ${lightDuration}ms ${EASING.default} ${headerDelay}ms, transform ${lightDuration}ms ${EASING.default} ${headerDelay}ms`,
          }}
        >
          <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-20">
            What I actually do
          </span>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid md:grid-cols-2 gap-px bg-border">
          {capabilities.map((capability, index) => (
            <div
              key={capability.title}
              data-card
              className="group bg-background p-12"
              style={{
                opacity: gridInView ? 1 : 0,
                transform: gridInView ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity ${lightDuration}ms ${EASING.default} ${itemBaseDelay + index * itemStagger}ms, transform ${lightDuration}ms ${EASING.default} ${itemBaseDelay + index * itemStagger}ms`,
              }}
            >
              <div className="relative">
                <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                  {capability.title}
                </h3>
                <p className="text-sm text-muted-foreground">{capability.description}</p>
                {/* Accent bar on hover */}
                <div
                  className="absolute -left-4 top-0 bottom-0 w-[3px] bg-accent scale-y-0 origin-top group-hover:scale-y-100"
                  style={{
                    transition: `transform ${reduceMotion ? 0 : DURATION.fast}ms ${EASING.default} ${reduceMotion ? 0 : 120}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
