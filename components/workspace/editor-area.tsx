"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import { type Model, Actions, DockLocation } from "flexlayout-react"

// --- Editor context (public) ---

interface EditorActions {
  addTab: () => void
}

const EditorContext = createContext<EditorActions | null>(null)

export function useEditor(): EditorActions | null {
  return useContext(EditorContext)
}

// --- Model registry (internal, consumed by workspace-layout) ---

export const ModelRegistryContext = createContext<
  ((model: Model) => void) | null
>(null)

// --- Provider ---

export function EditorProvider({ children }: { children: ReactNode }) {
  const modelRef = useRef<Model | null>(null)
  const counterRef = useRef(1)

  const setModel = useCallback((model: Model) => {
    modelRef.current = model
  }, [])

  const addTab = useCallback(() => {
    const model = modelRef.current
    if (!model) return
    const n = ++counterRef.current
    model.doAction(
      Actions.addNode(
        {
          type: "tab",
          id: `tab_${n}_${Date.now()}`,
          component: "placeholder",
          name: `Terminal ${n}`,
        },
        "editor",
        DockLocation.CENTER,
        -1,
      ),
    )
  }, [])

  const actions = useMemo(() => ({ addTab }), [addTab])

  return (
    <EditorContext.Provider value={actions}>
      <ModelRegistryContext.Provider value={setModel}>
        {children}
      </ModelRegistryContext.Provider>
    </EditorContext.Provider>
  )
}
