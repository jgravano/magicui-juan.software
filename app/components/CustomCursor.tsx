"use client"

import { useEffect, useRef, useState } from "react"

type CursorState = "default" | "link" | "card" | "text"

const DEBUG_CURSOR = false
const LERP_FACTOR = 0.18

const lerp = (start: number, end: number, factor: number) =>
  start + (end - start) * factor

const getCursorState = (value: string | null): CursorState => {
  if (value === "link" || value === "card" || value === "text") {
    return value
  }
  return "default"
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const currentRef = useRef({ x: -100, y: -100 })
  const targetRef = useRef({ x: -100, y: -100 })
  const visibleRef = useRef(false)
  const stateRef = useRef<CursorState>("default")
  const labelRef = useRef("")

  const [isEnabled, setIsEnabled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [cursorState, setCursorState] = useState<CursorState>("default")
  const [labelText, setLabelText] = useState("")

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)")
    const handleChange = () => setIsEnabled(media.matches)
    handleChange()
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (isEnabled) {
      root.classList.add("custom-cursor-on")
    } else {
      root.classList.remove("custom-cursor-on")
    }
    return () => root.classList.remove("custom-cursor-on")
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled) return

    const updateState = (nextState: CursorState) => {
      if (stateRef.current !== nextState) {
        stateRef.current = nextState
        setCursorState(nextState)
      }
      const nextLabel = nextState === "link" ? "open" : ""
      if (labelRef.current !== nextLabel) {
        labelRef.current = nextLabel
        setLabelText(nextLabel)
      }
    }

    const animate = () => {
      const current = currentRef.current
      const target = targetRef.current
      current.x = lerp(current.x, target.x, LERP_FACTOR)
      current.y = lerp(current.y, target.y, LERP_FACTOR)

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`
      }

      const distance =
        Math.abs(target.x - current.x) + Math.abs(target.y - current.y)
      if (distance > 0.1) {
        rafRef.current = window.requestAnimationFrame(animate)
      } else {
        rafRef.current = null
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY }
      if (!visibleRef.current) {
        currentRef.current = { x: event.clientX, y: event.clientY }
        visibleRef.current = true
        setIsVisible(true)
      }
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(animate)
      }
    }

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const cursorTarget = target.closest("[data-cursor]")
      const cursorValue = cursorTarget?.getAttribute("data-cursor") ?? null
      updateState(getCursorState(cursorValue))
    }

    const handlePointerOut = (event: PointerEvent) => {
      const related = event.relatedTarget as HTMLElement | null
      if (related?.closest("[data-cursor]")) return
      updateState("default")
    }

    const handlePointerLeave = () => {
      if (!visibleRef.current) return
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
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave
      )
      window.removeEventListener("blur", handlePointerLeave)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isEnabled])

  if (!isEnabled) return null

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      data-state={cursorState}
      data-visible={isVisible ? "true" : "false"}
      aria-hidden
    >
      <span className="custom-cursor__label">{labelText}</span>
      {DEBUG_CURSOR && (
        <span className="custom-cursor__debug">{cursorState}</span>
      )}
    </div>
  )
}
