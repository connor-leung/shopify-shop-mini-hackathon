import React, { useEffect, useMemo, useState } from 'react'
import { useGenerateGameData } from '../utils/useGenerateGameData'

interface ConnectionsGameProps {
  onFinish: (results: GameResults) => void
  onQuit?: () => void
}

export interface GameResults {
  won: boolean
  solvedCategories: {
    difficulty: string
    category: string
  }[]
  mistakes: number
  elapsedSeconds: number
  totalGuesses: number
}

// Colours associated with difficulties – aligns with other parts of the app
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-500',
  Medium: 'bg-yellow-400',
  Hard: 'bg-orange-400',
  Expert: 'bg-red-500',
}

export default function ConnectionsGame({ onFinish, onQuit }: ConnectionsGameProps) {
  const { loading, error, categories } = useGenerateGameData()

  // Flattened list of all items with references to their category
  const allItems = useMemo(() => {
    if (loading || error || categories.length === 0) return []
    return categories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        categoryKey: cat.category,
        difficulty: cat.difficulty,
      }))
    )
  }, [loading, error, categories])


  // State for items shown in grid
  const [shuffledItems, setShuffledItems] = useState<typeof allItems>([])

  // Shuffle items once when they first load to avoid endless re-shuffling
  useEffect(() => {
    if (allItems.length === 16 && shuffledItems.length === 0) {
      const arr = [...allItems]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      setShuffledItems(arr)
    }
  }, [allItems, shuffledItems.length])

  // Gameplay state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [solvedCategoryKeys, setSolvedCategoryKeys] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const lives = 4
  const [startTime] = useState(() => Date.now())
  const [totalGuesses, setTotalGuesses] = useState(0)

  // Derived helpers
  const remainingLives = lives - mistakes
  const gameOver = remainingLives === 0 || solvedCategoryKeys.length === 4
  const won = solvedCategoryKeys.length === 4 && remainingLives >= 0

  useEffect(() => {
    if (gameOver) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      onFinish({
        won,
        solvedCategories: categories.map((c) => ({ difficulty: c.difficulty, category: c.category })),
        mistakes,
        elapsedSeconds,
        totalGuesses,
      })
    }
  }, [gameOver])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">Loading game…</div>
    )
  }

  if (error) {
    return <div className="text-red-600 p-4 text-center">Error: {error.message}</div>
  }

  // Handlers
  const toggleSelect = (id: string) => {
    if (gameOver) return

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev // limit 4
      return [...prev, id]
    })
  }

  const submitGuess = () => {
    if (selectedIds.length !== 4) return

    // Find if guess matches any unsolved category
    const matchedCategory = categories.find(
      (cat) =>
        !solvedCategoryKeys.includes(cat.category) &&
        selectedIds.every((id) => cat.items.some((item) => item.id === id))
    )

    setTotalGuesses((g) => g + 1)

    if (matchedCategory) {
      // Correct!
      setSolvedCategoryKeys((prev) => [...prev, matchedCategory.category])
      // Remove those items from display by filtering shuffledItems
      setShuffledItems((items) => items.filter((item) => !selectedIds.includes(item.id)))
    } else {
      // Incorrect
      setMistakes((m) => m + 1)
    }

    // Reset selection
    setSelectedIds([])
  }

  const getItemStatus = (id: string) => {
    if (selectedIds.includes(id)) return 'selected'
    const solvedCat = categories.find((cat) => solvedCategoryKeys.includes(cat.category) && cat.items.some((it) => it.id === id))
    if (solvedCat) return 'solved'
    return 'default'
  }

  const renderItem = (item: typeof allItems[0]) => {
    const status = getItemStatus(item.id)
    const difficultyColor = DIFFICULTY_COLORS[item.difficulty]
    const baseClasses = 'border rounded p-1 cursor-pointer select-none transition-colors flex items-center justify-center aspect-square overflow-hidden w-full'
    const statusClasses =
      status === 'selected'
        ? 'bg-blue-200 border-blue-400'
        : status === 'solved'
        ? `${difficultyColor} text-white cursor-default`
        : 'hover:bg-gray-100'

    const disabled = status === 'solved'

    return (
      <div
        key={item.id}
        className={`${baseClasses} ${statusClasses} ${disabled ? 'opacity-60' : ''}`}
        onClick={() => (disabled ? null : toggleSelect(item.id))}
      >
        {(() => {
          const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
          if (imgUrl) {
            return <img src={imgUrl} alt={item.product?.title} className="w-full h-full object-cover" />
          }
          // Fallback to text if no image
          return <span className="text-sm text-gray-700 w-full text-center px-1">{item.product?.title || 'Product'}</span>
        })()}
      </div>
    )
  }

  return (
    <div className="p-4 pt-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-medium">Lives: {remainingLives}</div>
        {onQuit && (
          <button className="text-red-600 underline text-sm" onClick={onQuit}>
            Quit
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {shuffledItems.map(renderItem)}
      </div>

      {/* Submit */}
      <button
        className="w-full py-2 rounded-md bg-blue-600 text-white disabled:opacity-50 mb-2"
        disabled={selectedIds.length !== 4 || gameOver}
        onClick={submitGuess}
      >
        Submit ({selectedIds.length}/4)
      </button>

      {/* Info */}
      <div className="text-center text-sm text-gray-600">
        {solvedCategoryKeys.length}/4 groups solved • {mistakes} mistakes
      </div>

      {/* Debug / Info – show categories from generateQuestions */}
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        {categories.map((cat) => (
          <div key={cat.difficulty}>
            <span className="font-semibold">{cat.difficulty}:</span> {cat.category} – {cat.items.map((it) => `${it.product?.title} (${it.product?.id})`).join(', ')}
          </div>
        ))}
      </div>
    </div>
  )
}
