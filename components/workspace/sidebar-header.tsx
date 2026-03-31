"use client"

import { useEffect, useState } from "react"
import { Search, Plus, ChevronsUpDown, Folder } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useDevcast } from "@/components/workspace/devcast-provider"

export function SidebarHeader() {
  const connection = useDevcast()
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)

  const isConnected = connection.status === "connected"

  useEffect(() => {
    if (!isConnected) return

    connection
      .getWorkspaceInfo()
      .then((info) => {
        const parts = info.path.split("/")
        setWorkspacePath(parts[parts.length - 1] || info.path)
      })
      .catch(() => {})
  }, [connection, isConnected])

  return (
    <div className="flex items-center justify-between gap-1 px-2 py-2">
      <ButtonGroup>
        <Button variant="outline" size="default" className="gap-1.5">
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-xs font-semibold uppercase tracking-wider mr-2">
            {workspacePath ?? "Workspace"}
          </span>
          <ChevronsUpDown className="!size-3 shrink-0 text-muted-foreground" />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon" aria-label="Search">
          <Search />
        </Button>
        <Button variant="outline" size="icon" aria-label="New">
          <Plus />
        </Button>
      </ButtonGroup>
    </div>
  )
}
