"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowBigUp,
  CornerDownLeft,
  ClipboardPaste,
  Keyboard,
  KeyboardOff,
} from "lucide-react"
import { useRemux } from "@/components/remux-provider"

const textEncoder = new TextEncoder()

// Sculpted keycap: lighter top face, darker side walls, thick bottom ledge
const KEY_SHADOW = [
  "inset 0 1px 0 0 rgba(255,255,255,0.07)",   // top edge highlight
  "inset 0 -1px 1px 0 rgba(0,0,0,0.15)",      // concave bottom of top face
  "-1px 0 0 0 #1a1a1a",                        // left wall
  "1px 0 0 0 #1a1a1a",                         // right wall
  "0 3px 0 0 #141414",                         // bottom ledge (depth)
  "0 4px 4px 0 rgba(0,0,0,0.35)",              // drop shadow
].join(", ")
const KEY_PRESSED_SHADOW = [
  "inset 0 1px 0 0 rgba(255,255,255,0.05)",
  "inset 0 -1px 1px 0 rgba(0,0,0,0.1)",
  "-1px 0 0 0 #1a1a1a",
  "1px 0 0 0 #1a1a1a",
  "0 1px 0 0 #141414",                         // ledge compresses
  "0 2px 2px 0 rgba(0,0,0,0.25)",
].join(", ")
const KEY_GRADIENT = "linear-gradient(180deg, #383838 0%, #2c2c2c 100%)"

// Accent keycap (Esc) — deep burnt orange, same sculpted shape
const ACCENT_GRADIENT = "linear-gradient(180deg, #7a3626 0%, #632c1e 100%)"
const ACCENT_SHADOW = [
  "inset 0 1px 0 0 rgba(255,160,120,0.1)",
  "inset 0 -1px 1px 0 rgba(0,0,0,0.2)",
  "-1px 0 0 0 #3d1a10",
  "1px 0 0 0 #3d1a10",
  "0 3px 0 0 #2a120b",
  "0 4px 4px 0 rgba(0,0,0,0.35)",
].join(", ")
const ACCENT_PRESSED_SHADOW = [
  "inset 0 1px 0 0 rgba(255,160,120,0.07)",
  "inset 0 -1px 1px 0 rgba(0,0,0,0.15)",
  "-1px 0 0 0 #3d1a10",
  "1px 0 0 0 #3d1a10",
  "0 1px 0 0 #2a120b",
  "0 2px 2px 0 rgba(0,0,0,0.25)",
].join(", ")

function Keycap({
  children,
  onTap,
  active,
  accent,
  className,
}: {
  children: React.ReactNode
  onTap: () => void
  active?: boolean
  accent?: boolean
  className?: string
}) {
  const [pressed, setPressed] = useState(false)

  const bg = accent
    ? ACCENT_GRADIENT
    : active
      ? "linear-gradient(180deg, #484848 0%, #3c3c3c 100%)"
      : KEY_GRADIENT
  const shadow = accent
    ? (pressed ? ACCENT_PRESSED_SHADOW : ACCENT_SHADOW)
    : (pressed ? KEY_PRESSED_SHADOW : KEY_SHADOW)

  return (
    <kbd
      onPointerDown={(e) => {
        e.preventDefault()
        setPressed(true)
      }}
      onPointerUp={() => {
        setPressed(false)
        onTap()
      }}
      onPointerLeave={() => setPressed(false)}
      className={`flex h-10 min-w-10 select-none items-center justify-center rounded-[6px] px-3 text-sm ${className ?? ""}`}
      style={{
        background: bg,
        boxShadow: shadow,
        transform: pressed ? "translate3d(0, 2px, 0)" : undefined,
        color: active ? "rgb(210, 210, 220)" : "rgb(150, 150, 155)",
      }}
    >
      {children}
    </kbd>
  )
}

// Ctrl+key byte: a=1, b=2, ... z=26
function ctrlByte(key: string): number | null {
  const code = key.toLowerCase().charCodeAt(0)
  if (code >= 97 && code <= 122) return code - 96
  return null
}

