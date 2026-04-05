"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DevcastProvider } from "@/components/devcast-provider"
import { TerminalView } from "@/components/terminal"
import { ToolbarMobile } from "@/components/toolbar-mobile"

function TerminalPage() {
  const searchParams = useSearchParams()
  const port = searchParams.get("port")
  const tunnel = searchParams.get("tunnel")

  // Track visual viewport height via CSS custom property (no React re-renders).
  // This lets the container shrink when the iOS keyboard opens without
  // causing re-render storms that would steal focus from the hidden input.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    if (!window.matchMedia("(max-width: 768px)").matches) return

    const update = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`)
    }
    update()

    vv.addEventListener("resize", update)
    return () => {
      vv.removeEventListener("resize", update)
      document.documentElement.style.removeProperty("--vvh")
    }
  }, [])

  let wsUrl: string | null = null
  if (tunnel) {
    wsUrl = tunnel.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://")
  } else if (port) {
    wsUrl = `ws://localhost:${port}`
  }

  if (!wsUrl) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-neutral-400">
        <p>No connection URL. Use ?port= or ?tunnel= to connect.</p>
      </div>
    )
  }

  return (
    <DevcastProvider wsUrl={wsUrl}>
      <div
        className="flex flex-col"
        style={{ height: "var(--vvh, 100dvh)" }}
      >
        <div className="min-h-0 flex-1">
          <TerminalView />
        </div>
        <ToolbarMobile />
      </div>
    </DevcastProvider>
  )
}

export default function Page() {
  return (
    <Suspense>
      <div className="h-dvh w-full overflow-hidden bg-background">
        <TerminalPage />
      </div>
    </Suspense>
  )
}
