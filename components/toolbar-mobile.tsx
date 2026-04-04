"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  ClipboardPaste,
  Keyboard,
  KeyboardOff,
} from "lucide-react"
import { useDevcast } from "@/components/devcast-provider"

const textEncoder = new TextEncoder()

const KEY_SHADOW =
  "inset 0 -2px 0 0 rgb(28, 29, 33), inset 0 0 1px 1px rgb(48, 49, 53), 0 2px 2px 0 rgba(3, 4, 9, 0.3)"
const KEY_PRESSED_SHADOW =
  "inset 0 -2px 0 0 rgb(28, 29, 33), inset 0 0 1px 1px rgb(48, 49, 53), 0 1px 1px 0 rgba(3, 4, 9, 0.5)"
const KEY_GRADIENT =
  "linear-gradient(-26.5deg, rgb(38, 39, 43) 0%, rgb(58, 59, 63) 100%)"

function Keycap({
  children,
  onTap,
  active,
  className,
}: {
  children: React.ReactNode
  onTap: () => void
  active?: boolean
  className?: string
}) {
  const [pressed, setPressed] = useState(false)

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
      className={`flex h-10 min-w-10 select-none items-center justify-center rounded-[4px] px-3 text-sm ${className ?? ""}`}
      style={{
        background: active
          ? "linear-gradient(-26.5deg, rgb(58, 59, 63) 0%, rgb(78, 79, 83) 100%)"
          : KEY_GRADIENT,
        boxShadow: pressed ? KEY_PRESSED_SHADOW : KEY_SHADOW,
        transform: pressed ? "translate3d(0, 1px, 0)" : undefined,
        color: active ? "rgb(200, 200, 210)" : "rgb(138, 139, 143)",
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
  const connection = useDevcast()
  const [ctrlActive, setCtrlActive] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const ctrlActiveRef = useRef(ctrlActive)
  ctrlActiveRef.current = ctrlActive

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

  // Intercept next keystroke when Ctrl is active
  useEffect(() => {
    if (!ctrlActive) return

    const handler = (e: KeyboardEvent) => {
      const byte = ctrlByte(e.key)
      if (byte !== null) {
        e.preventDefault()
        e.stopPropagation()
        connection.sendTerminalInput(new Uint8Array([byte]))
        setCtrlActive(false)
      }
    }

    document.addEventListener("keydown", handler, true)
    return () => document.removeEventListener("keydown", handler, true)
  }, [ctrlActive, connection])

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
      if (ctrlActiveRef.current) {
        send(`\x1b[1;5${code}`)
        setCtrlActive(false)
      } else {
        send(`\x1b[${code}`)
      }
    },
    [send],
  )

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) send(text)
    } catch {
      // clipboard permission denied
    }
  }, [send])

  return (
    <div className="flex items-center justify-between bg-background px-3 py-2 md:hidden">
      <div
        className="flex min-w-0 items-center gap-1.5 overflow-x-auto"
        style={{
          maskImage: "linear-gradient(to right, black calc(100% - 24px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, black calc(100% - 24px), transparent)",
        }}
      >
        <Keycap onTap={() => send("\x1b")}>Esc</Keycap>
        <Keycap onTap={() => send("\t")}>Tab</Keycap>
        <Keycap
          onTap={() => setCtrlActive((v) => !v)}
          active={ctrlActive}
        >
          Ctr
        </Keycap>
        <Keycap onTap={() => handleArrow("A")}><ChevronUp size={18} /></Keycap>
        <Keycap onTap={() => handleArrow("B")}><ChevronDown size={18} /></Keycap>
        <Keycap onTap={() => handleArrow("D")}><ChevronLeft size={18} /></Keycap>
        <Keycap onTap={() => handleArrow("C")}><ChevronRight size={18} /></Keycap>
        <Keycap onTap={() => send("\r")}><CornerDownLeft size={18} /></Keycap>
        <div className="shrink-0 w-6" aria-hidden />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-1.5">
        <Keycap onTap={handlePaste}><ClipboardPaste size={18} /></Keycap>
        <kbd
          onPointerDown={(e) => e.preventDefault()}
          onTouchEnd={(e) => {
            e.preventDefault()
            toggleKeyboard()
          }}
          className="flex h-10 min-w-10 select-none items-center justify-center rounded-[4px] px-3 text-sm"
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
