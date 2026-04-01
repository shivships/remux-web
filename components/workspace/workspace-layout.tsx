"use client"

import { useCallback, useContext, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Layout,
  Model,
  Actions,
  type TabNode,
  type TabSetNode,
  type Action,
  type ITabRenderValues,
} from "flexlayout-react"
import "@/app/flexlayout-devcast.css"

import { FileTree } from "@/components/workspace/file-tree"
import { SidebarHeader } from "@/components/workspace/sidebar-header"
import { TerminalView } from "@/components/terminal"
import {
  EditorProvider,
  ModelRegistryContext,
} from "@/components/workspace/editor-area"
import { DevcastProvider } from "@/components/workspace/devcast-provider"

const layoutJson = {
  global: {
    tabEnableClose: true,
    tabEnableRename: false,
    tabSetEnableMaximize: false,
    tabSetEnableClose: false,
    splitterSize: 1,
    splitterExtra: 4,
    tabSetTabStripHeight: 35,
  },
  layout: {
    type: "row",
    children: [
      {
        type: "tabset",
        id: "sidebar",
        weight: 20,
        minWidth: 150,
        enableTabStrip: false,
        enableDrop: false,
        enableDrag: false,
        enableDivide: false,
        enableClose: false,
        children: [
          {
            type: "tab",
            id: "sidebar_content",
            name: "Sidebar",
            component: "sidebar",
            enableClose: false,
            enableDrag: false,
          },
        ],
      },
      {
        type: "tabset",
        id: "editor",
        weight: 80,
        children: [
          {
            type: "tab",
            id: "terminal_1",
            name: "Terminal",
            component: "terminal",
            enableRenderOnDemand: false,
          },
        ],
      },
    ],
  },
}

function FlexLayoutWorkspace() {
  const registerModel = useContext(ModelRegistryContext)
  const modelRef = useRef<Model | null>(null)

  if (!modelRef.current) {
    const model = Model.fromJson(layoutJson)
    modelRef.current = model
    registerModel?.(model)
  }

  const factory = useCallback((node: TabNode) => {
    const component = node.getComponent()
    switch (component) {
      case "sidebar":
        return (
          <div className="flex h-full flex-col bg-card">
            <SidebarHeader />
            <FileTree />
          </div>
        )
      case "terminal":
        return (
          <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
            <TerminalView />
          </div>
        )
      case "placeholder":
        return <div className="h-full w-full bg-background" />
      default:
        return <div className="h-full w-full bg-background" />
    }
  }, [])

  const onAction = useCallback((action: Action): Action | undefined => {
    if (action.type === Actions.DELETE_TAB) {
      const model = modelRef.current
      if (!model) return action
      const editorTabset = model.getNodeById("editor") as TabSetNode | undefined
      if (editorTabset && editorTabset.getChildren().length <= 1) {
        return undefined
      }
    }
    return action
  }, [])

  const onRenderTab = useCallback(
    (node: TabNode, renderValues: ITabRenderValues) => {
      renderValues.content = (
        <span className="text-xs select-none truncate">{node.getName()}</span>
      )
    },
    [],
  )

  return (
    <Layout
      model={modelRef.current!}
      factory={factory}
      onAction={onAction}
      onRenderTab={onRenderTab}
    />
  )
}

export function WorkspaceLayout() {
  const searchParams = useSearchParams()
  const port = searchParams.get("port")
  const tunnel = searchParams.get("tunnel")

  const wsUrl = tunnel
    ? tunnel.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://")
    : port
      ? `ws://localhost:${port}`
      : null

  if (!wsUrl) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="text-center text-sm text-muted-foreground">
          <p>No connection specified.</p>
          <p className="mt-1">
            Run <code className="text-foreground">devcast</code> and open the
            link it provides.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DevcastProvider wsUrl={wsUrl}>
      <EditorProvider>
        <div className="relative h-dvh w-full overflow-hidden">
          <FlexLayoutWorkspace />
        </div>
      </EditorProvider>
    </DevcastProvider>
  )
}
