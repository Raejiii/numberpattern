import { lazy, Suspense } from "react"

const TracingGame = lazy(() => import("./TracingGame").then((mod) => ({ default: mod.TracingGame })))

export default function GameWrapper() {
  return (
    <div className="h-screen w-screen bg-[#000B18] overflow-hidden">
      <Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#000B18]">
          <div className="text-xl text-black">Loading game...</div>
        </div>
      }>
        <TracingGame />
      </Suspense>
    </div>
  )
}
