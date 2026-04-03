"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Keyboard, KeyboardOff } from "lucide-react"
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
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false)
        onTap()
      }}
      onPointerLeave={() => setPressed(false)}
      className={`flex h-7 min-w-7 select-none items-center justify-center rounded-[3px] px-2 text-xs ${className ?? ""}`}
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
  const inputRef = useRef<HTMLInputElement>(null)
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

  // Forward keystrokes from our hidden input to the terminal
  useEffect(() => {
    const input = inputRef.current
    if (!input) return

    const onInput = (e: Event) => {
      const ie = e as InputEvent
      if (ie.data) {
        if (ctrlActiveRef.current) {
          const byte = ctrlByte(ie.data)
          if (byte !== null) {
            connection.sendTerminalInput(new Uint8Array([byte]))
            setCtrlActive(false)
          }
        } else {
          connection.sendTerminalInput(textEncoder.encode(ie.data))
        }
      }
      // Always clear so the next keystroke fires a fresh input event
      input.value = ""
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl intercept for non-printable keys handled by the capture listener,
      // but handle special keys here
      switch (e.key) {
        case "Backspace":
          e.preventDefault()
          send([0x7f])
          break
        case "Enter":
          e.preventDefault()
          send("\r")
          break
        case "Escape":
          e.preventDefault()
          send("\x1b")
          break
        case "Tab":
          e.preventDefault()
          send("\t")
          break
        case "ArrowUp":
          e.preventDefault()
          send(ctrlActiveRef.current ? "\x1b[1;5A" : "\x1b[A")
          if (ctrlActiveRef.current) setCtrlActive(false)
          break
        case "ArrowDown":
          e.preventDefault()
          send(ctrlActiveRef.current ? "\x1b[1;5B" : "\x1b[B")
          if (ctrlActiveRef.current) setCtrlActive(false)
          break
        case "ArrowLeft":
          e.preventDefault()
          send(ctrlActiveRef.current ? "\x1b[1;5D" : "\x1b[D")
          if (ctrlActiveRef.current) setCtrlActive(false)
          break
        case "ArrowRight":
          e.preventDefault()
          send(ctrlActiveRef.current ? "\x1b[1;5C" : "\x1b[C")
          if (ctrlActiveRef.current) setCtrlActive(false)
          break
      }
    }

    input.addEventListener("input", onInput)
    input.addEventListener("keydown", onKeyDown)
    return () => {
      input.removeEventListener("input", onInput)
      input.removeEventListener("keydown", onKeyDown)
    }
  }, [connection, send])

  // Sync keyboardOpen state if the input loses focus externally
  useEffect(() => {
    const input = inputRef.current
    if (!input) return

    const onBlur = () => setKeyboardOpen(false)
    input.addEventListener("blur", onBlur)
    return () => input.removeEventListener("blur", onBlur)
  }, [])

  const toggleKeyboard = useCallback(() => {
    const input = inputRef.current
    if (!input) return

    if (keyboardOpen) {
      input.blur()
      setKeyboardOpen(false)
    } else {
      input.focus()
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

  return (
    <div className="relative flex items-center justify-between bg-background px-3 py-2 md:hidden">
      {/* Hidden input for iOS keyboard capture — must be in-viewport for iOS to keep keyboard open */}
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="send"
        aria-hidden
        tabIndex={-1}
        className="absolute left-0 top-0 h-1 w-1 opacity-0"
      />

      <div className="flex items-center gap-1.5">
        <Keycap onTap={() => send("\x1b")}>Esc</Keycap>
        <Keycap onTap={() => send("\t")}>Tab</Keycap>
        <Keycap
          onTap={() => setCtrlActive((v) => !v)}
          active={ctrlActive}
        >
          Ctrl
        </Keycap>
        <Keycap onTap={() => handleArrow("A")}>↑</Keycap>
        <Keycap onTap={() => handleArrow("B")}>↓</Keycap>
        <Keycap onTap={() => handleArrow("D")}>←</Keycap>
        <Keycap onTap={() => handleArrow("C")}>→</Keycap>
      </div>
      {/* Use onTouchEnd with preventDefault to stop iOS from stealing focus */}
      <kbd
        onTouchEnd={(e) => {
          e.preventDefault()
          toggleKeyboard()
        }}
        className="flex h-7 min-w-7 select-none items-center justify-center rounded-[3px] px-2 text-xs"
        style={{
          background: KEY_GRADIENT,
          boxShadow: KEY_SHADOW,
          color: "rgb(138, 139, 143)",
        }}
      >
        {keyboardOpen ? (
          <KeyboardOff size={14} />
        ) : (
          <Keyboard size={14} />
        )}
      </kbd>
    </div>
  )
}
