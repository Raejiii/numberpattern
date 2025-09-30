import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { gameConfig } from "../config/game-config"

interface TracingItem {
  id: number
  character: string
  name: string
  difficulty: string
  type: string
  strokes: Array<{
    id: number
    path: string
    startPoint: { x: number; y: number }
    endPoint: { x: number; y: number }
  }>
}

export function GameEditor() {
  const [selectedItem, setSelectedItem] = useState(0)
  const [currentItem, setCurrentItem] = useState<TracingItem>(gameConfig.tracingItems[0])

  const handleItemChange = (index: number) => {
    setSelectedItem(index)
    setCurrentItem(gameConfig.tracingItems[index])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Game
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Tracing Game Editor</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Selection Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Tracing Items</h2>
            <div className="space-y-2">
              {gameConfig.tracingItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemChange(index)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    selectedItem === index
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium">{item.character} - {item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.difficulty} • {item.type} • {item.strokes.length} strokes
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Item Details Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Item Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Character</label>
                <div className="text-4xl font-bold text-center py-4 bg-gray-50 rounded-lg">
                  {currentItem.character}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="p-2 bg-gray-50 rounded-lg">{currentItem.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <div className="p-2 bg-gray-50 rounded-lg capitalize">{currentItem.difficulty}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="p-2 bg-gray-50 rounded-lg capitalize">{currentItem.type}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strokes</label>
                <div className="p-2 bg-gray-50 rounded-lg">{currentItem.strokes.length} stroke(s)</div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Preview</h2>
            <div className="aspect-square bg-gray-50 rounded-lg p-4">
              <svg
                viewBox="0 0 300 300"
                className="w-full h-full"
                style={{ maxWidth: "300px", maxHeight: "300px" }}
              >
                {/* Background character */}
                <text
                  x="150"
                  y="200"
                  fontSize="180"
                  textAnchor="middle"
                  fill="rgba(0, 0, 0, 0.1)"
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                >
                  {currentItem.character}
                </text>
                
                {/* Stroke paths */}
                {currentItem.strokes.map((stroke, index) => (
                  <g key={stroke.id}>
                    {/* Guide path */}
                    <path
                      d={stroke.path}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                      opacity="0.7"
                    />
                    
                    {/* Start point */}
                    <circle
                      cx={stroke.startPoint.x}
                      cy={stroke.startPoint.y}
                      r="6"
                      fill="#10b981"
                      className="animate-pulse"
                    />
                    
                    {/* End point */}
                    <circle
                      cx={stroke.endPoint.x}
                      cy={stroke.endPoint.y}
                      r="6"
                      fill="#ef4444"
                    />
                    
                    {/* Stroke number */}
                    <text
                      x={stroke.startPoint.x}
                      y={stroke.startPoint.y - 10}
                      fontSize="12"
                      textAnchor="middle"
                      fill="#374151"
                      fontWeight="bold"
                    >
                      {index + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Start points
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                End points
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-500" style={{ borderStyle: "dashed" }}></div>
                Tracing path
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Game Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Title</label>
              <div className="p-2 bg-gray-50 rounded-lg">{gameConfig.gameTitle}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Items</label>
              <div className="p-2 bg-gray-50 rounded-lg">{gameConfig.tracingItems.length}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <div className="p-2 bg-gray-50 rounded-lg">{gameConfig.instructions}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
