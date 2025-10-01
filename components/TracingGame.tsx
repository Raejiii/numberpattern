import { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX, SkipForward } from "lucide-react"
import confetti from "canvas-confetti"
import { gameConfig } from "../config/game-config"

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: number
  path: string
  startPoint: Point
  endPoint: Point
}

interface TracingItem {
  id: number
  character: string
  name: string
  difficulty: string
  type: string
  strokes: Stroke[]
}

export function TracingGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [currentItem, setCurrentItem] = useState<TracingItem>(gameConfig.tracingItems[0])
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0)
  const [tracedPaths, setTracedPaths] = useState<Point[][]>([])
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [isTracing, setIsTracing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [totalLevels] = useState(gameConfig.tracingItems.length)
  const [difficulty, setDifficulty] = useState("all")
  const [filteredItems, setFilteredItems] = useState(gameConfig.tracingItems)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Audio management
  useEffect(() => {
    const loadAudio = () => {
      Object.entries(gameConfig.audio).forEach(([key, url]) => {
        if (url && typeof url === "string") {
          const audio = new Audio(url)
          audio.preload = "auto"
          audio.volume = isMuted ? 0 : 0.5
          audioRefs.current[key] = audio
        }
      })
    }

    loadAudio()
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio instanceof HTMLAudioElement) {
          audio.pause()
          audio.src = ""
        }
      })
    }
  }, [isMuted])

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashFading(true)
      setTimeout(() => {
        setShowSplash(false)
      }, 500)
    }, gameConfig.splashScreen.duration)

    return () => clearTimeout(timer)
  }, [])

  // Filter items by difficulty
  useEffect(() => {
    if (difficulty === "all") {
      setFilteredItems(gameConfig.tracingItems)
    } else {
      setFilteredItems(gameConfig.tracingItems.filter((item) => item.difficulty === difficulty))
    }
  }, [difficulty])

  // Load current item
  useEffect(() => {
    loadItem(currentItemIndex)
  }, [filteredItems, currentItemIndex])

  const playAudio = (audioKey: string) => {
    if (!isMuted && audioRefs.current[audioKey]) {
      const audio = audioRefs.current[audioKey]
      audio.currentTime = 0
      audio.play().catch(() => {})
    }
  }

  const playConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
    })
  }

  const loadItem = (itemIndex: number) => {
    const itemsToUse = filteredItems.length > 0 ? filteredItems : gameConfig.tracingItems
    if (!itemsToUse || !itemsToUse[itemIndex]) {
      console.error("Item not found at index:", itemIndex)
      return
    }

    const item = itemsToUse[itemIndex]
    setCurrentItem(item)
    setCurrentStrokeIndex(0)
    setTracedPaths([])
    setCurrentPath([])
    setIsTracing(false)
    setIsComplete(false)
  }

  const nextItem = () => {
    const itemsToUse = filteredItems.length > 0 ? filteredItems : gameConfig.tracingItems
    if (!itemsToUse || !itemsToUse.length) return

    const nextIndex = (currentItemIndex + 1) % itemsToUse.length
    setCurrentItemIndex(nextIndex)
    setCurrentLevel(nextIndex + 1)
    loadItem(nextIndex)
    playAudio("uiClick")
  }

  const autoAdvanceToNextLevel = () => {
    const itemsToUse = filteredItems.length > 0 ? filteredItems : gameConfig.tracingItems
    if (!itemsToUse || !itemsToUse.length) return

    if (currentItemIndex + 1 < itemsToUse.length) {
      setTimeout(() => {
        const nextIndex = currentItemIndex + 1
        setCurrentItemIndex(nextIndex)
        setCurrentLevel(nextIndex + 1)
        loadItem(nextIndex)
        setGameState("playing")
        setShowOverlay(false)
        playAudio("uiClick")

        setFloatingText({ text: `Level ${nextIndex + 1}!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 2000)
      }, 3000)
    } else {
      setTimeout(() => {
        setGameState("allComplete")
        setShowOverlay(true)
      }, 3000)
    }
  }

  const setDifficultyLevel = (newDifficulty: string) => {
    setDifficulty(newDifficulty)
    setCurrentItemIndex(0)
    setCurrentLevel(1)

    setTimeout(() => {
      loadItem(0)
    }, 100)

    playAudio("uiClick")
  }

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    playAudio("uiClick")
    playAudio("start")
  }

  const resetGame = () => {
    loadItem(currentItemIndex)
    setGameState("playing")
    setShowOverlay(false)
    playAudio("uiClick")
  }

  const pauseGame = () => {
    setGameState("paused")
    setShowOverlay(true)
    playAudio("uiClick")
  }

  const resumeGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    playAudio("uiClick")
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio instanceof HTMLAudioElement) {
        audio.volume = !isMuted ? 0 : 0.5
      }
    })
  }

  const showHelp = () => {
    setGameState("help")
    setShowOverlay(true)
    playAudio("instructions")
  }

  // Get event point for both mouse and touch
  const getEventPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    if ('touches' in e && e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }
  }

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = (point: Point): Point => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: ((point.x - rect.left) / rect.width) * 100,
      y: ((point.y - rect.top) / rect.height) * 100,
    }
  }

  // Check if point is near stroke start
  const isNearStrokeStart = (point: Point, stroke: Stroke): boolean => {
    const distance = Math.sqrt(
      Math.pow(point.x - stroke.startPoint.x, 2) + Math.pow(point.y - stroke.startPoint.y, 2)
    )
    return distance < 8 // 8% tolerance
  }

  // Handle tracing start
  const handleTracingStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (gameState !== "playing" || isComplete) return

    const point = getEventPoint(e)
    const svgPoint = screenToSVG(point)
    const currentStroke = currentItem.strokes[currentStrokeIndex]

    if (currentStroke && isNearStrokeStart(svgPoint, currentStroke)) {
      setIsTracing(true)
      setCurrentPath([svgPoint])
      playAudio("connect")
    } else {
      playAudio("incorrect")
      setFloatingText({ text: "Start at the green dot!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)
    }
  }

  // Handle tracing move
  const handleTracingMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isTracing) return

    const point = getEventPoint(e)
    const svgPoint = screenToSVG(point)
    
    setCurrentPath((prev) => [...prev, svgPoint])
    
    // Calculate progress along the stroke
    const currentStroke = currentItem.strokes[currentStrokeIndex]
    if (currentStroke) {
      // Visual feedback could be added here if needed
    }
  }

  // Handle tracing end
  const handleTracingEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isTracing) return

    const point = getEventPoint(e)
    const svgPoint = screenToSVG(point)
    const currentStroke = currentItem.strokes[currentStrokeIndex]

    if (currentStroke) {
      // Check if we're near the end point and have traced enough
      const endDistance = Math.sqrt(
        Math.pow(svgPoint.x - currentStroke.endPoint.x, 2) + 
        Math.pow(svgPoint.y - currentStroke.endPoint.y, 2)
      )

      if (endDistance < 12 && currentPath.length > 10) {
        // Stroke completed successfully
        setTracedPaths((prev) => [...prev, [...currentPath, svgPoint]])
        setCurrentPath([])
        setIsTracing(false)
        playAudio("success")

        if (currentStrokeIndex + 1 >= currentItem.strokes.length) {
          // All strokes completed
          setIsComplete(true)
          playAudio("levelWin")
          playConfetti()
          setFloatingText({ text: `${currentItem.character} Complete!`, show: true })
          setTimeout(() => {
            setFloatingText({ text: "", show: false })
          }, 2000)
          autoAdvanceToNextLevel()
        } else {
          // Move to next stroke
          setCurrentStrokeIndex((prev) => prev + 1)
          setFloatingText({ text: "Great! Next stroke!", show: true })
          setTimeout(() => {
            setFloatingText({ text: "", show: false })
          }, 1000)
        }
      } else {
        // Stroke not completed properly
        setCurrentPath([])
        setIsTracing(false)
        playAudio("incorrect")
        setFloatingText({ text: "Try again!", show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 1000)
      }
    }
  }

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 bg-white flex items-center justify-center ${isSplashFading ? "animate-fade-out" : ""}`}
      >
        <div className="w-64 h-64 relative flex items-center justify-center">
          <img
            src={gameConfig.splashScreen.logo || "/placeholder.svg?height=256&width=256"}
            alt="eklavya - making learning accessible"
            className="w-full h-full object-contain animate-fade-in"
          />
        </div>
      </div>
    )
  }

  if (!currentItem) {
    console.error("Current item is null")
    return (
      <div className="fixed inset-0 bg-[#000B18] flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden animate-fade-in">
      <div
        className="fixed inset-0 bg-[#000B18] pointer-events-none"
        style={{
          backgroundImage: `\
  radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),\
  radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),\
  radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px),\
  radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 30px)\
`,
          backgroundSize: "550px 550px, 350px 350px, 250px 250px, 150px 150px",
          backgroundPosition: "0 0, 40px 60px, 130px 270px, 70px 100px",
          animation: "backgroundScroll 60s linear infinite",
        }}
      />

      <div className="w-full h-full relative flex flex-col items-center justify-center z-10 px-4">
        {/* Game Title */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
            {isComplete ? `${currentItem.character} Complete!` : currentItem.name}
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-1">
            <p className="text-sm sm:text-base text-white/80">
              Level {currentLevel} of {filteredItems.length} • {currentItem.difficulty?.toUpperCase() || "EASY"}
            </p>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                currentItem.difficulty === "easy"
                  ? "bg-green-500 text-white"
                  : currentItem.difficulty === "medium"
                    ? "bg-yellow-500 text-black"
                    : "bg-red-500 text-white"
              }`}
            >
              {currentItem.difficulty?.toUpperCase() || "EASY"}
            </span>
          </div>
          <div className="inline-block bg-white rounded-lg px-3 py-2 mt-1 border-2 border-gray-300" style={{
            boxShadow: "0 8px 16px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)"
          }}>
            <p className="text-sm sm:text-base lg:text-lg font-black text-black tracking-wide" style={{
              fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.7)",
              letterSpacing: "0.05em"
            }}>
              {isComplete
                ? "GREAT JOB! MOVING TO NEXT LEVEL..."
                : `TRACE THE ${currentItem.type.toUpperCase()} "${currentItem.character}" (${currentStrokeIndex + 1}/${currentItem.strokes.length})`}
            </p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl mx-auto">
          <div
            ref={gameAreaRef}
            className="relative w-[calc(100%-4rem)] sm:w-[calc(100%-6rem)] max-w-[min(80vw,80vh)] max-h-[80vh] aspect-square mx-auto z-20 transition-all duration-300 bg-white/10 rounded-xl backdrop-blur-sm"
            style={{ touchAction: "none" }}
            onMouseDown={handleTracingStart}
            onMouseMove={handleTracingMove}
            onMouseUp={handleTracingEnd}
            onMouseLeave={handleTracingEnd}
            onTouchStart={handleTracingStart}
            onTouchMove={handleTracingMove}
            onTouchEnd={handleTracingEnd}
          >
            {/* SVG for tracing */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              style={{ touchAction: "none" }}
            >
              {/* Guide paths (dotted) */}
              {currentItem.strokes.map((stroke, index) => (
                <path
                  key={`guide-${index}`}
                  d={stroke.path}
                  fill="none"
                  stroke={index === currentStrokeIndex ? "#22c55e" : "#6b7280"}
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  opacity={index <= currentStrokeIndex ? 0.8 : 0.3}
                />
              ))}

              {/* Start points */}
              {currentItem.strokes.map((stroke, index) => (
                <circle
                  key={`start-${index}`}
                  cx={stroke.startPoint.x}
                  cy={stroke.startPoint.y}
                  r="2"
                  fill={index === currentStrokeIndex ? "#22c55e" : index < currentStrokeIndex ? "#10b981" : "#6b7280"}
                  className={index === currentStrokeIndex ? "animate-pulse" : ""}
                />
              ))}

              {/* End points */}
              {currentItem.strokes.map((stroke, index) => (
                <circle
                  key={`end-${index}`}
                  cx={stroke.endPoint.x}
                  cy={stroke.endPoint.y}
                  r="1.5"
                  fill={index < currentStrokeIndex ? "#10b981" : "#ef4444"}
                  opacity={index <= currentStrokeIndex ? 1 : 0.5}
                />
              ))}

              {/* Traced paths */}
              {tracedPaths.map((path, index) => (
                <polyline
                  key={`traced-${index}`}
                  points={path.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Current tracing path */}
              {currentPath.length > 1 && (
                <polyline
                  points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* Character display */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-8xl sm:text-9xl font-bold text-white/10 select-none">
                {currentItem.character}
              </div>
            </div>
          </div>
        </div>

        {/* Control buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
          <button
            onClick={toggleMute}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Music size={20} />}
          </button>
          <button
            onClick={showHelp}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <HelpCircle size={20} />
          </button>
          <button
            onClick={resetGame}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          {gameState === "playing" ? (
            <button
              onClick={pauseGame}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Pause size={20} />
            </button>
          ) : (
            <button
              onClick={resumeGame}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Play size={20} />
            </button>
          )}
          <button
            onClick={nextItem}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Floating text */}
        {floatingText.show && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[70]">
            <div
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-400 animate-float-fade"
              style={{
                textShadow: "4px 4px 8px rgba(128, 0, 128, 0.8), -2px -2px 4px rgba(0, 0, 0, 0.6)",
                filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.7))",
              }}
            >
              {floatingText.text}
            </div>
          </div>
        )}

        {showOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 sm:p-8 rounded-xl max-w-sm w-11/12 text-center">
              {gameState === "start" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">{gameConfig.gameTitle}</h2>
                  <p className="mb-4">{gameConfig.instructions}</p>

                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-2">Choose Difficulty:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["easy", "medium", "hard", "all"].map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setDifficultyLevel(diff)}
                          className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                            difficulty === diff
                              ? diff === "easy"
                                ? "bg-green-500 text-white"
                                : diff === "medium"
                                  ? "bg-yellow-500 text-black"
                                  : diff === "hard"
                                    ? "bg-red-500 text-white"
                                    : "bg-blue-500 text-white"
                              : "bg-gray-200 text-black hover:bg-gray-300"
                          }`}
                        >
                          {diff.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-black mt-2">
                      {difficulty === "all"
                        ? `All ${totalLevels} items`
                        : `${gameConfig.tracingItems.filter((item) => item.difficulty === difficulty).length} ${difficulty} items`}
                    </p>
                  </div>

                  <button
                    onClick={startGame}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Game
                  </button>
                </>
              )}

              {gameState === "paused" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Game Paused</h2>
                  <p className="mb-4">Take a break! Click resume when you're ready.</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={resumeGame}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={resetGame}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Restart
                    </button>
                  </div>
                </>
              )}

              {gameState === "help" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">How to Play</h2>
                  <div className="text-left space-y-2 mb-4">
                    <p>• Start tracing from the green dot</p>
                    <p>• Follow the dotted line path</p>
                    <p>• Complete each stroke in order</p>
                    <p>• Finish at the red dot</p>
                  </div>
                  <button
                    onClick={resumeGame}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Got it!
                  </button>
                </>
              )}

              {gameState === "allComplete" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Congratulations!</h2>
                  <p className="mb-4">You've completed all levels!</p>
                  <button
                    onClick={() => {
                      setCurrentItemIndex(0)
                      setCurrentLevel(1)
                      loadItem(0)
                      setGameState("start")
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Play Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}