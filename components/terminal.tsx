"use client"

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebglAddon } from "@xterm/addon-webgl"
import { Unicode11Addon } from "@xterm/addon-unicode11"
import { WebLinksAddon } from "@xterm/addon-web-links"
import "@xterm/xterm/css/xterm.css"

import { useDevcast } from "@/components/devcast-provider"
import { setupTouchScroll } from "@/lib/touch-scroll"

const FONT_FAMILY = "'Geist Mono', 'Menlo', 'Courier New', monospace"

function getFontSize() {
  if (window.matchMedia("(max-width: 640px)").matches) return 11
  if (window.matchMedia("(max-width: 1024px)").matches) return 13
  return 14
}

// Flow control constants
const FLOW_LIMIT = 100000
const HIGH_WATER = 10
const LOW_WATER = 4

const textEncoder = new TextEncoder()

export function TerminalView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const connection = useDevcast()

  useEffect(() => {
    if (!containerRef.current) return

    let disposed = false
    const container = containerRef.current

    async function init() {
      const fontSize = getFontSize()
      await document.fonts.load(`${fontSize}px ${FONT_FAMILY}`)
      await document.fonts.load(`bold ${fontSize}px ${FONT_FAMILY}`)

      if (disposed) return

      const term = new Terminal({
        cursorBlink: true,
        fontFamily: FONT_FAMILY,
        fontSize,
        customGlyphs: true,
        rescaleOverlappingGlyphs: true,
        allowProposedApi: true,
        scrollback: 5000,
        theme: {
          background: "#1a1a1a",
          foreground: "#e0e0e0",
          cursor: "#e0e0e0",
        },
      })

      const unicode11 = new Unicode11Addon()
      term.loadAddon(unicode11)
      term.unicode.activeVersion = "11"

      term.loadAddon(new WebLinksAddon())

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      term.open(container)

      try {
        const webgl = new WebglAddon()
        webgl.onContextLoss(() => webgl.dispose())
        term.loadAddon(webgl)
      } catch {
        // canvas fallback
      }

      fitAddon.fit()

      // Send initial resize so backend spawns PTY at correct dimensions
      connection.sendTerminalResize(term.cols, term.rows)

      // Touch scroll handling
      const cleanupTouch = setupTouchScroll(
        container,
        term,
        connection.sendTerminalInput,
      )

      // Flow control state
      let written = 0
      let pending = 0
      let paused = false

      // Receive terminal output from the shared connection
      const unsubOutput = connection.onTerminalOutput((data) => {
        written += data.length
        if (written > FLOW_LIMIT) {
          pending++
          term.write(data, () => {
            pending--
            if (paused && pending < LOW_WATER) {
              paused = false
              connection.sendFlowResume()
            }
          })
          if (!paused && pending > HIGH_WATER) {
            paused = true
            connection.sendFlowPause()
          }
        } else {
          term.write(data)
        }
      })

      // Connection status changes
      const unsubStatus = connection.onStatusChange((status) => {
        if (status === "disconnected") {
          term.write("\r\n\x1b[31m[Connection closed]\x1b[0m\r\n")
        } else if (status === "error") {
          term.write("\r\n\x1b[31m[Connection error]\x1b[0m\r\n")
        }
      })

      // Terminal input -> server
      term.onData((data) => {
        connection.sendTerminalInput(textEncoder.encode(data))
      })

      // Resize -> server
      term.onResize(({ cols, rows }) => {
        connection.sendTerminalResize(cols, rows)
      })

      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit()
      })
      resizeObserver.observe(container)

      term.focus()

      return () => {
        cleanupTouch()
        unsubOutput()
        unsubStatus()
        resizeObserver.disconnect()
        term.dispose()
      }
    }

    let cleanup: (() => void) | undefined
    init().then((c) => {
      if (disposed) {
        c?.()
      } else {
        cleanup = c
      }
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [connection])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ touchAction: "none", userSelect: "none", padding: 0 }}
    />
  )
}
