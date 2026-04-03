"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DevcastProvider } from "@/components/devcast-provider"
import { TerminalView } from "@/components/terminal"

function TerminalPage() {
  const searchParams = useSearchParams()
  const port = searchParams.get("port")
  const tunnel = searchParams.get("tunnel")

  let wsUrl: string | null = null
  if (tunnel) {
    wsUrl = tunnel.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://")
  } else if (port) {
    wsUrl = `ws://localhost:${port}`
  }

  if (!wsUrl) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#1a1a1a] text-neutral-400">
        <p>No connection URL. Use ?port= or ?tunnel= to connect.</p>
      </div>
    )
  }

  return (
    <DevcastProvider wsUrl={wsUrl}>
      <TerminalView />
    </DevcastProvider>
  )
}

export default function Page() {
  return (
    <Suspense>
      <div className="h-dvh w-full overflow-hidden bg-[#1a1a1a]">
        <TerminalPage />
      </div>
    </Suspense>
  )
}
