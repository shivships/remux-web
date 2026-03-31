"use client"

import { createContext, useContext, type ReactNode } from "react"
import {
  useDevcastConnection,
  type DevcastConnection,
} from "@/hooks/use-devcast-connection"

const DevcastContext = createContext<DevcastConnection | null>(null)

interface DevcastProviderProps {
  wsUrl: string
  children: ReactNode
}

export function DevcastProvider({ wsUrl, children }: DevcastProviderProps) {
  const connection = useDevcastConnection(wsUrl)
  return (
    <DevcastContext.Provider value={connection}>
      {children}
    </DevcastContext.Provider>
  )
}

export function useDevcast(): DevcastConnection {
  const ctx = useContext(DevcastContext)
  if (!ctx) {
    throw new Error("useDevcast must be used within a DevcastProvider")
  }
  return ctx
}
