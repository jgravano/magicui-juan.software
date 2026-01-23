"use client"

import React from "react"

import { useEffect, useRef, useState, useCallback } from "react"

interface ScrollRhythmOptions {
  speed?: number // 0.5 = slower, 1 = normal, 1.5 = faster
  offset?: number // Parallax offset multiplier
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollRhythm<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRhythmOptions = {}
) {
  const {
    speed = 1,
    offset = 0,
    threshold = 0.1,
    rootMargin = "-50px",
    triggerOnce = true,
  } = options

  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)
  const [parallaxY, setParallaxY] = useState(0)
  const [progress, setProgress] = useState(0) // 0 to 1, how far through viewport

  const handleScroll = useCallback(() => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    
    // Calculate progress: 0 when entering bottom, 1 when leaving top
    const elementCenter = rect.top + rect.height / 2
    const rawProgress = 1 - (elementCenter / windowHeight)
    const clampedProgress = Math.max(0, Math.min(1, rawProgress))
    
    setProgress(clampedProgress)
    
    // Parallax calculation
    if (offset !== 0) {
      const parallaxValue = (clampedProgress - 0.5) * offset * 100
      setParallaxY(parallaxValue)
    }
  }, [offset])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (!triggerOnce) {
            window.addEventListener("scroll", handleScroll, { passive: true })
            handleScroll()
          }
        } else if (!triggerOnce) {
          setIsInView(false)
          window.removeEventListener("scroll", handleScroll)
        }
        
        if (triggerOnce && entry.isIntersecting) {
          window.addEventListener("scroll", handleScroll, { passive: true })
          handleScroll()
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [threshold, rootMargin, triggerOnce, handleScroll])

  // Generate CSS variables for the element
  const scrollStyles = {
    "--scroll-progress": progress,
    "--parallax-y": `${parallaxY}px`,
    "--scroll-speed": speed,
  } as React.CSSProperties

  return { ref, isInView, progress, parallaxY, scrollStyles }
}

// Hook for staggered children reveals with scroll rhythm
export function useStaggeredReveal<T extends HTMLElement = HTMLDivElement>(
  itemCount: number,
  options: { baseDelay?: number; stagger?: number } = {}
) {
  const { baseDelay = 0, stagger = 80 } = options
  const { ref, isInView } = useScrollRhythm<T>()

  const getItemDelay = (index: number) => baseDelay + index * stagger

  return { ref, isInView, getItemDelay }
}

// Hook for text line reveals
export function useLineReveal(text: string) {
  const lines = text.split("\n").filter(Boolean)
  const { ref, isInView } = useScrollRhythm<HTMLDivElement>()

  return { ref, isInView, lines }
}

// Hook for word-by-word reveals
export function useWordReveal(text: string) {
  const words = text.split(" ")
  const { ref, isInView } = useScrollRhythm<HTMLDivElement>()

  return { ref, isInView, words }
}
