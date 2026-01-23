'use client';

import { prefersReducedMotion } from '@/lib/motion';
import { useEffect, useState } from 'react';

const TRIGGER_SELECTOR = '#statement';

export default function StickerStatement() {
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    if (appeared) return;
    if (prefersReducedMotion()) {
      setAppeared(true);
      return;
    }

    const target = document.querySelector(TRIGGER_SELECTOR);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setAppeared(true);
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: '0px 0px -20% 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [appeared]);

  return (
    <div
      className="sticker-statement"
      data-appeared={appeared ? 'true' : 'false'}
      aria-hidden="true"
    >
      <div className="sticker-statement__surface">
        <span className="sticker-statement__line">STOP TALKING.</span>
        <span className="sticker-statement__line">BUILD. BUILD. BUILD.</span>
      </div>
    </div>
  );
}
