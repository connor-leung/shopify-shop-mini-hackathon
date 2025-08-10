import { useEffect, useMemo, useState } from 'react'
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

// Shopify-inspired color scheme with NYT Connections feel
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-600',      // Shopify green
  Medium: 'bg-blue-500',     // Shopify blue  
  Hard: 'bg-purple-600',     // Shopify purple
  Expert: 'bg-red-500',      // Keep red for expert
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
  const [solvedCategories, setSolvedCategories] = useState<Array<{category: string, difficulty: string, items: typeof allItems}>>([])
  const [mistakes, setMistakes] = useState(0)
  const lives = 4
  const [startTime] = useState(() => Date.now())
  const [totalGuesses, setTotalGuesses] = useState(0)
  
  // Animation state
  const [animatingIds, setAnimatingIds] = useState<string[]>([])
  const [animationType, setAnimationType] = useState<'error' | 'success' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Derived helpers
  const solvedCategoryKeys = solvedCategories.map(cat => cat.category)
  const remainingLives = lives - mistakes
  const gameOver = remainingLives === 0 || solvedCategoryKeys.length === 4
  const won = solvedCategoryKeys.length === 4 && remainingLives >= 0

  useEffect(() => {
    if (gameOver) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      onFinish({
        won,
        solvedCategories: solvedCategories.map((c) => ({ difficulty: c.difficulty, category: c.category })),
        mistakes,
        elapsedSeconds,
        totalGuesses,
      })
    }
  }, [gameOver, won, solvedCategories, mistakes, totalGuesses, startTime, onFinish])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-red-200 text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Game Error</h3>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      </div>
    )
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

  // Animation functions
  const playErrorAnimation = async (ids: string[]) => {
    setIsAnimating(true)
    setAnimationType('error')
    
    // Smooth jump animation - one by one with overlap
    for (let i = 0; i < ids.length; i++) {
      setAnimatingIds([ids[i]])
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Brief pause before group shake
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // All shake together
    setAnimatingIds(ids)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Clear animations
    setAnimatingIds([])
    setAnimationType(null)
    setIsAnimating(false)
  }
  
  const playSuccessAnimation = async (ids: string[], matchedCategory: any) => {
    setIsAnimating(true)
    setAnimationType('success')
    
    // Smooth jump animation - one by one with overlap
    for (let i = 0; i < ids.length; i++) {
      setAnimatingIds([ids[i]])
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Brief pause before group celebration
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // All celebrate together
    setAnimatingIds(ids)
    await new Promise(resolve => setTimeout(resolve, 700))
    
    // Move to solved state - add the solved items with their details
    const solvedItems = shuffledItems.filter(item => ids.includes(item.id))
    setSolvedCategories(prev => [...prev, {
      category: matchedCategory.category,
      difficulty: matchedCategory.difficulty,
      items: solvedItems
    }])
    
    // Remove from main grid
    setShuffledItems((items) => items.filter((item) => !ids.includes(item.id)))
    
    // Clear animations
    setAnimatingIds([])
    setAnimationType(null)
    setIsAnimating(false)
  }

  const submitGuess = async () => {
    if (selectedIds.length !== 4 || isAnimating) return

    // Find if guess matches any unsolved category
    const matchedCategory = categories.find(
      (cat) =>
        !solvedCategoryKeys.includes(cat.category) &&
        selectedIds.every((id) => cat.items.some((item) => item.id === id))
    )

    setTotalGuesses((g) => g + 1)

    if (matchedCategory) {
      // Correct! Play success animation
      await playSuccessAnimation(selectedIds, matchedCategory)
    } else {
      // Incorrect - play error animation
      await playErrorAnimation(selectedIds)
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
    const disabled = status === 'solved'
    const isAnimatingThis = animatingIds.includes(item.id)
    
    // NYT Connections-inspired styling with Shopify colors
    const getItemClasses = () => {
      const baseClasses = 'relative rounded-lg border-2 cursor-pointer select-none transition-all duration-200 flex items-center justify-center aspect-square overflow-hidden w-full group'
      
      // Animation classes
      let animationClasses = ''
      if (isAnimatingThis && animationType === 'error') {
        if (animatingIds.length === 1) {
          animationClasses = 'smooth-bounce'
        } else {
          animationClasses = 'shake'
        }
      } else if (isAnimatingThis && animationType === 'success') {
        if (animatingIds.length === 1) {
          animationClasses = 'smooth-bounce'
        } else {
          animationClasses = 'celebrate'
        }
      }
      
      if (status === 'selected') {
        return `${baseClasses} bg-slate-100 border-slate-800 border-4 shadow-lg ${animationClasses}`
      }
      
      if (status === 'solved') {
        return `${baseClasses} ${difficultyColor} border-transparent text-white cursor-default shadow-md ${animationClasses}`
      }
      
      return `${baseClasses} bg-slate-100 border-slate-300 hover:bg-slate-200 hover:border-slate-400 hover:shadow-md hover:scale-105 text-slate-800 ${animationClasses}`
    }

    return (
      <div
        key={item.id}
        className={getItemClasses()}
        onClick={() => (disabled ? null : toggleSelect(item.id))}
      >
        <div className="absolute inset-0 flex items-center justify-center p-2">
          {(() => {
            const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
            if (imgUrl) {
              return (
                <img 
                  src={imgUrl} 
                  alt={item.product?.title} 
                  className="w-full h-full object-cover rounded-md"
                />
              )
            }
            // Fallback to text if no image - styled like NYT Connections
            return (
              <span className={`text-sm font-medium text-center px-2 leading-tight ${
                status === 'solved' ? 'text-white' : 'text-slate-700'
              }`}>
                {item.product?.title || 'Product'}
              </span>
            )
          })()}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Custom animations */}
      <style>{`
        @keyframes smoothBounce {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-15px) scale(1.05); }
          60% { transform: translateY(-8px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        @keyframes celebrate {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(2deg); }
          50% { transform: scale(1.15) rotate(-2deg); }
          75% { transform: scale(1.1) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        @keyframes slideDown {
          0% { 
            transform: translateY(-20px);
            opacity: 0;
          }
          100% { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .smooth-bounce {
          animation: smoothBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .shake {
          animation: shake 0.5s ease-in-out infinite;
        }
        
        .celebrate {
          animation: celebrate 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .slide-down {
          animation: slideDown 0.5s ease-out;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
        {/* Game Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Connections</h1>
          <p className="text-slate-600 text-sm">Find groups of four items that share something in common.</p>
        </div>

        {/* Header Stats */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-6">
            {/* Lives Display */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Mistakes:</span>
              <div className="flex space-x-1">
                {Array.from({ length: lives }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < mistakes ? 'bg-red-400' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Progress */}
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">{solvedCategoryKeys.length}</span>/4 groups found
            </div>
          </div>
          
          {onQuit && (
            <button 
              className="text-slate-500 hover:text-red-500 text-sm font-medium transition-colors duration-200" 
              onClick={onQuit}
            >
              Quit Game
            </button>
          )}
        </div>

        {/* Solved Categories */}
        {solvedCategories.length > 0 && (
          <div className="mb-6 space-y-3">
            {solvedCategories.map((solvedCat) => (
              <div key={solvedCat.category} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 slide-down">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">{solvedCat.category}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${DIFFICULTY_COLORS[solvedCat.difficulty]}`}>
                    {solvedCat.difficulty}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {solvedCat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`relative rounded-lg border-2 border-transparent flex items-center justify-center aspect-square overflow-hidden w-full ${DIFFICULTY_COLORS[solvedCat.difficulty]} text-white shadow-md`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        {(() => {
                          const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
                          if (imgUrl) {
                            return (
                              <img 
                                src={imgUrl} 
                                alt={item.product?.title} 
                                className="w-full h-full object-cover rounded-md"
                              />
                            )
                          }
                          return (
                            <span className="text-sm font-medium text-center px-2 leading-tight text-white">
                              {item.product?.title || 'Product'}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Game Grid */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-4 gap-3">
            {shuffledItems.map(renderItem)}
          </div>
        </div>

        {/* Action Area */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          {/* Submit Button */}
          <button
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 mb-4 ${
              selectedIds.length === 4 && !gameOver && !isAnimating
                ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
            disabled={selectedIds.length !== 4 || gameOver || isAnimating}
            onClick={submitGuess}
          >
            {gameOver ? 'Game Over' : 
             isAnimating ? 'Processing...' :
             `Submit Guess (${selectedIds.length}/4 selected)`}
          </button>
          
          {/* Selection Counter */}
          <div className="flex justify-center space-x-1 mb-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  i < selectedIds.length ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          
          {/* Game Stats */}
          <div className="text-center">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">{totalGuesses}</span> guesses made
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
