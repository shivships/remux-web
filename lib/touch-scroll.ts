import type { Terminal } from "@xterm/xterm"

const MOMENTUM_DECAY = 0.994
const MOMENTUM_STOP_VELOCITY = 100
const MOMENTUM_START_VELOCITY = 50
const TAP_MAX_DURATION = 300
const TAP_MAX_DISTANCE = 10
const VELOCITY_SAMPLE_COUNT = 5

interface TouchSample {
  time: number
  y: number
}

const textEncoder = new TextEncoder()

export function setupTouchScroll(
  container: HTMLElement,
  term: Terminal,
  sendInput: (data: Uint8Array) => void,
): () => void {
  let cellHeight = container.clientHeight / term.rows
  let scrollAccum = 0
  let altBufferAccum = 0
  let momentumId: number | null = null
  let velocity = 0

  let lastTouchY = 0
  let touchStartY = 0
  let touchStartTime = 0
  const recentMoves: TouchSample[] = []

  const resizeDisposable = term.onResize(() => {
    cellHeight = container.clientHeight / term.rows
  })

  function cancelMomentum() {
    if (momentumId !== null) {
      cancelAnimationFrame(momentumId)
      momentumId = null
    }
  }

  function doScroll(deltaPixels: number) {
    if (!cellHeight || cellHeight <= 0) return
    const lines = -deltaPixels / cellHeight

    if (
      term.buffer &&
      term.buffer.active &&
      term.buffer.active.type === "alternate"
    ) {
      altBufferAccum += lines
      const wholeLines = Math.trunc(altBufferAccum)
      if (wholeLines !== 0) {
        altBufferAccum -= wholeLines
        const key = wholeLines < 0 ? "\x1b[A" : "\x1b[B"
        for (let i = 0; i < Math.abs(wholeLines); i++) {
          sendInput(textEncoder.encode(key))
        }
      }
      return
    }

    scrollAccum += lines
    const wholeLines = Math.trunc(scrollAccum)
    if (wholeLines !== 0) {
      scrollAccum -= wholeLines
      term.scrollLines(wholeLines)
    }
  }

  function startMomentum(vel: number) {
    velocity = vel
    let lastFrameTime = performance.now()

    function frame() {
      const now = performance.now()
      const elapsed = now - lastFrameTime
      lastFrameTime = now

      velocity *= Math.pow(MOMENTUM_DECAY, elapsed)

      if (Math.abs(velocity) < MOMENTUM_STOP_VELOCITY) {
        momentumId = null
        return
      }

      doScroll(velocity * (elapsed / 1000))
      momentumId = requestAnimationFrame(frame)
    }

    momentumId = requestAnimationFrame(frame)
  }

  function onTouchStart(e: TouchEvent) {
    cancelMomentum()
    scrollAccum = 0
    altBufferAccum = 0
    lastTouchY = e.touches[0].clientY
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
    recentMoves.length = 0
    e.preventDefault()
  }

  function onTouchMove(e: TouchEvent) {
    const y = e.touches[0].clientY
    const deltaY = y - lastTouchY
    lastTouchY = y

    recentMoves.push({ time: Date.now(), y })
    if (recentMoves.length > VELOCITY_SAMPLE_COUNT) {
      recentMoves.shift()
    }

    doScroll(deltaY)
    e.preventDefault()
  }

  function onTouchEnd(e: TouchEvent) {
    const endY = e.changedTouches[0].clientY
    const elapsed = Date.now() - touchStartTime
    const distance = Math.abs(endY - touchStartY)

    // Tap detection — focus terminal to open keyboard
    if (elapsed < TAP_MAX_DURATION && distance < TAP_MAX_DISTANCE) {
      term.focus()
      return
    }

    // Calculate velocity from recent samples
    if (recentMoves.length >= 2) {
      const first = recentMoves[0]
      const last = recentMoves[recentMoves.length - 1]
      const dt = last.time - first.time
      if (dt > 0) {
        const vel = ((last.y - first.y) / dt) * 1000 // px/s
        if (Math.abs(vel) > MOMENTUM_START_VELOCITY) {
          startMomentum(vel)
        }
      }
    }
  }

  container.addEventListener("touchstart", onTouchStart, { passive: false })
  container.addEventListener("touchmove", onTouchMove, { passive: false })
  container.addEventListener("touchend", onTouchEnd)

  return () => {
    container.removeEventListener("touchstart", onTouchStart)
    container.removeEventListener("touchmove", onTouchMove)
    container.removeEventListener("touchend", onTouchEnd)
    cancelMomentum()
    resizeDisposable.dispose()
  }
}
