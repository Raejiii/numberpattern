import { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX, SkipForward } from "lucide-react"
import confetti from "canvas-confetti"
import { gameConfig } from "../config/game-config"

// Define types for the number pattern game
interface AudioRefs {
  [key: string]: HTMLAudioElement;
}

interface NumberPattern {
  id: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  sequence: (number | null)[];
  missingIndex: number;
  correctAnswer: number;
  rule: string;
}



// Sample number patterns
const numberPatterns: NumberPattern[] = [
  {
    id: "1",
    name: "Simple Addition",
    difficulty: "easy",
    sequence: [2, 4, 6, null, 10],
    missingIndex: 3,
    correctAnswer: 8,
    rule: "Add 2 each time"
  },
  {
    id: "2", 
    name: "Skip Counting",
    difficulty: "easy",
    sequence: [5, 10, 15, null, 25],
    missingIndex: 3,
    correctAnswer: 20,
    rule: "Count by 5s"
  },
  {
    id: "3",
    name: "Multiplication Pattern",
    difficulty: "medium",
    sequence: [3, 6, 12, null, 48],
    missingIndex: 3,
    correctAnswer: 24,
    rule: "Multiply by 2 each time"
  },
  {
    id: "4",
    name: "Fibonacci Sequence",
    difficulty: "hard",
    sequence: [1, 1, 2, 3, 5, null, 13],
    missingIndex: 5,
    correctAnswer: 8,
    rule: "Add the two previous numbers"
  },
  {
    id: "5",
    name: "Square Numbers",
    difficulty: "medium",
    sequence: [1, 4, 9, null, 25],
    missingIndex: 3,
    correctAnswer: 16,
    rule: "Perfect squares: 1², 2², 3², 4², 5²"
  }
];

// Generate answer choices (correct answer + 3 distractors)
const generateAnswerChoices = (correctAnswer: number): number[] => {
  const choices = [correctAnswer];
  const range = Math.max(5, Math.abs(correctAnswer));
  
  while (choices.length < 4) {
    const distractor = correctAnswer + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * range + 1);
    if (!choices.includes(distractor) && distractor > 0) {
      choices.push(distractor);
    }
  }
  
  return choices.sort(() => Math.random() - 0.5); // Shuffle
};

