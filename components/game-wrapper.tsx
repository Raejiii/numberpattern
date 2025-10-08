import { lazy, Suspense } from "react"

const NumberPatternGame = lazy(() => import("./NumberPatternGame").then((mod) => ({ default: mod.NumberPatternGame })))

export default function GameWrapper() {
  return (
    <div className="h-screen w-screen bg-[#000B18] overflow-hidden">
      <Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#000B18]">
          <div className="text-xl text-black">Loading game...</div>
        </div>
      }>
        <NumberPatternGame />
      </Suspense>
    </div>
  )
}
