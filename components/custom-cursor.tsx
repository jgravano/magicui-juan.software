"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

type CursorState = "default" | "link" | "card" | "text"

const DEBUG_CURSOR = false
const CURSOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
const CURSOR_DURATION_MS = 220

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number | null>(null)
  const positionRef = useRef({ x: -100, y: -100 })
  const stateRef = useRef<CursorState>("default")
  const labelTextRef = useRef("")
  const visibleRef = useRef(false)

  const [cursorState, setCursorState] = useState<CursorState>("default")
  const [labelText, setLabelText] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)")
    const handleChange = () => setIsEnabled(media.matches)
    handleChange()
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    if (!isEnabled) return
    document.body.dataset.customCursor = "true"
    return () => {
      delete document.body.dataset.customCursor
    }
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled) return

    const applyPosition = () => {
      const cursor = cursorRef.current
      if (!cursor) return
      const { x, y } = positionRef.current
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      rafRef.current = null
    }

    const handlePointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY }
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(applyPosition)
      }
      if (!visibleRef.current) {
        visibleRef.current = true
        setIsVisible(true)
      }
    }

    const updateState = (nextState: CursorState, nextLabel: string) => {
      if (stateRef.current !== nextState) {
        stateRef.current = nextState
        setCursorState(nextState)
      }
      if (labelTextRef.current !== nextLabel) {
        labelTextRef.current = nextLabel
        setLabelText(nextLabel)
      }
    }

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null
      const cursorType = (cursorTarget?.getAttribute("data-cursor") as CursorState) || "default"
      const rawLabel = cursorTarget?.getAttribute("data-cursor-label")
      const nextLabel = cursorType === "link" ? rawLabel ?? "open" : ""
      updateState(cursorType, nextLabel)
    }

    const handlePointerOut = (event: PointerEvent) => {
      const related = event.relatedTarget as HTMLElement | null
      if (related?.closest("[data-cursor]")) return
      updateState("default", "")
    }

    const handlePointerLeave = () => {
      visibleRef.current = false
      setIsVisible(false)
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: true })
    document.addEventListener("pointerover", handlePointerOver)
    document.addEventListener("pointerout", handlePointerOut)
    document.documentElement.addEventListener("pointerleave", handlePointerLeave)
    window.addEventListener("blur", handlePointerLeave)

    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerover", handlePointerOver)
      document.removeEventListener("pointerout", handlePointerOut)
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave)
      window.removeEventListener("blur", handlePointerLeave)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isEnabled])

  if (!isEnabled) return null

  const baseStyles = {
    opacity: isVisible ? 1 : 0,
    transition: `width ${CURSOR_DURATION_MS}ms ${CURSOR_EASING}, height ${CURSOR_DURATION_MS}ms ${CURSOR_EASING}, opacity ${CURSOR_DURATION_MS}ms ${CURSOR_EASING}, background-color ${CURSOR_DURATION_MS}ms ${CURSOR_EASING}, border-radius ${CURSOR_DURATION_MS}ms ${CURSOR_EASING}`,
  }

  const stateStyles: Record<CursorState, CSSProperties> = {
    default: {
      width: "10px",
      height: "10px",
      borderRadius: "999px",
      backgroundColor: "var(--foreground)",
      mixBlendMode: "difference",
    },
    link: {
      width: "28px",
      height: "28px",
      borderRadius: "999px",
      backgroundColor: "var(--foreground)",
      mixBlendMode: "difference",
    },
    card: {
      width: "56px",
      height: "18px",
      borderRadius: "999px",
      backgroundColor: "var(--foreground)",
      mixBlendMode: "difference",
    },
    text: {
      width: "12px",
      height: "12px",
      borderRadius: "999px",
      backgroundColor: "var(--cursor-text, var(--accent))",
      mixBlendMode: "normal",
    },
  }

  return (
    <>
      <style jsx global>{`
        @media (pointer: fine) {
          body[data-custom-cursor="true"] * {
            cursor: none;
          }
        }
      `}</style>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
        style={{ ...baseStyles, ...stateStyles[cursorState] }}
        aria-hidden
      >
        <span
          ref={labelRef}
          className="text-[10px] uppercase tracking-[0.25em] font-medium text-background"
          style={{
            opacity: cursorState === "link" && labelText.length > 0 ? 1 : 0,
            transition: `opacity ${CURSOR_DURATION_MS}ms ${CURSOR_EASING}`,
            mixBlendMode: "difference",
          }}
        >
          {labelText}
        </span>
      </div>
      {DEBUG_CURSOR && (
        <div className="fixed bottom-4 left-4 z-[10000] rounded-full bg-foreground text-background px-3 py-1 text-[11px] tracking-wide">
          cursor: {cursorState}
        </div>
      )}
    </>
  )
}
