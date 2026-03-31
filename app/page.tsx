import { Suspense } from "react"
import { WorkspaceLayout } from "@/components/workspace/workspace-layout"

export default function Page() {
  return (
    <Suspense>
      <WorkspaceLayout />
    </Suspense>
  )
}
