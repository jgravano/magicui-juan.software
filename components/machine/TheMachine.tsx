'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MACHINE_CONTENT } from '@/lib/machine-content';

/* ── Win98 popup windows — Paint aesthetic ── */
const WIN98_WINDOWS: PopupState[] = [
  {
    id: 0,
    title: 'error.exe',
    body: 'This program has performed an illegal operation.\n\nIf the problem persists, contact\nyour system administrator.\n\n(just kidding, you ARE the system)',
    x: 30, y: 40,
    dodgeCount: 0,
  },
  {
    id: 1,
    title: 'untitled - Paint',
    body: null, // paint window — special render (trolls on close)
    x: 60, y: 280,
    dodgeCount: 0,
  },
  {
    id: 2,
    title: 'deploy_friday.bat',
    body: 'DEPLOYING TO PROD ON A FRIDAY\n\ngit push --force\n¯\\_(ツ)_/¯\n\nLGTM 👍 (didn\'t read)',
    x: 380, y: 80,
    dodgeCount: 0,
  },
];

interface PopupState {
  id: number;
  title: string;
  body: string | null;
  x: number;
  y: number;
  dragged?: boolean;
  dodgeCount: number;
}

export function TheMachine() {
  const [phase, setPhase] = useState<'facade' | 'breaking' | 'broken'>('facade');
  const [leverY, setLeverY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const [stickerHit, setStickerHit] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);
  const [showBSOD, setShowBSOD] = useState(false);
  const [showScanlines, setShowScanlines] = useState(false);
  const [popups, setPopups] = useState<PopupState[]>([]);
  const [openProject, setOpenProject] = useState<number | null>(null);
  const [transmitted, setTransmitted] = useState(false);
  const [bugCount, setBugCount] = useState(0);
  const [thresholdCrossed, setThresholdCrossed] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);
  const stickerTriggered = useRef(false);
  const thresholdTriggered = useRef(false);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const maxLever = 160;

  const c = MACHINE_CONTENT;
  const isBroken = phase === 'broken';

  /* ── Reduced motion ── */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true); setPhase('broken'); setStickerHit(true);
      setTransmitted(true);
      setPopups(WIN98_WINDOWS);
    }
  }, []);

  /* ── Lever ── */
  const onLeverDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (entered) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startL = leverY;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const next = Math.max(0, Math.min(maxLever, startL + ev.clientY - startY));
      setLeverY(next);
      // Threshold detection (bidirectional)
      const crossed = next / maxLever >= 0.75;
      if (crossed && !thresholdTriggered.current) {
        thresholdTriggered.current = true;
        setThresholdCrossed(true);
        if (navigator.vibrate) navigator.vibrate(30);
      } else if (!crossed && thresholdTriggered.current) {
        thresholdTriggered.current = false;
        setThresholdCrossed(false);
      }
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      setDragging(false);
      setLeverY((cur) => {
        if (cur / maxLever > 0.75) { setEntered(true); return maxLever; }
        thresholdTriggered.current = false;
        setThresholdCrossed(false);
        return 0;
      });
    };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }, [entered, leverY, maxLever]);

  /* ── Chaos sequence ── */
  const fireChaosSequence = useCallback(() => {
    // T+0: WHITE FLASH + STICKER SLAM + SCREEN SHAKE
    setShowFlash(true);
    setStickerHit(true);
    setShaking(true);
    setPhase('breaking');
    setTimeout(() => setShowFlash(false), 400);
    setTimeout(() => setShaking(false), 450);

    // T+300: GLITCH + SCANLINES
    setTimeout(() => {
      setShowGlitch(true);
      setShowScanlines(true);
      setTimeout(() => setShowGlitch(false), 700);
      setTimeout(() => setShowScanlines(false), 800);
    }, 300);

    // T+500: BSOD (stays until user scrolls 3 times, then triggers popups + broken)
    setTimeout(() => setShowBSOD(true), 500);
  }, []);

  /* ── Scroll resistance + sticker trigger ──
     When the statement is in view, scroll gets heavy (dampened).
     User has to keep insisting. After enough accumulated scroll
     effort, the sticker detonates.
  ── */
  const scrollEffort = useRef(0);
  const inStatementZone = useRef(false);
  const EFFORT_THRESHOLD = 1500; // accumulated px of scroll effort needed

  useEffect(() => {
    if (!entered || stickerTriggered.current) return;
    const el = statementRef.current;
    if (!el) return;

    // Track when statement is in view
    const observer = new IntersectionObserver(([entry]) => {
      inStatementZone.current = entry.isIntersecting;
    }, { threshold: 0.2 });
    observer.observe(el);

    // Dampen scroll when in statement zone
    const onWheel = (e: WheelEvent) => {
      if (!inStatementZone.current || stickerTriggered.current) return;

      // Slow down the scroll — let only 20% through
      e.preventDefault();
      window.scrollBy(0, e.deltaY * 0.2);

      // Accumulate effort from what the user is trying to scroll
      scrollEffort.current += Math.abs(e.deltaY);

      // Once enough effort, DETONATE
      if (scrollEffort.current >= EFFORT_THRESHOLD) {
        stickerTriggered.current = true;
        fireChaosSequence();
      }
    };

    // Touch support: track touch delta
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!inStatementZone.current || stickerTriggered.current) return;
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;

      // Dampen touch scroll
      e.preventDefault();
      window.scrollBy(0, delta * 0.2);

      scrollEffort.current += Math.abs(delta);
      if (scrollEffort.current >= EFFORT_THRESHOLD) {
        stickerTriggered.current = true;
        fireChaosSequence();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [entered, fireChaosSequence]);

  /* ── BSOD dismiss: requires 3 distinct scroll gestures (debounced) ── */
  const bsodScrollCount = useRef(0);
  const bsodLastScroll = useRef(0);
  useEffect(() => {
    if (!showBSOD) { bsodScrollCount.current = 0; return; }
    const dismiss = () => {
      const now = Date.now();
      // Debounce: only count a new gesture if 400ms+ since last one
      if (now - bsodLastScroll.current < 400) return;
      bsodLastScroll.current = now;
      bsodScrollCount.current++;
      if (bsodScrollCount.current >= 3) {
        setShowBSOD(false);
        // After BSOD: broken state immediately, popups cascade in projects
        setPhase('broken');
        WIN98_WINDOWS.forEach((w, i) => {
          setTimeout(() => setPopups(prev => [...prev, w]), i * 700);
        });
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', dismiss, { passive: true });
    window.addEventListener('touchmove', dismiss, { passive: true });
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('wheel', dismiss);
      window.removeEventListener('touchmove', dismiss);
    };
  }, [showBSOD]);

  /* ── Bug counter ── */
  useEffect(() => {
    if (!isBroken) return;
    const interval = setInterval(() => setBugCount(prev => prev < 99 ? prev + 1 : prev), 600);
    return () => clearInterval(interval);
  }, [isBroken]);

  /* ── Win98 window drag ── */
  const onPopupPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, id: number) => {
    e.stopPropagation();
    const pointerId = e.pointerId;
    const popup = popups.find(p => p.id === id);
    if (!popup) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = popup.dragged ? popup.x : rect.left;
    const startY = popup.dragged ? popup.y : rect.top;
    const offsetX = e.clientX - startX;
    const offsetY = e.clientY - startY;
    dragRef.current = { id, offsetX, offsetY };
    setPopups(prev => prev.map(p => p.id === id ? { ...p, dragged: true, x: startX, y: startY } : p));

    const move = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      setPopups(prev => prev.map(p =>
        p.id === dragRef.current!.id
          ? { ...p, x: ev.clientX - dragRef.current!.offsetX, y: ev.clientY - dragRef.current!.offsetY }
          : p
      ));
    };
    const cleanup = () => {
      dragRef.current = null;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', cleanup);
      document.removeEventListener('pointercancel', cleanup);
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', cleanup);
    document.addEventListener('pointercancel', cleanup);
  }, [popups]);

  /* ── Close window — Paint windows troll (dodge 2x before closing) ── */
  const onPopupClose = useCallback((id: number) => {
    setPopups(prev => {
      const popup = prev.find(p => p.id === id);
      if (!popup) return prev;
      // Paint window trolls: dodges away from cursor
      if (popup.body === null && popup.dodgeCount < 2) {
        return prev.map(p => p.id === id ? {
          ...p,
          x: p.x + (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 100),
          y: p.y + (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 60),
          dodgeCount: p.dodgeCount + 1,
          dragged: true, // switch to fixed so it stays visible
        } : p);
      }
      // Regular windows or Paint after 2 dodges: close for real
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const norm = leverY / maxLever;
  const bgColor = phase === 'facade' ? '#FAFAFA' : 'var(--m-bg)';
  const textFont = phase === 'facade' ? 'var(--font-serif)' : 'var(--font-mono)';

  return (
    <>
      {/* ═══ OVERLAYS ═══ */}
      {showFlash && <div className="screen-flash" />}
      {showGlitch && <div className="glitch-overlay" />}
      {showScanlines && <div className="scanlines" />}
      {showBSOD && (
        <div className="bsod">
          <div className="bsod-inner">
            <p style={{ background: '#aaa', color: '#0000AA', display: 'inline', padding: '2px 8px', marginBottom: 16 }}>
              portfolio.exe
            </p>
            <br /><br />
            A fatal error has occurred. The system has been halted.<br /><br />
            * Press any key to pretend this didn&apos;t happen<br />
            * Press CTRL+ALT+DEL to restart your career<br /><br />
            Error: 0x0000DEAD — IRQL_NOT_CREATIVE_ENOUGH<br /><br />
            <span style={{ opacity: 0.5 }}>Technical information:<br />
            *** STOP: 0x0000008E (0xC0000005, 0x00000000)<br />
            *** personality.sys — Address 0xBAADF00D</span>
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-3 transition-all duration-700"
        style={{
          background: phase === 'facade' ? 'rgba(250,250,250,0.95)' : 'rgba(240,236,228,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: phase === 'facade' ? '1px solid #eee' : '2px solid var(--m-border)',
        }}>
        <span style={{
          fontFamily: textFont, fontSize: 15,
          fontWeight: phase === 'facade' ? 400 : 800,
          textTransform: isBroken ? 'uppercase' : 'none',
          letterSpacing: isBroken ? '0.08em' : '0',
          transition: 'all 700ms ease',
        }}>
          {phase === 'facade' ? 'Juan Gravano' : 'JG'}
        </span>
        {entered && (
          <nav className="hidden md:flex items-center gap-6">
            <a href="#projects" className="t-label hover:text-[var(--m-orange)] transition-colors" style={{ color: isBroken ? 'var(--m-text)' : '#999' }}>Projects</a>
            <a href="#contact" className="t-label hover:text-[var(--m-orange)] transition-colors" style={{ color: isBroken ? 'var(--m-text)' : '#999' }}>Contact</a>
          </nav>
        )}
        {isBroken && (
          <div className="flex items-center gap-3">
            <span className="t-label" style={{ color: 'var(--m-red)' }}>BUGS: {bugCount}</span>
            <span className="t-label machine-pulse" style={{ color: 'var(--m-green)' }}>● LIVE</span>
          </div>
        )}
      </header>

      {/* ═══ MAIN ═══ */}
      <main className={`min-h-screen pt-[52px] transition-colors duration-1000 ${shaking ? 'screen-hit' : ''}`} style={{ background: bgColor }}>

        {/* ═══ ACT 1: FACADE ═══ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
          <h1 style={{
            fontFamily: phase === 'facade' ? 'var(--font-serif)' : 'var(--font-mono)',
            fontSize: 'clamp(3rem, 13vw, 11rem)',
            fontWeight: phase === 'facade' ? 300 : 800,
            textTransform: phase === 'facade' ? 'none' : 'uppercase',
            letterSpacing: phase === 'facade' ? '-0.03em' : '-0.02em',
            lineHeight: 0.95,
            color: 'var(--m-black)',
            textAlign: 'center',
            opacity: entered ? 1 : 0.06 + norm * 0.94,
            filter: entered ? 'none' : `blur(${(1 - norm) * 4}px)`,
            transition: entered ? 'all 700ms ease' : 'none',
          }}>
            {phase === 'facade' ? 'Juan Gravano' : c.hero.name}
          </h1>

          {entered && (
            <p className="fade-up mt-5 transition-all duration-700" style={{
              fontFamily: phase === 'facade' ? 'var(--font-serif)' : 'var(--font-mono)',
              fontSize: phase === 'facade' ? 16 : 13,
              fontStyle: phase === 'facade' ? 'italic' : 'normal',
              color: phase === 'facade' ? '#999' : 'var(--m-text-dim)',
              letterSpacing: phase === 'facade' ? '0' : '0.04em',
              animationDelay: '200ms',
            }}>
              I work on systems, quality, and the parts most people avoid.
            </p>
          )}

          {/* Lever */}
          {!entered && (
            <div className={`mt-16 flex flex-col items-center gap-5 z-20${thresholdCrossed ? ' lever-committed' : ''}`}>
              <span className="t-label" style={{
                color: dragging ? (thresholdCrossed ? 'var(--m-orange)' : '#666') : '#aaa',
                transition: 'color 200ms ease',
              }}>{c.hero.instruction}</span>

              <div className="relative flex items-start">
                {/* Track */}
                <div className="relative" style={{
                  width: 4,
                  height: maxLever,
                  background: '#eee',
                  border: '1px solid #ddd',
                  borderRadius: 2,
                }}>
                  {/* Fill */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%',
                    height: leverY,
                    background: thresholdCrossed ? 'var(--m-orange)' : (norm > 0.01 ? `color-mix(in srgb, #bbb ${Math.round((1 - norm) * 100)}%, #111)` : '#bbb'),
                    transition: dragging ? 'background 150ms ease' : 'height 400ms ease, background 150ms ease',
                    borderRadius: 2,
                  }} />

                  {/* Threshold marker — appears after 30% progress */}
                  <div style={{
                    position: 'absolute',
                    top: maxLever * 0.75,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 14,
                    height: 1,
                    background: thresholdCrossed ? 'var(--m-orange)' : '#ccc',
                    opacity: norm > 0.3 ? 0.6 : 0,
                    transition: 'opacity 300ms ease, background 200ms ease',
                  }} />

                  {/* Handle hit area (48x48 invisible) + visible handle */}
                  <div data-cursor="grab" onPointerDown={onLeverDown}
                    style={{
                      position: 'absolute', left: '50%', top: leverY,
                      transform: dragging
                        ? 'translate(-50%, -50%) scaleX(1.1)'
                        : 'translate(-50%, -50%)',
                      width: 48, height: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'grab', touchAction: 'none', userSelect: 'none',
                      transition: dragging ? 'transform 150ms ease' : 'top 400ms ease, transform 150ms ease',
                      animation: !dragging && leverY === 0 ? 'lever-bob 2.5s ease-in-out infinite' : 'none',
                    }}>
                    {/* Visible handle rectangle */}
                    <div style={{
                      width: 40, height: 14,
                      background: thresholdCrossed ? 'var(--m-orange)' : (norm > 0.01 ? `color-mix(in srgb, #bbb ${Math.round((1 - norm) * 100)}%, #111)` : '#bbb'),
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      transition: 'background 150ms ease',
                    }}>
                      {/* 3 grip lines */}
                      <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.4)' }} />
                      <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.4)' }} />
                      <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.4)' }} />
                    </div>
                  </div>
                </div>

                {/* Percentage counter — appears during drag */}
                {dragging && (
                  <span className="t-label" style={{
                    position: 'absolute',
                    left: 'calc(50% + 34px)',
                    top: leverY,
                    transform: 'translateY(-50%)',
                    color: thresholdCrossed ? 'var(--m-orange)' : '#999',
                    whiteSpace: 'nowrap',
                    transition: 'color 150ms ease',
                  }}>{Math.round(norm * 100)}%</span>
                )}
              </div>
            </div>
          )}
        </section>

        {entered && (
          <>
            {/* ═══ ACT 2: STATEMENT + STICKER DETONATION ═══ */}
            <section ref={statementRef} className="flex items-center px-6 md:px-10 py-20 relative overflow-visible" style={{ minHeight: '60vh' }}>
              <div className="mx-auto max-w-5xl w-full relative">
                {/* Corporate statement */}
                <div className="space-y-0">
                  {c.statement.lines.map((line, i) => (
                    <p key={i} style={{
                      fontFamily: stickerHit ? 'var(--font-mono)' : 'var(--font-serif)',
                      fontSize: 'clamp(2rem, 6vw, 5rem)',
                      fontWeight: stickerHit ? 700 : 300,
                      textTransform: stickerHit ? 'uppercase' : 'none',
                      color: stickerHit ? 'var(--m-text-dim)' : 'var(--m-black)',
                      letterSpacing: stickerHit ? '-0.01em' : '-0.02em',
                      lineHeight: 1.1,
                      transition: 'all 800ms ease',
                      transitionDelay: `${i * 100}ms`,
                      textDecoration: stickerHit ? 'line-through' : 'none',
                      textDecorationColor: 'var(--m-red)',
                    }}>
                      {line}
                    </p>
                  ))}
                </div>

                {/* ══ THE STICKER ══ */}
                {stickerHit && (
                  <div className="absolute sticker-slam sticker-tape z-30"
                    style={{ top: '50%', left: '50%', '--sticker-rot': '-6deg' } as React.CSSProperties}>
                    <div className="sticker-texture" style={{
                      background: 'var(--m-sticker)', color: 'var(--m-sticker-text)',
                      padding: 'clamp(28px, 5vw, 52px) clamp(36px, 6vw, 68px)',
                      fontFamily: 'var(--font-sans), system-ui', fontWeight: 900,
                      fontSize: 'clamp(28px, 6vw, 58px)', textTransform: 'uppercase',
                      letterSpacing: '0.02em', lineHeight: 1,
                      boxShadow: '14px 14px 0 rgba(0,0,0,0.4), -2px -2px 0 rgba(255,255,255,0.1) inset',
                      clipPath: 'polygon(1% 4%, 98% 0%, 100% 16%, 97% 96%, 94% 100%, 2% 97%, 0% 80%)',
                      position: 'relative',
                    }}>
                      <span style={{ display: 'block' }}>STOP TALKING.</span>
                      <span style={{ display: 'block' }}>BUILD. BUILD. BUILD.</span>
                      {/* Coffee stain */}
                      <div style={{
                        position: 'absolute', bottom: -12, right: -8,
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,90,43,0.15) 0%, transparent 70%)',
                        transform: 'rotate(15deg)',
                      }} />
                    </div>
                  </div>
                )}

                {/* Win98 windows now live in projects section */}
              </div>
            </section>

            {/* ═══ TRANSITION ZONE ═══ */}
            {isBroken && (
              <>
                {/* Orange marquee */}
                <div style={{ background: 'var(--m-orange)', padding: '12px 0', overflow: 'hidden' }}>
                  <div className="flex whitespace-nowrap" style={{ animation: 'marquee 14s linear infinite' }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} className="t-display mx-6" style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)', color: 'white' }}>
                        SYSTEMS &bull; QUALITY &bull; AUTOMATION &bull; FINTECH &bull; TOOLING &bull; CHAOS &bull;
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reverse marquee — overlapping */}
                <div style={{ background: 'var(--m-blue)', padding: '8px 0', overflow: 'hidden', marginTop: -4 }}>
                  <div className="flex whitespace-nowrap" style={{ animation: 'marquee-reverse 20s linear infinite' }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} className="t-display mx-6" style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.9rem)', color: 'var(--m-yellow)' }}>
                        BUG-FREE* &bull; PROD-READY* &bull; FULLY TESTED* &bull; NO KNOWN ISSUES* &bull; *CITATION NEEDED &bull;
                      </span>
                    ))}
                  </div>
                </div>

                {/* Giant disruption */}
                <div className="relative overflow-hidden" style={{ height: 'clamp(160px, 25vw, 240px)', background: 'var(--m-black)' }}>
                  <span className="t-display absolute whitespace-nowrap select-none"
                    style={{ fontSize: 'clamp(3.5rem, 11vw, 9rem)', color: 'var(--m-yellow)', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-3deg)', opacity: 0.9 }}>
                    BREAK THINGS ON PURPOSE
                  </span>
                </div>
              </>
            )}

            {/* ═══ ACT 3: PROJECTS ═══ */}
            {isBroken && (
              <section id="projects" className="py-32 relative checkerboard--large overflow-hidden">
                {/* ══ WIN98 WINDOWS (floating over projects) ══ */}
                {popups.map((popup) => (
                  <div key={popup.id}
                    className="fade-up"
                    style={{
                      position: popup.dragged ? 'fixed' : 'absolute',
                      left: popup.x, top: popup.y,
                      zIndex: 40,
                      width: popup.body === null ? 340 : 300,
                      userSelect: 'none',
                      cursor: 'grab',
                      transition: popup.dodgeCount > 0 ? 'left 300ms ease, top 300ms ease' : 'none',
                    }}
                    onPointerDown={(e) => onPopupPointerDown(e, popup.id)}>
                    <div style={{
                      background: '#c0c0c0',
                      border: '2px solid #fff',
                      borderRightColor: '#404040',
                      borderBottomColor: '#404040',
                      boxShadow: '1px 1px 0 #000, inset 1px 1px 0 #dfdfdf',
                    }}>
                      {/* Win98 title bar */}
                      <div style={{
                        background: 'linear-gradient(90deg, #000080, #1084d0)',
                        padding: '3px 4px 3px 6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: 'white',
                        fontFamily: 'var(--font-sans), system-ui', fontSize: 12, fontWeight: 700,
                      }}>
                        <span>{popup.title}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{
                            width: 16, height: 14, background: '#c0c0c0',
                            border: '1px solid #fff', borderRightColor: '#404040', borderBottomColor: '#404040',
                            fontSize: 9, lineHeight: 1, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>_</button>
                          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{
                            width: 16, height: 14, background: '#c0c0c0',
                            border: '1px solid #fff', borderRightColor: '#404040', borderBottomColor: '#404040',
                            fontSize: 8, lineHeight: 1, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>&#9633;</button>
                          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onPopupClose(popup.id); }} style={{
                            width: 16, height: 14, background: '#c0c0c0',
                            border: '1px solid #fff', borderRightColor: '#404040', borderBottomColor: '#404040',
                            fontSize: 10, lineHeight: 1, cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>&#10005;</button>
                        </div>
                      </div>
                      {/* Win98 body */}
                      {popup.body !== null ? (
                        <div style={{
                          padding: '16px 20px',
                          fontFamily: 'var(--font-sans), system-ui', fontSize: 12,
                          lineHeight: 1.6, whiteSpace: 'pre-line', color: '#000',
                          display: 'flex', gap: 14, alignItems: 'flex-start',
                        }}>
                          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>&#9888;</span>
                          <span>{popup.body}</span>
                        </div>
                      ) : (
                        /* Paint window */
                        <div>
                          <div style={{
                            padding: '2px 6px', borderBottom: '1px solid #808080',
                            fontFamily: 'var(--font-sans), system-ui', fontSize: 11, color: '#000',
                            display: 'flex', gap: 12,
                          }}>
                            <span style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>File</span>
                            <span>Edit</span>
                            <span>View</span>
                            <span>Image</span>
                            <span>Colors</span>
                            <span>Help</span>
                          </div>
                          <div style={{
                            height: 140, margin: 4, border: '1px solid #808080',
                            borderRightColor: '#fff', borderBottomColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#fff',
                          }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#808080', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {popup.dodgeCount === 0 ? '[ canvas ]' : popup.dodgeCount === 1 ? '[ nice try ]' : '[ ok fine ]'}
                            </span>
                          </div>
                          <div style={{ padding: '4px 6px', display: 'flex', gap: 2, flexWrap: 'wrap', borderTop: '1px solid #fff' }}>
                            {['#000','#808080','#800000','#808000','#008000','#008080','#000080','#800080','#FF5C00','#E8D44D','#0038FF','#D62828','#39ff14','#fff','#c0c0c0','#ff0'].map(cl => (
                              <div key={cl} style={{ width: 12, height: 12, background: cl, border: '1px solid #808080' }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="px-6 md:px-10 mb-12">
                  <h2 className="t-display" style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', color: 'var(--m-black)' }}>PROJECTS</h2>
                  <span className="t-label" style={{ color: 'var(--m-red)' }}>&#9888; HANDLE WITH CARE</span>
                </div>

                <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex gap-5 px-6 md:px-10 pb-4" style={{ width: 'max-content' }}>
                    {c.projects.map((project, i) => {
                      const isOpen = openProject === i;
                      const palette = [
                        { bg: 'var(--m-black)', text: '#fff', dim: 'rgba(255,255,255,0.5)', accent: 'var(--m-yellow)' },
                        { bg: '#fff', text: 'var(--m-black)', dim: 'var(--m-text-dim)', accent: 'var(--m-blue)' },
                        { bg: 'var(--m-orange)', text: '#fff', dim: 'rgba(255,255,255,0.6)', accent: '#fff' },
                        { bg: 'var(--m-blue)', text: '#fff', dim: 'rgba(255,255,255,0.5)', accent: 'var(--m-yellow)' },
                      ][i];

                      return (
                        <button key={project.id} type="button" data-cursor="link"
                          onClick={() => setOpenProject(isOpen ? null : i)}
                          className="shrink-0 text-left transition-all duration-300"
                          style={{
                            width: 'clamp(280px, 32vw, 400px)', minHeight: 260,
                            padding: 'clamp(18px, 2.5vw, 28px)',
                            background: palette.bg,
                            border: i === 1 ? '2px solid var(--m-border)' : '2px solid transparent',
                            cursor: 'pointer',
                            transform: isOpen ? 'translateY(-6px)' : undefined,
                            boxShadow: isOpen ? '10px 10px 0 rgba(0,0,0,0.25)' : '5px 5px 0 rgba(0,0,0,0.12)',
                          }}>
                          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${palette.dim}` }}>
                            <span className="t-label" style={{ color: palette.dim }}>{project.label}</span>
                            <span className="t-label" style={{ color: palette.dim }}>{project.category}</span>
                          </div>
                          <h3 className="t-display" style={{ fontSize: 'clamp(1rem, 2vw, 1.4rem)', color: palette.text, marginBottom: isOpen ? 12 : 0, lineHeight: 1.15 }}>
                            {project.title}
                          </h3>
                          <div style={{ maxHeight: isOpen ? 200 : 0, overflow: 'hidden', transition: 'max-height 400ms cubic-bezier(0.23,1,0.32,1)' }}>
                            <p style={{ fontSize: 13, lineHeight: 1.65, color: palette.dim, paddingTop: 8 }}>{project.description}</p>
                            <span className="t-label mt-3 inline-block" style={{ color: palette.accent }}>{project.tag}</span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Photo placeholder */}
                    <div className="shrink-0 flex items-center justify-center" style={{ width: 'clamp(240px, 28vw, 360px)', minHeight: 260, background: 'var(--m-bg-alt)', border: '2px dashed var(--m-border-light)' }}>
                      <span className="t-label" style={{ color: 'var(--m-border-light)' }}>YOUR IMAGE HERE</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 md:px-10 mt-4 flex items-center gap-2">
                  <span style={{ width: 20, height: 1, background: 'var(--m-border-light)', display: 'inline-block' }} />
                  <span className="t-label">SCROLL</span>
                  <span className="t-label">{'→'}</span>
                </div>
              </section>
            )}

            {/* Full-bleed checkerboard area */}
            {isBroken && (
              <div className="relative" style={{ height: 'clamp(280px, 35vw, 450px)', overflow: 'hidden' }}>
                <div className="absolute inset-0 checkerboard--subtle" style={{ background: 'var(--m-bg-alt)' }} />
                <div className="absolute bottom-5 left-6 md:left-10 z-10">
                  <span className="t-display" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.5rem)', color: 'var(--m-black)', background: 'var(--m-yellow)', padding: '4px 12px' }}>
                    FROM BUENOS AIRES
                  </span>
                </div>
              </div>
            )}

            {/* ═══ CONTACT ═══ */}
            {isBroken && (
              <section id="contact" className="px-6 md:px-10 py-32" style={{ background: 'var(--m-black)', color: 'var(--m-bg)' }}>
                <div className="mx-auto max-w-5xl w-full">
                  <h2 className="t-display mb-12" style={{ fontSize: 'clamp(2rem, 6vw, 5rem)', color: 'var(--m-bg)' }}>CONTACT</h2>
                  <p className="t-serif mb-12" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', color: 'rgba(240,236,228,0.5)' }}>
                    {c.contact.message.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
                  </p>

                  {!transmitted ? (
                    <button type="button" data-cursor="link" onClick={() => setTransmitted(true)}
                      style={{
                        background: 'transparent', border: '2px solid var(--m-orange)', color: 'var(--m-orange)',
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.15em', padding: '12px 36px',
                        cursor: 'pointer', transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--m-orange)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--m-orange)'; }}>
                      OPEN CHANNELS
                    </button>
                  ) : (
                    <div className="space-y-5">
                      {c.contact.links.map((link, i) => (
                        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" data-cursor="link"
                          className="group flex items-center gap-5 fade-up" style={{ textDecoration: 'none', animationDelay: `${i * 120}ms` }}>
                          <span className="t-label" style={{ color: 'var(--m-orange)', minWidth: 24 }}>{link.freq}</span>
                          <span className="group-hover:!bg-[var(--m-orange)] group-hover:!w-12" style={{ width: 24, height: 2, background: 'rgba(240,236,228,0.15)', display: 'inline-block', transition: 'all 200ms ease' }} />
                          <span className="t-display group-hover:!text-[var(--m-orange)] transition-colors" style={{ fontSize: 17, color: 'var(--m-bg)' }}>{link.label}</span>
                          <span className="t-label opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--m-orange)' }}>{'→'}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ═══ FOOTER ═══ */}
            {isBroken && (
              <footer style={{ padding: '14px 24px', borderTop: '2px solid var(--m-border)', background: 'var(--m-bg)' }}>
                <div className="mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="t-label" style={{ color: 'var(--m-text)' }}>{c.footer.copy}</span>
                    <span className="t-label">{'—'}</span>
                    <span className="t-label">{c.footer.year}</span>
                    <span className="t-label">{'—'}</span>
                    <span className="t-label">{c.footer.location}</span>
                  </div>
                  <span className="t-label" style={{ color: 'var(--m-orange)' }}>{c.footer.attitude}</span>
                </div>
              </footer>
            )}
          </>
        )}
      </main>

      {/* Accessible */}
      <div className="sr-only">
        <h1>Juan Gravano</h1><p>Quality Engineer — Buenos Aires</p>
        <h2>Projects</h2><ul>{c.projects.map((p) => <li key={p.id}>{p.title}: {p.description}</li>)}</ul>
        <h2>Contact</h2><ul>{c.contact.links.map((l) => <li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul>
      </div>

      <style jsx global>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
