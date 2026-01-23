'use client';

import { prefersReducedMotion } from '@/lib/motion';
import { useEffect, useRef, useState } from 'react';

const HIT_DURATION_MS = 120;
const TRIGGER_PROGRESS = 0.5;
const FRICTION_PROGRESS = 0.3;
const FRICTION_DURATION_MS = 2000;
const FRICTION_SCALE = 0.05;
const POST_FRICTION_DELAY_MS = 80;
const VIEWPORT_GUARD_TOP = 0.95;
const VIEWPORT_GUARD_BOTTOM = 0.05;

export function Statement() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [impact, setImpact] = useState(false);
  const hasTriggeredRef = useRef(false);
  const frictionActiveRef = useRef(false);
  const frictionArmedRef = useRef(false);
  const pendingTriggerRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);
  const lastProgressRef = useRef(0);
  const frictionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    hasTriggeredRef.current = hasTriggered;
  }, [hasTriggered]);

  useEffect(() => {
    if (hasTriggered) return;
    if (prefersReducedMotion()) {
      setHasTriggered(true);
      return;
    }

    const target = sectionRef.current;
    if (!target) return;

    const getProgress = (rect: DOMRect) => {
      const total = window.innerHeight + rect.height;
      const progress = (window.innerHeight - rect.top) / total;
      return Math.max(0, Math.min(1, progress));
    };

    const triggerImpact = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      frictionActiveRef.current = false;
      pendingTriggerRef.current = false;
      if (frictionTimeoutRef.current !== null) {
        window.clearTimeout(frictionTimeoutRef.current);
        frictionTimeoutRef.current = null;
      }
      setHasTriggered(true);
      setImpact(true);
      window.setTimeout(() => setImpact(false), HIT_DURATION_MS);
    };

    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        if (hasTriggeredRef.current) return;
        const rect = target.getBoundingClientRect();
        lastRectRef.current = rect;
        const viewportHeight = window.innerHeight;
        const isVisible = rect.bottom > 0 && rect.top < viewportHeight;
        if (!isVisible) {
          if (frictionActiveRef.current) {
            frictionActiveRef.current = false;
            pendingTriggerRef.current = false;
            if (frictionTimeoutRef.current !== null) {
              window.clearTimeout(frictionTimeoutRef.current);
              frictionTimeoutRef.current = null;
            }
          }
          return;
        }

        const progress = getProgress(rect);
        lastProgressRef.current = progress;
        const inViewGuard =
          rect.bottom > viewportHeight * VIEWPORT_GUARD_BOTTOM &&
          rect.top < viewportHeight * VIEWPORT_GUARD_TOP;

        if (!frictionArmedRef.current && progress >= FRICTION_PROGRESS && inViewGuard) {
          frictionArmedRef.current = true;
          frictionActiveRef.current = true;
          frictionTimeoutRef.current = window.setTimeout(() => {
            frictionActiveRef.current = false;
            if (pendingTriggerRef.current) {
              pendingTriggerRef.current = false;
              const lastRect = lastRectRef.current;
              if (lastRect) {
                const guarded =
                  lastRect.bottom > window.innerHeight * VIEWPORT_GUARD_BOTTOM &&
                  lastRect.top < window.innerHeight * VIEWPORT_GUARD_TOP;
                if (guarded && lastProgressRef.current >= TRIGGER_PROGRESS) {
                  window.setTimeout(triggerImpact, POST_FRICTION_DELAY_MS);
                }
              }
            }
          }, FRICTION_DURATION_MS);
        }

        if (progress >= TRIGGER_PROGRESS && inViewGuard) {
          if (frictionActiveRef.current) {
            pendingTriggerRef.current = true;
          } else {
            triggerImpact();
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (frictionTimeoutRef.current !== null) {
        window.clearTimeout(frictionTimeoutRef.current);
        frictionTimeoutRef.current = null;
      }
    };
  }, [hasTriggered]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const handleWheel = (event: WheelEvent) => {
      if (!frictionActiveRef.current || hasTriggeredRef.current) return;
      event.preventDefault();
      window.scrollBy(0, event.deltaY * FRICTION_SCALE);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="statement"
      data-weight="heavy"
      data-sticker={hasTriggered ? 'on' : 'off'}
      data-impact={impact ? 'on' : 'off'}
      className="statement-event min-h-[80vh] flex items-center justify-center px-6 py-32 relative"
    >
      <div className="statement-event__inner mx-auto max-w-4xl text-center">
        <p className="statement-event__text font-serif text-4xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight">
          <span className="statement-event__line">Designing scalable systems</span>
          <span className="statement-event__line">with a strong focus on quality,</span>
          <span className="statement-event__line">reliability, and long-term value.</span>
        </p>
        <div className="statement-sticker" aria-hidden="true">
          <span className="statement-sticker__tape statement-sticker__tape--top" />
          <span className="statement-sticker__tape statement-sticker__tape--bottom" />
          <div className="statement-sticker__surface">
            <span className="statement-sticker__line">STOP TALKING.</span>
            <span className="statement-sticker__line">BUILD. BUILD. BUILD.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
