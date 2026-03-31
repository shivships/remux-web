"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  MSG_TERMINAL_DATA,
  MSG_TERMINAL_RESIZE,
  MSG_FLOW_PAUSE,
  MSG_FLOW_RESUME,
  type FsEntry,
  type ServerJsonMessage,
} from "@/lib/protocol"

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

type TerminalOutputCallback = (data: Uint8Array) => void
type StatusCallback = (status: ConnectionStatus) => void

export interface WorkspaceInfo {
  path: string
}

export interface DevcastConnection {
  status: ConnectionStatus
  sendTerminalInput: (data: Uint8Array) => void
  sendTerminalResize: (cols: number, rows: number) => void
  sendFlowPause: () => void
  sendFlowResume: () => void
  onTerminalOutput: (callback: TerminalOutputCallback) => () => void
  onStatusChange: (callback: StatusCallback) => () => void
  listDirectory: (path: string) => Promise<FsEntry[]>
  getWorkspaceInfo: () => Promise<WorkspaceInfo>
}

const textEncoder = new TextEncoder()

function sendBinary(ws: WebSocket, type: number, payload?: Uint8Array) {
  if (ws.readyState !== WebSocket.OPEN) return
  if (payload) {
    const frame = new Uint8Array(1 + payload.length)
    frame[0] = type
    frame.set(payload, 1)
    ws.send(frame)
  } else {
    ws.send(new Uint8Array([type]))
  }
}

let idCounter = 0
function nextId(): string {
  return `req_${++idCounter}_${Date.now()}`
}

export function useDevcastConnection(wsUrl: string): DevcastConnection {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const wsRef = useRef<WebSocket | null>(null)
  const terminalOutputCallbacks = useRef<Set<TerminalOutputCallback>>(new Set())
  const statusCallbacks = useRef<Set<StatusCallback>>(new Set())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingRequests = useRef<
    Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>
  >(new Map())

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus)
    for (const cb of statusCallbacks.current) {
      cb(newStatus)
    }
  }, [])

  useEffect(() => {
    const ws = new WebSocket(wsUrl)
    ws.binaryType = "arraybuffer"
    wsRef.current = ws

    ws.onopen = () => {
      updateStatus("connected")
    }

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        // Text frame — JSON response
        try {
          const msg = JSON.parse(event.data) as ServerJsonMessage
          const pending = pendingRequests.current.get(msg.id)
          if (!pending) return

          pendingRequests.current.delete(msg.id)
          if (msg.type === "error") {
            pending.reject(new Error(msg.message))
          } else if (msg.type === "fs.list.result") {
            pending.resolve(msg.entries)
          } else if (msg.type === "workspace.info.result") {
            pending.resolve({ path: msg.path })
          }
        } catch {
          // Ignore malformed JSON
        }
      } else {
        // Binary frame — terminal output
        const bytes = new Uint8Array(event.data as ArrayBuffer)
        if (bytes.length < 2 || bytes[0] !== MSG_TERMINAL_DATA) return
        const payload = bytes.subarray(1)
        for (const cb of terminalOutputCallbacks.current) {
          cb(payload)
        }
      }
    }

    ws.onclose = () => {
      updateStatus("disconnected")
      // Reject all pending requests
      for (const [, pending] of pendingRequests.current) {
        pending.reject(new Error("Connection closed"))
      }
      pendingRequests.current.clear()
    }

    ws.onerror = () => {
      updateStatus("error")
    }

    // Keepalive ping every 30s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendBinary(ws, MSG_TERMINAL_DATA, new Uint8Array(0))
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      ws.close()
      wsRef.current = null
    }
  }, [wsUrl, updateStatus])

  const sendTerminalInput = useCallback((data: Uint8Array) => {
    if (wsRef.current) sendBinary(wsRef.current, MSG_TERMINAL_DATA, data)
  }, [])

  const sendTerminalResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current) {
      const json = textEncoder.encode(JSON.stringify({ cols, rows }))
      sendBinary(wsRef.current, MSG_TERMINAL_RESIZE, json)
    }
  }, [])

  const sendFlowPause = useCallback(() => {
    if (wsRef.current) sendBinary(wsRef.current, MSG_FLOW_PAUSE)
  }, [])

  const sendFlowResume = useCallback(() => {
    if (wsRef.current) sendBinary(wsRef.current, MSG_FLOW_RESUME)
  }, [])

  const onTerminalOutput = useCallback((callback: TerminalOutputCallback) => {
    terminalOutputCallbacks.current.add(callback)
    return () => {
      terminalOutputCallbacks.current.delete(callback)
    }
  }, [])

  const onStatusChange = useCallback((callback: StatusCallback) => {
    statusCallbacks.current.add(callback)
    return () => {
      statusCallbacks.current.delete(callback)
    }
  }, [])

  const sendRequest = useCallback(
    <T,>(message: Record<string, unknown>): Promise<T> => {
      return new Promise((resolve, reject) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          reject(new Error("Not connected"))
          return
        }

        const id = nextId()
        const timeout = setTimeout(() => {
          pendingRequests.current.delete(id)
          reject(new Error("Request timed out"))
        }, 10000)

        pendingRequests.current.set(id, {
          resolve: (value) => {
            clearTimeout(timeout)
            resolve(value)
          },
          reject: (error) => {
            clearTimeout(timeout)
            reject(error)
          },
        })

        ws.send(JSON.stringify({ ...message, id }))
      })
    },
    []
  )

  const listDirectory = useCallback(
    (path: string): Promise<FsEntry[]> => {
      return sendRequest({ type: "fs.list", path })
    },
    [sendRequest]
  )

  const getWorkspaceInfo = useCallback((): Promise<WorkspaceInfo> => {
    return sendRequest({ type: "workspace.info" })
  }, [sendRequest])

  return {
    status,
    sendTerminalInput,
    sendTerminalResize,
    sendFlowPause,
    sendFlowResume,
    onTerminalOutput,
    onStatusChange,
    listDirectory,
    getWorkspaceInfo,
  }
}
