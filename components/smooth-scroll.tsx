'use client';

import { ReactNode } from 'react';

interface SmoothScrollProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SmoothScroll({ href, children, className = '' }: SmoothScrollProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Update URL without scroll
      window.history.pushState({}, '', href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
} 