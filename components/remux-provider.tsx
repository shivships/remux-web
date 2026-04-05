"use client"

import { createContext, useContext, type ReactNode } from "react"
import {
  useRemuxConnection,
  type RemuxConnection,
} from "@/hooks/use-remux-connection"

const RemuxContext = createContext<RemuxConnection | null>(null)

interface RemuxProviderProps {
  wsUrl: string
  children: ReactNode
}

export function RemuxProvider({ wsUrl, children }: RemuxProviderProps) {
  const connection = useRemuxConnection(wsUrl)
  return (
    <RemuxContext.Provider value={connection}>
      {children}
    </RemuxContext.Provider>
  )
}

export function useRemux(): RemuxConnection {
  const ctx = useContext(RemuxContext)
  if (!ctx) {
    throw new Error("useRemux must be used within a RemuxProvider")
  }
  return ctx
}
