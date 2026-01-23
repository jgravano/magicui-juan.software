"use client"

import React from "react"

import { useScrollRhythm } from "@/hooks/use-scroll-rhythm"
import { getWordRevealStyles, getLineRevealStyles, STAGGER } from "@/lib/motion"

interface AnimatedWordsProps {
  text: string
  className?: string
  baseDelay?: number
  as?: "h1" | "h2" | "h3" | "p" | "span"
}

export function AnimatedWords({
  text,
  className = "",
  baseDelay = 0,
  as: Tag = "span",
}: AnimatedWordsProps) {
  const words = text.split(" ")
  const { ref, isInView } = useScrollRhythm<HTMLDivElement>()

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden">
          <span
            className="inline-block"
            style={getWordRevealStyles(isInView, index, baseDelay)}
          >
            {word}
          </span>
          {index < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </Tag>
  )
}

interface AnimatedLinesProps {
  lines: string[]
  className?: string
  lineClassName?: string
  baseDelay?: number
}

export function AnimatedLines({
  lines,
  className = "",
  lineClassName = "",
  baseDelay = 0,
}: AnimatedLinesProps) {
  const { ref, isInView } = useScrollRhythm<HTMLDivElement>()

  return (
    <div ref={ref} className={className}>
      {lines.map((line, index) => (
        <div key={index} className="overflow-hidden">
          <div
            className={lineClassName}
            style={getLineRevealStyles(isInView, index, baseDelay)}
          >
            {line}
          </div>
        </div>
      ))}
    </div>
  )
}

interface AnimatedCharactersProps {
  text: string
  className?: string
  charClassName?: string
  baseDelay?: number
}

export function AnimatedCharacters({
  text,
  className = "",
  charClassName = "",
  baseDelay = 0,
}: AnimatedCharactersProps) {
  const characters = text.split("")
  const { ref, isInView } = useScrollRhythm<HTMLDivElement>()

  return (
    <span ref={ref} className={className}>
      {characters.map((char, index) => (
        <span
          key={index}
          className={`inline-block ${charClassName}`}
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(100%)",
            transition: `opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) ${baseDelay + index * STAGGER.tight}ms, transform 400ms cubic-bezier(0.23, 1, 0.32, 1) ${baseDelay + index * STAGGER.tight}ms`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )
}

interface ParallaxTextProps {
  children: React.ReactNode
  className?: string
  offset?: number
}

export function ParallaxText({
  children,
  className = "",
  offset = 0.15,
}: ParallaxTextProps) {
  const { ref, scrollStyles } = useScrollRhythm<HTMLDivElement>({
    offset,
    triggerOnce: false,
  })

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...scrollStyles,
        transform: `translateY(var(--parallax-y))`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}
