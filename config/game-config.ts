export const gameConfig = {
  gameTitle: "Tracing Game",
  instructions: "Trace the numbers and letters by following the dotted lines!",
  audio: {
    background:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-cherry-cute-bgm-271158-zIouDJ4FGUOTEpIXP10RZWnp9zff4A.mp3",
    success: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/success-MdF7nLdkwPlakm27xQWQmfipYHDzTL.webm",
    uiClick: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ui-click-IH3biGSjh8pksEtf1bHOC49dGslDPU.webm",
    connect: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ui-click-IH3biGSjh8pksEtf1bHOC49dGslDPU.webm",
    incorrect: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/incorrect-EsdPobrzIGyWVonDaJINuAhdNb496F.webm",
    effect: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/effect-7ewtIez1dCpY35G2g66YHhdvLCUekQ.webm",
    levelWin: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/level-win-SxCsRZQKipPLOAIFiceyYmP8n5rMn7.webm",
    clap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clap-9gShvB1t4npUll2sKjSmcNB ScG0mJ5.webm",
    instructions:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Connect%20identical%20pictures%20with%20a%20line-i0hDjGmmmYEiKwr0f3gYBDTuhnEQUR.webm",
    start:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Connect%20identical%20pictures%20with%20a%20line-i0hDjGmmmYEiKwr0f3gYBDTuhnEQUR.webm",
  },
  splashScreen: {
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5(1)-73vfqVPWLBqxMGlVT7qGgN1NjIs7K8.png",
    duration: 2000,
  },
  tracingItems: [
    // Numbers 0-9
    {
      id: 1,
      character: "0",
      name: "Number Zero",
      difficulty: "easy",
      type: "number",
      strokes: [
        {
          id: 1,
          path: "M 30 20 Q 50 10, 70 20 Q 80 50, 70 80 Q 50 90, 30 80 Q 20 50, 30 20",
          startPoint: { x: 30, y: 20 },
          endPoint: { x: 30, y: 20 }
        }
      ]
    },
    {
      id: 2,
      character: "1",
      name: "Number One",
      difficulty: "easy",
      type: "number",
      strokes: [
        {
          id: 1,
          path: "M 40 20 L 50 10 L 50 90",
          startPoint: { x: 40, y: 20 },
          endPoint: { x: 50, y: 90 }
        }
      ]
    },
    {
      id: 3,
      character: "2",
      name: "Number Two",
      difficulty: "easy",
      type: "number",
      strokes: [
        {
          id: 1,
          path: "M 20 30 Q 20 10, 40 10 Q 80 10, 80 40 Q 80 60, 20 90 L 80 90",
          startPoint: { x: 20, y: 30 },
          endPoint: { x: 80, y: 90 }
        }
      ]
    },
    {
      id: 4,
      character: "3",
      name: "Number Three",
      difficulty: "easy",
      type: "number",
      strokes: [
        {
          id: 1,
          path: "M 20 20 Q 40 10, 60 20 Q 70 30, 60 40 Q 70 50, 60 60 Q 40 70, 20 60",
          startPoint: { x: 20, y: 20 },
          endPoint: { x: 20, y: 60 }
        }
      ]
    },
    {
      id: 5,
      character: "4",
      name: "Number Four",
      difficulty: "easy",
      type: "number",
      strokes: [
        {
          id: 1,
          path: "M 60 10 L 60 90",
          startPoint: { x: 60, y: 10 },
          endPoint: { x: 60, y: 90 }
        },
        {
          id: 2,
          path: "M 60 10 L 20 60 L 80 60",
          startPoint: { x: 60, y: 10 },
          endPoint: { x: 80, y: 60 }
        }
      ]
    },
    {
      id: 6,
      character: "5",
      name: "Number Five",
      difficulty: "easy",
      type: "number",
      strokes: [
        {
          id: 1,
          path: "M 70 10 L 20 10 L 20 50 Q 40 40, 60 50 Q 80 60, 60 80 Q 40 90, 20 80",
          startPoint: { x: 70, y: 10 },
          endPoint: { x: 20, y: 80 }
        }
      ]
    },
    // Letters A-F
    {
      id: 11,
      character: "A",
      name: "Letter A",
      difficulty: "medium",
      type: "letter",
      strokes: [
        {
          id: 1,
          path: "M 20 90 L 50 10 L 80 90",
          startPoint: { x: 20, y: 90 },
          endPoint: { x: 80, y: 90 }
        },
        {
          id: 2,
          path: "M 30 65 L 70 65",
          startPoint: { x: 30, y: 65 },
          endPoint: { x: 70, y: 65 }
        }
      ]
    },
    {
      id: 12,
      character: "B",
      name: "Letter B",
      difficulty: "medium",
      type: "letter",
      strokes: [
        {
          id: 1,
          path: "M 20 10 L 20 90 L 60 90 Q 80 90, 80 70 Q 80 50, 60 50 L 20 50",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 20, y: 50 }
        },
        {
          id: 2,
          path: "M 20 10 L 60 10 Q 80 10, 80 30 Q 80 50, 60 50",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 60, y: 50 }
        }
      ]
    },
    {
      id: 13,
      character: "C",
      name: "Letter C",
      difficulty: "medium",
      type: "letter",
      strokes: [
        {
          id: 1,
          path: "M 80 20 Q 60 10, 40 10 Q 20 10, 20 50 Q 20 90, 40 90 Q 60 90, 80 80",
          startPoint: { x: 80, y: 20 },
          endPoint: { x: 80, y: 80 }
        }
      ]
    },
    {
      id: 14,
      character: "D",
      name: "Letter D",
      difficulty: "medium",
      type: "letter",
      strokes: [
        {
          id: 1,
          path: "M 20 10 L 20 90 L 60 90 Q 80 90, 80 50 Q 80 10, 60 10 L 20 10",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 20, y: 10 }
        }
      ]
    },
    {
      id: 15,
      character: "E",
      name: "Letter E",
      difficulty: "medium",
      type: "letter",
      strokes: [
        {
          id: 1,
          path: "M 20 10 L 20 90 L 80 90",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 80, y: 90 }
        },
        {
          id: 2,
          path: "M 20 10 L 70 10",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 70, y: 10 }
        },
        {
          id: 3,
          path: "M 20 50 L 60 50",
          startPoint: { x: 20, y: 50 },
          endPoint: { x: 60, y: 50 }
        }
      ]
    },
    {
      id: 16,
      character: "F",
      name: "Letter F",
      difficulty: "hard",
      type: "letter",
      strokes: [
        {
          id: 1,
          path: "M 20 10 L 20 90",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 20, y: 90 }
        },
        {
          id: 2,
          path: "M 20 10 L 70 10",
          startPoint: { x: 20, y: 10 },
          endPoint: { x: 70, y: 10 }
        },
        {
          id: 3,
          path: "M 20 50 L 60 50",
          startPoint: { x: 20, y: 50 },
          endPoint: { x: 60, y: 50 }
        }
      ]
    }
  ],
}