export function ToolbarMobile() {
  const connection = useRemux()
  const [ctrlActive, setCtrlActive] = useState(false)
  const [altActive, setAltActive] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const ctrlActiveRef = useRef(ctrlActive)
  ctrlActiveRef.current = ctrlActive
  const altActiveRef = useRef(altActive)
  altActiveRef.current = altActive

  const resetModifiers = useCallback(() => {
    setCtrlActive(false)
    setAltActive(false)
  }, [])

  const send = useCallback(
    (data: string | number[]) => {
      if (typeof data === "string") {
        connection.sendTerminalInput(textEncoder.encode(data))
      } else {
        connection.sendTerminalInput(new Uint8Array(data))
      }
    },
    [connection],
  )

  // Intercept next keystroke when a modifier is active
  useEffect(() => {
    if (!ctrlActive && !altActive) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Alt" || e.key === "Shift" || e.key === "Meta") return
      if (e.repeat) return

      e.preventDefault()
      e.stopPropagation()

      const bytes: number[] = []

      if (ctrlActive) {
        const cb = ctrlByte(e.key)
        if (cb !== null) {
          if (altActive) bytes.push(0x1b)
          bytes.push(cb)
        } else if (altActive && e.key.length === 1) {
          bytes.push(0x1b, e.key.charCodeAt(0))
        }
      } else if (altActive && e.key.length === 1) {
        bytes.push(0x1b, e.key.charCodeAt(0))
      }

      if (bytes.length > 0) {
        connection.sendTerminalInput(new Uint8Array(bytes))
      }
      resetModifiers()
    }

    document.addEventListener("keydown", handler, true)
    return () => document.removeEventListener("keydown", handler, true)
  }, [ctrlActive, altActive, connection, resetModifiers])

  // Sync keyboard state when xterm's textarea loses focus by any means
  // (our button, iOS native dismiss, tap elsewhere, etc.).
  // Uses document-level focusout so we don't need to find the textarea at mount time.
  useEffect(() => {
    const onFocusOut = (e: FocusEvent) => {
      const target = e.target as Element | null
      if (target?.classList?.contains("xterm-helper-textarea")) {
        setKeyboardOpen(false)
        ;(target as HTMLTextAreaElement).setAttribute("inputmode", "none")
      }
    }

    document.addEventListener("focusout", onFocusOut)
    return () => document.removeEventListener("focusout", onFocusOut)
  }, [])

  const toggleKeyboard = useCallback(() => {
    const textarea = document.querySelector(
      ".xterm-helper-textarea",
    ) as HTMLTextAreaElement | null
    if (!textarea) return

    if (keyboardOpen) {
      textarea.setAttribute("inputmode", "none")
      textarea.blur()
      setKeyboardOpen(false)
    } else {
      textarea.removeAttribute("inputmode")
      textarea.setAttribute("autocomplete", "off")
      textarea.setAttribute("autocorrect", "off")
      textarea.setAttribute("autocapitalize", "off")
      textarea.setAttribute("spellcheck", "false")
      // Temporarily move textarea far above viewport so iOS Safari
      // can't scroll to it, then focus, then reset position.
      textarea.style.transform = "translateY(-9999px)"
      textarea.focus({ preventScroll: true })
      setTimeout(() => {
        textarea.style.transform = ""
      }, 0)
      setKeyboardOpen(true)
    }
  }, [keyboardOpen])

  const handleArrow = useCallback(
    (code: string) => {
      const mod = (ctrlActiveRef.current ? 4 : 0) + (altActiveRef.current ? 2 : 0)
      if (mod > 0) {
        send(`\x1b[1;${mod + 1}${code}`)
        resetModifiers()
      } else {
        send(`\x1b[${code}`)
      }
    },
    [send, resetModifiers],
  )

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) send(text)
    } catch {
      // clipboard permission denied
    }
    resetModifiers()
  }, [send, resetModifiers])

  return (
    <div className="flex items-center justify-between bg-background px-3 pt-0 pb-2 md:hidden">
      <div
        className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1"

      >
        <Keycap onTap={() => { send("\x1b"); resetModifiers() }} accent>Esc</Keycap>
        <Keycap onTap={() => { send("\t"); resetModifiers() }}>Tab</Keycap>
        <Keycap
          onTap={() => setCtrlActive((v) => !v)}
          active={ctrlActive}
        >
          Ctr
        </Keycap>
        <Keycap
          onTap={() => setAltActive((v) => !v)}
          active={altActive}
        >
          Alt
        </Keycap>
        <Keycap onTap={() => handleArrow("A")}><ChevronUp size={18} /></Keycap>
        <Keycap onTap={() => handleArrow("B")}><ChevronDown size={18} /></Keycap>
        <Keycap onTap={() => handleArrow("D")}><ChevronLeft size={18} /></Keycap>
        <Keycap onTap={() => handleArrow("C")}><ChevronRight size={18} /></Keycap>
        <Keycap onTap={() => { send(keyboardOpen ? "\x1b[13;2u" : "\r"); resetModifiers() }}>
          {keyboardOpen ? (
            <span className="flex items-center gap-0.5">
              <ArrowBigUp size={14} />
              <CornerDownLeft size={14} />
            </span>
          ) : (
            <CornerDownLeft size={18} />
          )}
        </Keycap>
        <Keycap onTap={() => { send("\x03"); resetModifiers() }}>^C</Keycap>
        <div className="shrink-0 w-6" aria-hidden />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-1.5 pb-1">
        <Keycap onTap={handlePaste}><ClipboardPaste size={18} /></Keycap>
        <kbd
          onPointerDown={(e) => e.preventDefault()}
          onTouchEnd={(e) => {
            e.preventDefault()
            toggleKeyboard()
          }}
          className="flex h-10 min-w-10 select-none items-center justify-center rounded-[6px] px-3 text-sm"
          style={{
            background: KEY_GRADIENT,
            boxShadow: KEY_SHADOW,
            color: "rgb(138, 139, 143)",
          }}
        >
          {keyboardOpen ? (
            <KeyboardOff size={18} />
          ) : (
            <Keyboard size={18} />
          )}
        </kbd>
      </div>
    </div>
  )
}
