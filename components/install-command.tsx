"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

const COMMAND = "curl -sSf https://remux.sh/install | sh"

export function InstallCommand() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <div className="flex w-fit max-w-full items-center gap-3 rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
      <span aria-hidden className="select-none text-muted-foreground">
        ❯
      </span>
      <code className="text-foreground">{COMMAND}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy command"}
        className="ml-2 shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  )
}
