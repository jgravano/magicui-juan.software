"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function NotFoundExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const copy = copyRef.current;
    if (!canvas || !copy) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;
    let time = 0;
    let targetX = 0.5;
    let targetY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      mouseX += (targetX - mouseX) * (reducedMotion ? 1 : 0.025);
      mouseY += (targetY - mouseY) * (reducedMotion ? 1 : 0.025);
      if (!reducedMotion) time = (time + 0.00038) % 1;
      context.clearRect(0, 0, width, height);

      const horizon = height * (0.34 + (mouseY - 0.5) * 0.055);
      const vanishingPoint = width * (0.5 + (mouseX - 0.5) * 0.24);
      const tilt = (mouseX - 0.5) * height * 0.045;

      const haze = context.createLinearGradient(0, horizon - 80, 0, horizon + 170);
      haze.addColorStop(0, "rgba(8,9,11,0)");
      haze.addColorStop(0.48, "rgba(40,43,48,.16)");
      haze.addColorStop(1, "rgba(8,9,11,0)");
      context.fillStyle = haze;
      context.fillRect(0, horizon - 80, width, 250);

      for (let index = 0; index < 38; index += 1) {
        const progress = (index / 38 + time) % 1;
        const depth = progress * progress;
        const y = horizon + depth * (height - horizon);
        const alpha = 0.025 + depth * 0.13;
        context.beginPath();
        for (let x = 0; x <= width; x += 14) {
          const lineY = y + (x / width - 0.5) * tilt * (1 - depth);
          if (x) context.lineTo(x, lineY);
          else context.moveTo(x, lineY);
        }
        context.strokeStyle = `rgba(229,230,232,${alpha})`;
        context.lineWidth = 0.5 + depth * 0.45;
        context.stroke();
      }

      for (let index = -15; index <= 15; index += 1) {
        context.beginPath();
        context.moveTo(vanishingPoint, horizon);
        context.lineTo(
          vanishingPoint + index * width * 0.082 + (mouseX - 0.5) * width * 0.16,
          height,
        );
        context.strokeStyle = "rgba(229,230,232,.085)";
        context.lineWidth = 0.6;
        context.stroke();
      }

      context.beginPath();
      context.moveTo(0, horizon - tilt * 0.5);
      context.lineTo(width, horizon + tilt * 0.5);
      context.strokeStyle = "rgba(229,230,232,.32)";
      context.lineWidth = 0.75;
      context.stroke();

      const fontSize = Math.min(width * 0.28, height * 0.42);
      const copyY = horizon + fontSize * 0.32;
      context.font = `600 ${fontSize}px Helvetica,Arial,sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineJoin = "round";
      context.fillStyle = "#08090b";
      context.shadowColor = "#08090b";
      context.shadowBlur = 24;
      context.fillText("404", vanishingPoint, copyY);
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(229,230,232,.11)";
      context.lineWidth = 0.7;
      context.strokeText("404", vanishingPoint, copyY);

      copy.style.left = `${vanishingPoint}px`;
      copy.style.top = `${copyY}px`;
      copy.style.transform = `translate(-50%,-50%) rotate(${(mouseX - 0.5) * 1.4}deg)`;

      frame = window.requestAnimationFrame(draw);
    };

    const move = (event: PointerEvent) => {
      targetX = event.clientX / width;
      targetY = event.clientY / height;
    };
    const leave = () => {
      targetX = 0.5;
      targetY = 0.5;
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <main className="not-found-scene">
      <canvas ref={canvasRef} aria-hidden="true" />
      <section ref={copyRef} className="not-found-copy">
        <h1>La página que buscás no está acá.</h1>
        <Link href="/">← Volver a juan.software</Link>
      </section>
    </main>
  );
}
