// Binary message type prefixes (first byte of binary WebSocket frames)
export const MSG_TERMINAL_DATA = 0x00
export const MSG_TERMINAL_RESIZE = 0x01
export const MSG_FLOW_PAUSE = 0x02
export const MSG_FLOW_RESUME = 0x03

// File system types (mirroring Rust protocol.rs)

export interface FsEntry {
  name: string
  kind: "file" | "dir" | "symlink"
  size?: number
  children?: FsEntry[]
}

// JSON messages (text WebSocket frames)

export interface FsListRequest {
  id: string
  type: "fs.list"
  path: string
}

export interface FsListResult {
  id: string
  type: "fs.list.result"
  entries: FsEntry[]
}

export interface WorkspaceInfoRequest {
  id: string
  type: "workspace.info"
}

export interface WorkspaceInfoResult {
  id: string
  type: "workspace.info.result"
  path: string
}

export interface ErrorResponse {
  id: string
  type: "error"
  message: string
}

export type ServerJsonMessage =
  | FsListResult
  | WorkspaceInfoResult
  | ErrorResponse
export type ClientJsonMessage = FsListRequest | WorkspaceInfoRequest