export function NumberPatternGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0)
  const [currentPattern, setCurrentPattern] = useState(numberPatterns[0])

  const [currentLevel, setCurrentLevel] = useState(1)
  const [draggedNumber, setDraggedNumber] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [answerChoices, setAnswerChoices] = useState<number[]>([])
  const [isLevelComplete, setIsLevelComplete] = useState(false)
  
  const audioRefs = useRef<AudioRefs>({})
  const gameAreaRef = useRef<HTMLDivElement>(null)

  // Audio configuration - using gameConfig
  const audioConfig = gameConfig.audio;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsSplashFading(true)
    }, 2500)

    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

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



  // Generate answer choices when pattern changes
  useEffect(() => {
    setAnswerChoices(generateAnswerChoices(currentPattern.correctAnswer))
  }, [currentPattern])

  // Timer effect
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100)
      setTimerInterval(interval)
    } else if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [gameState, startTime])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const playAudio = (name: string, loop = false) => {
    if (!isMuted) {
      if (!audioRefs.current[name]) {
        audioRefs.current[name] = new Audio(audioConfig[name as keyof typeof audioConfig])
        audioRefs.current[name].loop = loop
      }

      if (audioRefs.current[name].paused || name === "correct" || name === "incorrect") {
        if (name === "correct" || name === "incorrect") {
          audioRefs.current[name].currentTime = 0
        }
        audioRefs.current[name].play().catch((error: any) => {
          console.error(`Error playing audio ${name}:`, error)
        })
      }
    }
  }

  const pauseAudio = (name: string) => {
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
    setCurrentPatternIndex(0)
    setCurrentLevel(1)
    loadPattern(0)
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    setIsCorrect(false)
    setIsLevelComplete(false)
    setStartTime(Date.now())
    setElapsedTime(0)
    stopAllAudio()
  }

  const loadPattern = (patternIndex: number) => {
    const patternsToUse = numberPatterns
    if (!patternsToUse || !patternsToUse[patternIndex]) {
      console.error("Pattern not found at index:", patternIndex)
      return
    }

    const pattern = patternsToUse[patternIndex]
    setCurrentPattern(pattern)
    setIsCorrect(false)
    setIsLevelComplete(false)
    setDraggedNumber(null)
  }

  const nextPattern = () => {
    const patternsToUse = numberPatterns
    if (!patternsToUse || !patternsToUse.length) return

    const nextIndex = (currentPatternIndex + 1) % patternsToUse.length
    setCurrentPatternIndex(nextIndex)
    setCurrentLevel(nextIndex + 1)
    loadPattern(nextIndex)
    playAudio("uiClick")
  }

  const autoAdvanceToNextLevel = () => {
    const patternsToUse = numberPatterns
    if (!patternsToUse || !patternsToUse.length) return

    if (currentPatternIndex + 1 < patternsToUse.length) {
      setTimeout(() => {
        const nextIndex = currentPatternIndex + 1
        setCurrentPatternIndex(nextIndex)
        setCurrentLevel(nextIndex + 1)
        loadPattern(nextIndex)
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

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setShowSidebar(false)
    setStartTime(Date.now())
    setElapsedTime(0)
    playAudio("uiClick")
    playAudio("start")
  }

  const playConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

    function randomInRange(min: number, max: number) {
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

  const handleDragStart = (e: React.DragEvent, number: number) => {
    setDraggedNumber(number)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (draggedNumber === currentPattern.correctAnswer) {
      setIsCorrect(true)
      setIsLevelComplete(true)
      playAudio("success")
      playAudio("levelWin")
      playConfetti()
      
      setFloatingText({ text: `Correct! ${currentPattern.name}`, show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 2000)

      autoAdvanceToNextLevel()
    } else {
      playAudio("incorrect")
      setFloatingText({ text: "Try again!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)
    }
    
    setDraggedNumber(null)
  }

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused")
      setShowSidebar(true) // Show the left sidebar carousel
      pauseAudio("background")
    } else if (gameState === "paused") {
      setGameState("playing")
      setShowSidebar(false) // Hide the left sidebar carousel
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
            src="/placeholder.svg?height=256&width=256"
            alt="Number Pattern Game"
            className="w-full h-full object-contain animate-fade-in"
          />
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
                Level {currentLevel} of {numberPatterns.length}
              </h2>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                currentPattern.difficulty === "easy" ? "bg-green-500" :
                currentPattern.difficulty === "medium" ? "bg-yellow-500 text-black" :
                "bg-red-500"
              }`}>
                {currentPattern.difficulty?.toUpperCase() || "EASY"}
              </span>
            </div>

            {/* Instructions */}
            <div className="text-center flex-1 max-w-md">
              <p className="responsive-text-sm text-white/90 font-medium">
                {isLevelComplete ? `${currentPattern.name} Complete!` : 
                 isCorrect ? "Well done!" : "Find the missing number in the pattern"}
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

          {/* Game Area Container - Responsive sizing */}
          <div
            ref={gameAreaRef}
            className="flex-1 relative bg-white/10 rounded-xl backdrop-blur-sm p-4 sm:p-6 lg:p-8 mx-4 my-4 max-w-4xl"
          >
            {/* Number Sequence */}
            <div className="flex justify-center items-center gap-4 mb-8">
              {currentPattern.sequence.map((num, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-300 ${
                    num === null
                      ? "bg-yellow-400/20 border-2 border-yellow-400 border-dashed"
                      : isCorrect && index === currentPattern.missingIndex
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-white text-black shadow-md"
                  }`}
                  onDragOver={num === null ? handleDragOver : undefined}
                  onDrop={num === null ? handleDrop : undefined}
                >
                  {num === null ? (
                    isCorrect ? (
                      <span className="text-white">{currentPattern.correctAnswer}</span>
                    ) : (
                      <span className="text-yellow-600">?</span>
                    )
                  ) : (
                    num
                  )}
                </div>
              ))}
            </div>

            {/* Pattern Rule */}
            <div className="text-center mb-6">
              <p className="text-lg text-black/80 font-medium">
                Rule: {currentPattern.rule}
              </p>
            </div>

            {/* Answer Choices */}
            {!isCorrect && (
              <div className="flex justify-center gap-4">
                {answerChoices.map((choice, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, choice)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-xl sm:text-2xl font-bold cursor-move transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    {choice}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                  onClick={nextPattern}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg touch-none"
                  aria-label="Next level"
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
                <h2 className="text-3xl font-bold text-black mb-4">Number Pattern Game</h2>
                <p className="text-black/80 mb-6">
                  Find the missing number in each pattern and drag it to the correct position!
                </p>
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
                  <p>• Look at the number sequence and find the pattern</p>
                  <p>• Drag the correct number from the choices below</p>
                  <p>• Drop it on the yellow dashed box to complete the pattern</p>
                  <p>• Use the pattern rule as a hint to help you</p>
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
                  You've completed all the number patterns! Great job finding all the missing numbers!
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


    </div>
  )
}