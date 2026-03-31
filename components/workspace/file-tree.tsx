"use client"

import { useEffect, useState } from "react"
import { ChevronRight, File, Folder, Loader2, AlertCircle } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

  const isConnected = connection.status === "connected"

  useEffect(() => {
    if (!isConnected) return

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

  if (!entries) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading files...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto px-2 py-1">
      <div className="space-y-0.5">
        {entries.map((entry) => (
          <TreeNode key={entry.name} entry={entry} />
        ))}
      </div>
    </div>
  )
}
