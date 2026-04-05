"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { RemuxProvider } from "@/components/remux-provider"
import { TerminalView } from "@/components/terminal"
import { ToolbarMobile } from "@/components/toolbar-mobile"
import { ConnectionOverlay } from "@/components/connection-overlay"

export default function SlugPage() {
  const { slug } = useParams<{ slug: string }>()

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

  const wsUrl = `wss://${slug}.trycloudflare.com`

  return (
    <RemuxProvider wsUrl={wsUrl}>
      <div
        className="relative flex flex-col"
        style={{ height: "var(--vvh, 100dvh)" }}
      >
        <div className="min-h-0 flex-1">
          <TerminalView />
        </div>
        <ToolbarMobile />
        <ConnectionOverlay />
      </div>
    </RemuxProvider>
  )
}
