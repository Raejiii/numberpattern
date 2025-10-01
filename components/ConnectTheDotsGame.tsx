import { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX, SkipForward } from "lucide-react"
import confetti from "canvas-confetti"
import { gameConfig } from "../config/game-config"

export function ConnectTheDotsGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0)
  const [currentShape, setCurrentShape] = useState(gameConfig.shapes[0]) // Initialize with first shape
  const [connectedDots, setConnectedDots] = useState([])
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(null)
  const [nextDotNumber, setNextDotNumber] = useState(1)
  const [isShapeComplete, setIsShapeComplete] = useState(false)
  const [showShapeImage, setShowShapeImage] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false) // Fixed: removed circular reference
  const [startDot, setStartDot] = useState(null)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [totalLevels] = useState(gameConfig.shapes.length)
  const [difficulty, setDifficulty] = useState("all") // "easy", "medium", "hard", "all"
  const [filteredShapes, setFilteredShapes] = useState(gameConfig.shapes)
  const audioRefs = useRef({})
  const gameAreaRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsSplashFading(true)
    }, gameConfig.splashScreen.duration - 500)

    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, gameConfig.splashScreen.duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  useEffect(() => {
    if (!showSplash) {
      resetGame()
    }
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
    }
  }, [showSplash])

  useEffect(() => {
    if (gameState === "playing" && !isMuted) {
      playAudio("background", true)
    } else {
      pauseAudio("background")
    }
  }, [gameState, isMuted])

  // Update filtered shapes when difficulty changes
  useEffect(() => {
    if (difficulty === "all") {
      setFilteredShapes(gameConfig.shapes)
    } else {
      setFilteredShapes(gameConfig.shapes.filter((shape) => shape.difficulty === difficulty))
    }
  }, [difficulty])

  const playAudio = (name, loop = false) => {
    if (!isMuted) {
      if (!audioRefs.current[name]) {
        audioRefs.current[name] = new Audio(gameConfig.audio[name])
        audioRefs.current[name].loop = loop
      }

      // Only play if the audio isn't already playing
      if (audioRefs.current[name].paused || name === "connect") {
        // For connect sound, reset and play from beginning
        if (name === "connect") {
          audioRefs.current[name].currentTime = 0
        }
        audioRefs.current[name].play().catch((error) => {
          console.error(`Error playing audio ${name}:`, error)
        })
      }
    }
  }

  const pauseAudio = (name) => {
    if (audioRefs.current[name]) {
      audioRefs.current[name].pause()
    }
  }

  const stopAllAudio = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
    if (isMuted) {
      if (gameState === "playing") {
        playAudio("background", true)
      }
    } else {
      stopAllAudio()
    }
  }

  const resetGame = () => {
    setCurrentShapeIndex(0)
    setCurrentLevel(1)
    loadShape(0)
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    stopAllAudio()
  }

  const loadShape = (shapeIndex) => {
    const shapesToUse = filteredShapes.length > 0 ? filteredShapes : gameConfig.shapes
    if (!shapesToUse || !shapesToUse[shapeIndex]) {
      console.error("Shape not found at index:", shapeIndex)
      return
    }

    const shape = shapesToUse[shapeIndex]
    setCurrentShape(shape)
    setConnectedDots([])
    setLines([])
    setCurrentLine(null)
    setNextDotNumber(1)
    setIsShapeComplete(false)
    setShowShapeImage(false)
    setIsDrawing(false)
    setStartDot(null)
  }

  const nextShape = () => {
    const shapesToUse = filteredShapes.length > 0 ? filteredShapes : gameConfig.shapes
    if (!shapesToUse || !shapesToUse.length) return

    const nextIndex = (currentShapeIndex + 1) % shapesToUse.length
    setCurrentShapeIndex(nextIndex)
    setCurrentLevel(nextIndex + 1)
    loadShape(nextIndex)
    playAudio("uiClick")
  }

  const autoAdvanceToNextLevel = () => {
    const shapesToUse = filteredShapes.length > 0 ? filteredShapes : gameConfig.shapes
    if (!shapesToUse || !shapesToUse.length) return

    // Check if there are more levels
    if (currentShapeIndex + 1 < shapesToUse.length) {
      // Auto advance after 3 seconds
      setTimeout(() => {
        const nextIndex = currentShapeIndex + 1
        setCurrentShapeIndex(nextIndex)
        setCurrentLevel(nextIndex + 1)
        loadShape(nextIndex)
        setGameState("playing")
        setShowOverlay(false)
        playAudio("uiClick")

        // Show level transition message
        setFloatingText({ text: `Level ${nextIndex + 1}!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 2000)
      }, 3000)
    } else {
      // All levels completed
      setTimeout(() => {
        setGameState("allComplete")
        setShowOverlay(true)
      }, 3000)
    }
  }

  const setDifficultyLevel = (newDifficulty) => {
    setDifficulty(newDifficulty)
    setCurrentShapeIndex(0)
    setCurrentLevel(1)

    // Load first shape of the new difficulty
    setTimeout(() => {
      loadShape(0)
    }, 100)

    playAudio("uiClick")
  }

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setShowSidebar(false)
    playAudio("uiClick")
    playAudio("start")
  }

  const playConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        }),
      )
    }, 250)
  }

  const getDotPosition = (dot) => {
    if (!gameAreaRef.current) return { x: 0, y: 0 }
    const rect = gameAreaRef.current.getBoundingClientRect()
    return {
      x: (dot.x / 100) * rect.width,
      y: (dot.y / 100) * rect.height,
    }
  }

  const getEventPoint = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const getTouchedDot = (point) => {
    if (!gameAreaRef.current || !currentShape) return null
    const rect = gameAreaRef.current.getBoundingClientRect()
    const relativeX = ((point.x - rect.left) / rect.width) * 100
    const relativeY = ((point.y - rect.top) / rect.height) * 100

    return currentShape.dots.find((dot) => {
      const distance = Math.sqrt(Math.pow(dot.x - relativeX, 2) + Math.pow(dot.y - relativeY, 2))
      return distance < 8 // 8% tolerance for touch
    })
  }

  const handleDotClick = (dot) => {
    // This function is now only used for direct clicks, not drag operations
    if (gameState !== "playing" || isShapeComplete || !currentShape) return

    // For direct clicks, just highlight the next expected dot
    if (dot.number !== nextDotNumber) {
      playAudio("incorrect")
      setFloatingText({ text: `Start with dot ${nextDotNumber}!`, show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)
    }
  }

  const handleInteractionStart = (e) => {
    e.preventDefault()
    if (gameState !== "playing" || isShapeComplete) return

    const point = getEventPoint(e)
    const dot = getTouchedDot(point)

    if (dot && dot.number === nextDotNumber) {
      // Start drawing from the correct dot
      setIsDrawing(true)
      setStartDot(dot)
      const position = getDotPosition(dot)
      setCurrentLine({ start: position, end: position, startDot: dot })
      playAudio("connect")
    } else if (dot) {
      // Wrong starting dot
      playAudio("incorrect")
      setFloatingText({ text: `Start with dot ${nextDotNumber}!`, show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)
    }
  }

  const handleInteractionMove = (e) => {
    e.preventDefault()
    if (!isDrawing || !svgRef.current) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const point = getEventPoint(e)
    const x = point.x - svgRect.left
    const y = point.y - svgRect.top

    // Update the current line's end position
    if (currentLine) {
      setCurrentLine({ ...currentLine, end: { x, y } })
    }

    // Check if we're hovering over the next dot
    const hoveredDot = getTouchedDot(point)
    const expectedNext = nextDotNumber === currentShape.dots.length ? 1 : nextDotNumber + 1

    // If we're hovering over the correct next dot, automatically connect to it
    if (hoveredDot && hoveredDot.number === expectedNext && hoveredDot !== startDot) {
      const startPosition = getDotPosition(startDot)
      const endPosition = getDotPosition(hoveredDot)

      // Add the completed line
      setLines((prev) => [...prev, { start: startPosition, end: endPosition }])
      setConnectedDots((prev) => [...prev, startDot.number])

      // Play connect sound only once when a connection is made
      playAudio("connect")

      if (hoveredDot.number === 1 && nextDotNumber === currentShape.dots.length) {
        // Shape completed (connected back to start)
        setConnectedDots((prev) => [...prev, hoveredDot.number])
        setIsShapeComplete(true)
        setIsDrawing(false)
        setCurrentLine(null)

        // Show the shape image with a delay
        setTimeout(() => {
          setShowShapeImage(true)
        }, 500)

        playAudio("success")
        playAudio("levelWin")
        playConfetti()
        setFloatingText({ text: `${currentShape.name} Complete!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 2000)

        // Auto advance to next level
        autoAdvanceToNextLevel()
      } else {
        // Move to next dot and continue drawing
        setNextDotNumber(hoveredDot.number)

        // Set the current end dot as the new start dot for the next line
        setStartDot(hoveredDot)

        // Update the current line to start from the new dot
        const newPosition = getDotPosition(hoveredDot)
        setCurrentLine({
          start: newPosition,
          end: { x, y },
          startDot: hoveredDot,
        })
      }
    }
  }

  const handleInteractionEnd = (e) => {
    e.preventDefault()
    if (!currentLine || !isDrawing) return

    const point = getEventPoint(e)
    const endDot = getTouchedDot(point)

    if (endDot && endDot !== startDot) {
      // Check if this is the correct next dot
      const expectedNext = nextDotNumber === currentShape.dots.length ? 1 : nextDotNumber + 1

      if (endDot.number === expectedNext) {
        // Correct connection!
        const startPosition = getDotPosition(startDot)
        const endPosition = getDotPosition(endDot)

        setLines((prev) => [...prev, { start: startPosition, end: endPosition }])
        setConnectedDots((prev) => [...prev, startDot.number])

        // Play connect sound only once when a connection is made
        playAudio("connect")

        if (endDot.number === 1 && nextDotNumber === currentShape.dots.length) {
          // Shape completed (connected back to start)
          setConnectedDots((prev) => [...prev, endDot.number])
          setIsShapeComplete(true)
          setIsDrawing(false) // Stop drawing when shape is complete
          setCurrentLine(null)

          // Show the shape image with a delay
          setTimeout(() => {
            setShowShapeImage(true)
          }, 500)

          playAudio("success")
          playAudio("levelWin")
          playConfetti()
          setFloatingText({ text: `${currentShape.name} Complete!`, show: true })
          setTimeout(() => {
            setFloatingText({ text: "", show: false })
          }, 2000)

          // Auto advance to next level
          autoAdvanceToNextLevel()
        } else {
          // Move to next dot and continue drawing
          setNextDotNumber(endDot.number)

          // Set the current end dot as the new start dot for the next line
          setStartDot(endDot)

          // Update the current line to start from the new dot
          const newPosition = getDotPosition(endDot)
          setCurrentLine({
            start: newPosition,
            end: newPosition,
            startDot: endDot,
          })
        }
      } else {
        // Wrong connection
        playAudio("incorrect")
        const expectedNext = nextDotNumber === currentShape.dots.length ? 1 : nextDotNumber + 1
        setFloatingText({ text: `Connect to dot ${expectedNext}!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 1000)
      }
    } else {
      // If not connecting to a valid dot, stop drawing
      setCurrentLine(null)
      setIsDrawing(false)
      setStartDot(null)
    }
  }

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused")
      setShowSidebar(true)
      pauseAudio("background")
    } else if (gameState === "paused") {
      setGameState("playing")
      setShowSidebar(false)
      if (!isMuted) {
        playAudio("background", true)
      }
    }
    playAudio("uiClick")
  }

  const showHelp = () => {
    setGameState("help")
    setShowOverlay(true)
    playAudio("instructions")
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

  // Safety check for currentShape
  if (!currentShape) {
    console.error("Current shape is null")
    return (
      <div className="fixed inset-0 bg-[#000B18] flex items-center justify-center">
        <div className="text-black text-xl">Loading game...</div>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-black text-center">
            {isShapeComplete ? `${currentShape.name} Complete!` : "Connect the Dots"}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-1">
            <p className="text-sm sm:text-base text-black/80 text-center">
              Level {currentLevel} of {filteredShapes.length} • {currentShape.difficulty?.toUpperCase() || "EASY"}
            </p>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                currentShape.difficulty === "easy"
                  ? "bg-green-500 text-black"
                  : currentShape.difficulty === "medium"
                    ? "bg-yellow-500 text-black"
                    : "bg-red-500 text-black"
              }`}
            >
              {currentShape.difficulty?.toUpperCase() || "EASY"}
            </span>
          </div>
          <p className="text-sm sm:text-base text-black/80 text-center mt-1">
            {isDrawing
              ? `Drag to dot ${nextDotNumber === currentShape.dots.length ? 1 : nextDotNumber + 1}...`
              : nextDotNumber > currentShape.dots.length
                ? "Connect back to dot 1 to finish!"
                : `Drag from dot ${nextDotNumber} to ${nextDotNumber === currentShape.dots.length ? 1 : nextDotNumber + 1}`}
          </p>
        </div>

        <div
          ref={gameAreaRef}
          className="relative w-[calc(100%-7rem)] sm:w-[calc(100%-9rem)] max-w-[min(90vw,90vh)] max-h-[90vh] aspect-square mx-auto z-20 transition-all duration-300 bg-white/10 rounded-xl backdrop-blur-sm"
          style={{ touchAction: "none" }}
          onMouseDown={handleInteractionStart}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
        >
          {/* Shape Image (shown when completed) */}
          {showShapeImage && currentShape.image && (
            <div className="absolute inset-0 w-full h-full z-20 pointer-events-none animate-reveal-shape">
              <img
                src={currentShape.image || "/placeholder.svg"}
                alt={currentShape.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Dots */}
          {!showShapeImage &&
            currentShape.dots
              .filter((dot, index, array) => {
                // Remove duplicate dots (like the closing dot that returns to start)
                return index === array.findIndex((d) => d.x === dot.x && d.y === dot.y)
              })
              .map((dot, index) => (
                <div
                  key={index}
                  className={`absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-300 transform pointer-events-none ${
                    connectedDots.includes(dot.number)
                      ? "bg-green-500 text-white shadow-lg scale-110"
                      : dot.number === nextDotNumber && !isDrawing
                        ? "bg-yellow-400 text-black shadow-lg animate-pulse"
                        : isDrawing && startDot?.number === dot.number
                          ? "bg-blue-500 text-white shadow-lg scale-110"
                          : "bg-white text-black shadow-md"
                  } ${showShapeImage ? "z-30" : "z-20"}`}
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    transform: `translate(-50%, -50%) ${connectedDots.includes(dot.number) || dot.number === nextDotNumber ? "scale(1.1)" : "scale(1)"}`,
                    touchAction: "none",
                  }}
                  aria-label={`Dot number ${dot.number}`}
                  onClick={() => handleDotClick(dot)}
                >
                  {dot.number}
                </div>
              ))}

          {/* SVG for lines */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: showShapeImage ? 25 : 15 }}
          >
            {/* Completed lines */}
            {lines.map((line, index) => (
              <line
                key={index}
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-draw-line"
              />
            ))}

            {/* Current drawing line */}
            {currentLine && isDrawing && (
              <line
                x1={currentLine.start.x}
                y1={currentLine.start.y}
                x2={currentLine.end.x}
                y2={currentLine.end.y}
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )}
          </svg>
        </div>

        {/* Control Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-[90]">
          <button
            onClick={toggleMute}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white/20 hover:scale-105"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Music className="w-6 h-6" />}
          </button>

          <button
            onClick={showHelp}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white/20 hover:scale-105"
            title="Help"
          >
            <HelpCircle className="w-6 h-6" />
          </button>

          <button
            onClick={resetGame}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white/20 hover:scale-105"
            title="Restart"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={togglePause}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white/20 hover:scale-105"
            title={gameState === "playing" ? "Pause" : "Resume"}
          >
            {gameState === "playing" ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          <button
            onClick={nextShape}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white/20 hover:scale-105"
            title="Next Level"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Floating Text */}
        {floatingText.show && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-float-fade">
            <div className="bg-black/80 text-white px-6 py-3 rounded-lg text-xl font-bold shadow-lg">
              {floatingText.text}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for game states */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            {gameState === "start" && (
              <>
                <h2 className="text-3xl font-bold text-black mb-4">Connect the Dots</h2>
                <p className="text-black/80 mb-6">
                  Connect the numbered dots in order to reveal the hidden shape!
                </p>
                <div className="mb-6">
                  <p className="text-sm text-black/60 mb-3">Choose difficulty:</p>
                  <div className="flex gap-2 justify-center">
                    {["easy", "medium", "hard", "all"].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficultyLevel(diff)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          difficulty === diff
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-black hover:bg-gray-300"
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
                >
                  Start Game
                </button>
              </>
            )}

            {gameState === "help" && (
              <>
                <h2 className="text-2xl font-bold text-black mb-4">How to Play</h2>
                <div className="text-left text-black/80 space-y-3 mb-6">
                  <p>• Drag from one numbered dot to the next in sequence</p>
                  <p>• Start with dot 1 and continue in order</p>
                  <p>• Complete the shape by connecting back to dot 1</p>
                  <p>• Use the control buttons to pause, restart, or get help</p>
                </div>
                <button
                  onClick={() => {
                    setGameState("playing")
                    setShowOverlay(false)
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Got it!
                </button>
              </>
            )}

            {gameState === "allComplete" && (
              <>
                <h2 className="text-3xl font-bold text-black mb-4">🎉 Congratulations!</h2>
                <p className="text-black/80 mb-6">
                  You've completed all the shapes! Great job connecting the dots!
                </p>
                <button
                  onClick={resetGame}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
                >
                  Play Again
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sidebar for pause menu */}
      {showSidebar && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-xl z-50 p-6">
          <h3 className="text-xl font-bold text-black mb-4">Game Paused</h3>
          <div className="space-y-4">
            <button
              onClick={togglePause}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Resume Game
            </button>
            <button
              onClick={resetGame}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Restart Game
            </button>
            <button
              onClick={showHelp}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Help
            </button>
          </div>
        </div>
      )}
    </div>
  )
}