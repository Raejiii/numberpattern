import React, { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, VolumeX, Music, RotateCcw, SkipForward, HelpCircle } from "lucide-react"
import confetti from "canvas-confetti"
import { useNavigate } from "react-router-dom"

interface LabelPosition {
  id: string
  label: string
  x: number
  y: number
  targetX: number
  targetY: number
}

interface Scenario {
  id: string
  title: string
  image: string
  labels: string[]
  labelPositions: LabelPosition[]
  difficulty: "easy" | "medium" | "hard"
}

interface GameConfig {
  gameTitle: string
  instructions: string
  scenarios: Scenario[]
}

interface PlacedLabel {
  x: number
  y: number
}

interface FloatingText {
  show: boolean
  text: string
}

interface DragPosition {
  x: number
  y: number
}

const LabellingGame: React.FC = () => {
  const navigate = useNavigate()
  
  // Game state
  const [gameState, setGameState] = useState<"splash" | "loading" | "start" | "playing" | "completed">("splash")
  const [showOverlay, setShowOverlay] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0)
  const [placedLabels, setPlacedLabels] = useState<Record<string, PlacedLabel>>({})
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState<DragPosition>({ x: 0, y: 0 })
  const [floatingText, setFloatingText] = useState<FloatingText>({ show: false, text: "" })
  const [isMuted, setIsMuted] = useState(false)
  const [difficulty, setDifficultyLevel] = useState<"easy" | "medium" | "hard" | "all">("all")
  const [gameConfig, setGameConfig] = useState<GameConfig>({ gameTitle: "", instructions: "", scenarios: [] })
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const labelsAreaRef = useRef<HTMLDivElement>(null)
  // Audio ref (removed as it's not used)
  // const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setGameState("loading")
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Load game configuration
  useEffect(() => {
    if (gameState === "loading") {
      const loadGameConfig = async () => {
        try {
          const response = await fetch("/game-config.json")
          const config: GameConfig = await response.json()
          setGameConfig(config)
          setGameState("start")
          setShowOverlay(true)
        } catch (error) {
          console.error("Failed to load game config:", error)
          // Fallback configuration
          const fallbackConfig: GameConfig = {
            gameTitle: "Labelling Game",
            instructions: "Drag and drop labels to their correct positions on the image.",
            scenarios: []
          }
          setGameConfig(fallbackConfig)
          setGameState("start")
          setShowOverlay(true)
        }
      }

      loadGameConfig()
    }
  }, [gameState])

  // Global drag event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedLabel) {
        setDragPosition({ x: e.clientX, y: e.clientY })
      }
    }

    const handleGlobalMouseUp = () => {
      if (draggedLabel) {
        handleDragEnd()
      }
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (draggedLabel && e.touches.length > 0) {
        setDragPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      }
    }

    const handleGlobalTouchEnd = () => {
      if (draggedLabel) {
        handleDragEnd()
      }
    }

    if (draggedLabel) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
      document.addEventListener("touchmove", handleGlobalTouchMove)
      document.addEventListener("touchend", handleGlobalTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.removeEventListener("touchmove", handleGlobalTouchMove)
      document.removeEventListener("touchend", handleGlobalTouchEnd)
    }
  }, [draggedLabel])

  // Timer effect
  useEffect(() => {
    if (gameState === "playing" && !showSidebar && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100)
      setTimerInterval(interval)
      return () => clearInterval(interval)
    } else if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }, [gameState, showSidebar, startTime])

  // Helper functions
  const getImageBounds = useCallback(() => {
    if (!imageRef.current) return null
    const rect = imageRef.current.getBoundingClientRect()
    return rect
  }, [])

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Game logic functions
  const loadScenario = useCallback(() => {
    if (gameConfig.scenarios.length === 0) return

    const filteredScenarios = difficulty === "all" 
      ? gameConfig.scenarios 
      : gameConfig.scenarios.filter(s => s.difficulty === difficulty)
    
    if (filteredScenarios.length === 0) return

    setPlacedLabels({})
    setDraggedLabel(null)
  }, [gameConfig.scenarios, currentScenarioIndex, difficulty])

  const advanceScenario = useCallback(() => {
    const filteredScenarios = difficulty === "all" 
      ? gameConfig.scenarios 
      : gameConfig.scenarios.filter(s => s.difficulty === difficulty)
    
    if (currentScenarioIndex < filteredScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1)
    } else {
      setGameState("completed")
      setShowOverlay(true)
    }
  }, [gameConfig.scenarios, currentScenarioIndex, difficulty])

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setStartTime(Date.now())
    setElapsedTime(0)
    loadScenario()
  }

  const playConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  // Event handlers
  const handleLabelDragStart = (e: React.MouseEvent | React.TouchEvent, label: string) => {
    e.preventDefault()
    setDraggedLabel(label)
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragPosition({ x: clientX, y: clientY })
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedLabel) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragPosition({ x: clientX, y: clientY })
  }

  const handleDragEnd = useCallback(() => {
    if (!draggedLabel) return

    const imageBounds = getImageBounds()
    if (!imageBounds) {
      setDraggedLabel(null)
      return
    }

    const relativeX = ((dragPosition.x - imageBounds.left) / imageBounds.width) * 100
    const relativeY = ((dragPosition.y - imageBounds.top) / imageBounds.height) * 100

    // Check if dropped within image bounds
    if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
      const currentScenario = getCurrentScenario()
      if (!currentScenario) {
        setDraggedLabel(null)
        return
      }

      // Check collision with target areas
      const targetPosition = currentScenario.labelPositions.find(pos => pos.label === draggedLabel)
      if (targetPosition) {
        const distance = Math.sqrt(
          Math.pow(relativeX - targetPosition.x, 2) + Math.pow(relativeY - targetPosition.y, 2)
        )
        
        if (distance <= 10) { // Within 10% distance
          setPlacedLabels(prev => ({
            ...prev,
            [draggedLabel]: { x: targetPosition.x, y: targetPosition.y }
          }))
          
          setFloatingText({ show: true, text: "Correct!" })
          setTimeout(() => setFloatingText({ show: false, text: "" }), 1500)
          
          if (!isMuted) {
            // Play success sound
          }
          
          // Check if all labels are placed
          const allLabelsPlaced = currentScenario.labels.every(label => 
            placedLabels[label] || label === draggedLabel
          )
          
          if (allLabelsPlaced) {
            playConfetti()
            setTimeout(() => {
              advanceScenario()
            }, 2000)
          }
        } else {
          setFloatingText({ show: true, text: "Try again!" })
          setTimeout(() => setFloatingText({ show: false, text: "" }), 1500)
        }
      }
    }

    setDraggedLabel(null)
  }, [draggedLabel, dragPosition, getImageBounds, placedLabels, isMuted, advanceScenario])

  const togglePause = () => {
    setShowSidebar(!showSidebar)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const resetGame = () => {
    setPlacedLabels({})
    setDraggedLabel(null)
    setStartTime(Date.now())
    setElapsedTime(0)
    loadScenario()
  }

  const nextScenario = () => {
    advanceScenario()
  }

  const showHelp = () => {
    setFloatingText({ show: true, text: gameConfig.instructions })
    setTimeout(() => setFloatingText({ show: false, text: "" }), 3000)
  }

  const getCurrentScenario = () => {
    const filteredScenarios = gameConfig.scenarios.filter((s: Scenario) => 
      difficulty === "all" || s.difficulty === difficulty
    )
    return filteredScenarios[currentScenarioIndex] || gameConfig.scenarios[0]
  }

  const currentScenario = getCurrentScenario()
  const totalLevels = gameConfig.scenarios.length
  const filteredLevels = difficulty === "all" 
    ? totalLevels 
    : gameConfig.scenarios.filter(s => s.difficulty === difficulty).length

  // Render splash screen
  if (gameState === "splash") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
            Labelling Game
          </h1>
          <p className="text-xl text-white/80">Loading...</p>
        </div>
      </div>
    )
  }

  // Render loading screen
  if (gameState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Loading Game...
          </h1>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!currentScenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">No scenarios available</h2>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-pulse"></div>
        <div className="absolute inset-0 backgroundScroll"></div>
      </div>

      {/* Main Game Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - Responsive design */}
        <div className="w-full bg-black/20 backdrop-blur-sm border-b border-white/20 responsive-padding">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            {/* Level Info */}
            <div className="flex items-center gap-2 sm:gap-4 text-white">
              <h2 className="responsive-text-lg font-bold">
                Level {currentScenarioIndex + 1} of {filteredLevels}
              </h2>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                currentScenario.difficulty === "easy" ? "bg-green-500" :
                currentScenario.difficulty === "medium" ? "bg-yellow-500 text-black" :
                "bg-red-500"
              }`}>
                {currentScenario.difficulty.toUpperCase()}
              </span>
            </div>

            {/* Instructions */}
            <div className="text-center flex-1 max-w-md">
              <p className="responsive-text-sm text-white/90 font-medium">
                {currentScenario.title}
              </p>
            </div>

            {/* Timer */}
            {gameState === "playing" && (
              <div className="text-white font-bold responsive-text-lg">
                {formatTime(elapsedTime)}
              </div>
            )}
          </div>
        </div>

        {/* Main Game Area - Flexible layout */}
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto gap-2 sm:gap-4 items-center justify-center min-h-0">
          {/* Image Container - Responsive sizing */}
          <div
            ref={gameAreaRef}
            className="game-image-container mx-auto z-20 transition-all duration-300 bg-white/10 rounded-xl backdrop-blur-sm border-4 border-yellow-400"
            style={{ 
              touchAction: "none"
            }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <img
              ref={imageRef}
              src={currentScenario.image || "/placeholder.svg"}
              alt={currentScenario.title}
              className="responsive-image rounded-xl"
            />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {currentScenario.labelPositions.map((position) => {
                console.log(
                  `[v0] Drawing line for ${position.label}: from (${position.x}%, ${position.y}%) to (${position.targetX}%, ${position.targetY}%)`,
                )
                return (
                  <line
                    key={`line-${position.id}`}
                    x1={`${position.x}%`}
                    y1={`${position.y}%`}
                    x2={`${position.targetX}%`}
                    y2={`${position.targetY}%`}
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={placedLabels[position.label] ? "0" : "5,5"}
                    className="transition-all duration-300"
                  />
                )
              })}
            </svg>

            {currentScenario.labelPositions.map((position) => (
              <div
                key={position.id}
                className={`absolute w-20 h-8 rounded border-2 border-dashed transition-all duration-300 ${
                  placedLabels[position.label] ? "bg-green-500/20 border-green-500" : "bg-black/50 border-white/50"
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {Object.entries(placedLabels).map(([label, position]) => (
              <div
                key={`placed-${label}`}
                className="absolute bg-red-500 text-white px-2 py-1 rounded text-sm font-bold shadow-lg flex items-center justify-center text-center"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.8)",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)",
                  background: "linear-gradient(145deg, #ef4444, #dc2626)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  minWidth: "60px",
                  minHeight: "24px"
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Labels Area - Responsive design */}
          <div
            ref={labelsAreaRef}
            className="game-labels-area lg:w-[30%] max-w-full lg:max-w-[250px] flex flex-col gap-2 sm:gap-3 responsive-padding bg-white/10 rounded-xl backdrop-blur-sm order-first lg:order-last"
          >
            <h3 className="text-black font-bold text-center mb-1 sm:mb-2 responsive-text-sm">Labels</h3>
            <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 flex-wrap lg:flex-nowrap">
              {currentScenario.labels
                .filter((label) => !placedLabels[label])
                .map((label) => (
                  <div
                    key={label}
                    className="bg-red-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded responsive-text-sm font-bold cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 flex items-center justify-center text-center"
                    onMouseDown={(e) => handleLabelDragStart(e, label)}
                    onTouchStart={(e) => handleLabelDragStart(e, label)}
                    draggable="false"
                    style={{ 
                      touchAction: "none", 
                      userSelect: "none",
                      fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
                      fontWeight: "bold",
                      textShadow: "2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.8)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)",
                      background: "linear-gradient(145deg, #ef4444, #dc2626)",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    {label}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {draggedLabel && (
          <div
            className="fixed bg-red-500 text-white px-3 py-2 rounded text-sm font-bold shadow-xl pointer-events-none z-[100] flex items-center justify-center text-center"
            style={{
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
              touchAction: "none",
              fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.8)",
              boxShadow: "0 6px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)",
              background: "linear-gradient(145deg, #ef4444, #dc2626)",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: "60px",
              minHeight: "28px"
            }}
          >
            {draggedLabel}
          </div>
        )}

        {/* Responsive Sidebar - Better mobile positioning */}
        <div
          className={`fixed top-2 sm:top-4 left-2 sm:left-4 z-[60] transition-all duration-300 ${
            showSidebar ? "w-14 sm:w-16 lg:w-20" : "w-10 sm:w-12 lg:w-16"
          }`}
        >
          <div className="flex flex-col items-center gap-2 sm:gap-4 lg:gap-6">
            <button
              onClick={togglePause}
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg touch-none"
              aria-label={showSidebar ? "Resume game" : "Pause game"}
            >
              {showSidebar ? (
                <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white" />
              ) : (
                <Pause className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white" />
              )}
            </button>
            {showSidebar && (
              <>
                <button
                  onClick={toggleMute}
                  className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full ${
                    isMuted ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                  } flex items-center justify-center transition-colors shadow-lg touch-none`}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
                  ) : (
                    <Music className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
                  )}
                </button>
                <button
                  onClick={resetGame}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg touch-none"
                  aria-label="Reset game"
                >
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
                </button>
                <button
                  onClick={nextScenario}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg touch-none"
                  aria-label="Next scenario"
                >
                  <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-white" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Help Button - Responsive positioning */}
        <button
          onClick={showHelp}
          className="fixed top-2 sm:top-4 right-2 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg touch-none z-[60]"
          aria-label="Show help"
        >
          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white" />
        </button>

        {/* Floating Text - Responsive sizing */}
        {floatingText.show && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[70] px-4">
            <div
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-green-400 animate-float-fade text-center"
              style={{
                textShadow: "4px 4px 8px rgba(128, 0, 128, 0.8), -2px -2px 4px rgba(0, 0, 0, 0.6)",
                filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.7))",
              }}
            >
              {floatingText.text}
            </div>
          </div>
        )}

        {/* Overlay - Improved responsive design */}
        {showOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl max-w-xs sm:max-w-sm lg:max-w-md w-full text-center max-h-[90vh] overflow-y-auto">
              {gameState === "start" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-black">{gameConfig.gameTitle}</h2>
                  <p className="mb-4 text-black">{gameConfig.instructions}</p>

                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-2 text-black">Choose Difficulty:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(["easy", "medium", "hard", "all"] as const).map((diff) => (
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
                                    ? "bg-red-500 text-black"
                                    : "bg-blue-500 text-black"
                              : "bg-gray-200 text-black hover:bg-gray-300"
                          }`}
                        >
                          {diff.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-black mt-2">
                      {difficulty === "all"
                        ? `All ${totalLevels} scenarios`
                        : `${gameConfig.scenarios.filter((s) => s.difficulty === difficulty).length} ${difficulty} scenarios`}
                    </p>
                  </div>

                  <button
                    onClick={startGame}
                    className="px-6 py-2 bg-blue-500 text-black rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Game
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

export default LabellingGame