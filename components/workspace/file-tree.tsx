"use client"

import { useEffect, useState } from "react"
import {
  ChevronRight,
  File,
  Folder,
  Loader2,
  AlertCircle,
  Search,
  Plus,
  ChevronsUpDown,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useDevcast } from "@/components/workspace/devcast-provider"
import type { FsEntry } from "@/lib/protocol"

function TreeNode({ entry }: { entry: FsEntry }) {
  if (entry.kind !== "dir") {
    return (
      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
        <File className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{entry.name}</span>
      </button>
    )
  }

  return (
    <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
          <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{entry.name}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 border-l border-border pl-1">
          {entry.children?.map((child) => (
            <TreeNode key={child.name} entry={child} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function FileTree() {
  const connection = useDevcast()
  const [entries, setEntries] = useState<FsEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
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

    connection
      .listDirectory(".")
      .then((result) => {
        setEntries(result)
        setError(null)
      })
      .catch((e: Error) => {
        setError(e.message)
      })
  }, [connection, isConnected])

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
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
      {!entries ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading files...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-2 py-1">
          <div className="space-y-0.5">
            {entries.map((entry) => (
              <TreeNode key={entry.name} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
