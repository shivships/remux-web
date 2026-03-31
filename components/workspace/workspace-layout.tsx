"use client"

import { useSearchParams } from "next/navigation"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { FileTree } from "@/components/workspace/file-tree"
import { SidebarHeader } from "@/components/workspace/sidebar-header"
import { TerminalView } from "@/components/terminal"
import { DevcastProvider } from "@/components/workspace/devcast-provider"

export function WorkspaceLayout() {
  const searchParams = useSearchParams()
  const port = searchParams.get("port")
  const tunnel = searchParams.get("tunnel")

  const wsUrl = tunnel
    ? tunnel.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://")
    : port
      ? `ws://localhost:${port}`
      : null

  if (!wsUrl) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="text-center text-sm text-muted-foreground">
          <p>No connection specified.</p>
          <p className="mt-1">
            Run <code className="text-foreground">devcast</code> and open the
            link it provides.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DevcastProvider wsUrl={wsUrl}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="w-full min-h-dvh bg-border"
      >
        <ResizablePanel defaultSize="20%" minSize="10%" maxSize="40%">
          <div className="flex h-full flex-col bg-card">
            <SidebarHeader />
            <FileTree />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="80%">
          <div className="h-full bg-background">
            <TerminalView />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </DevcastProvider>
  )
}
