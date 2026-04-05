"use client"

import { useRemux } from "@/components/remux-provider"

function Spinner() {
  return (
    <svg
      className="h-6 w-6 animate-spin text-neutral-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function ConnectionOverlay() {
  const { status } = useRemux()

  const label =
    status === "connecting"
      ? "Connecting..."
      : status === "reconnecting"
        ? "Reconnecting..."
        : null

  if (!label) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-neutral-400">{label}</p>
      </div>
    </div>
  )
}
