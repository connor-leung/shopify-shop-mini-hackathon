import { useEffect, useMemo, useState } from 'react'
import { useGenerateGameData } from '../utils/useGenerateGameData'

interface ConnectionsGameProps {
  onFinish: (results: GameResults) => void
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

export default function ConnectionsGame({ onFinish }: ConnectionsGameProps) {
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(to bottom, #FAFAFA, #EEEAFF)'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{borderColor: '#4F34E2'}}></div>
          <p className="text-gray-600 font-medium">Loading your game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(to bottom, #FAFAFA, #EEEAFF)'}}>
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-black mb-2">Game Error</h3>
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
    const disabled = status === 'solved'
    const isAnimatingThis = animatingIds.includes(item.id)
    
    // Simple minimalist styling to match the design
    const getItemClasses = () => {
      const baseClasses = 'relative rounded-lg cursor-pointer select-none transition-all duration-200 flex items-center justify-center aspect-square overflow-hidden w-full'
      
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
        return `${baseClasses} bg-gray-300 border-4 border-gray-700 ${animationClasses}`
      }
      
      if (status === 'solved') {
        return `${baseClasses} bg-gray-200 cursor-default ${animationClasses}`
      }
      
      return `${baseClasses} bg-gray-200 hover:bg-gray-300 ${animationClasses}`
    }

    return (
      <div
        key={item.id}
        className={getItemClasses()}
        onClick={() => (disabled ? null : toggleSelect(item.id))}
      >
        <div className="absolute inset-0 flex items-center justify-center p-1">
          {(() => {
            const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
            const productTitle = item.product?.title || 'Product'
            
            if (imgUrl) {
              return (
                <div className="w-full h-full relative">
                  {/* Image with consistent styling */}
                  <img 
                    src={imgUrl} 
                    alt={productTitle} 
                    className="w-full h-full object-cover rounded-lg brightness-90 contrast-110 saturate-75"
                  />
                  {/* Subtle gradient overlay for uniformity */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-lg" />
                </div>
              )
            }
            
            // Enhanced fallback for items without images
            return (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300">
                <span className="text-xs font-medium text-center px-2 leading-tight text-gray-700">
                  {productTitle}
                </span>
              </div>
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
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(to bottom, #FAFAFA,rgb(233, 228, 255))'}}>
        <div className="max-w-md mx-auto pt-8">
          {/* Game Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black mb-2">Can you find any links?</h1>
            <p className="text-gray-500 text-base">Link together groups of 4 items</p>
          </div>

          {/* Solved Categories */}
          {solvedCategories.length > 0 && (
            <div className="mb-6 space-y-4">
              {solvedCategories.map((solvedCat) => (
                <div key={solvedCat.category} className="bg-green-100 rounded-xl p-4 slide-down">
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-black text-sm uppercase tracking-wide">{solvedCat.category}</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {solvedCat.items.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-lg bg-gray-200 flex items-center justify-center aspect-square overflow-hidden w-full"
                      >
                        <div className="absolute inset-0 flex items-center justify-center p-1">
                          {(() => {
                            const imgUrl = item.product?.featuredImage?.url || item.product?.images?.[0]?.url
                            const productTitle = item.product?.title || 'Product'
                            
                            if (imgUrl) {
                              return (
                                <div className="w-full h-full relative">
                                  <img 
                                    src={imgUrl} 
                                    alt={productTitle} 
                                    className="w-full h-full object-cover rounded-lg brightness-90 contrast-110 saturate-75"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-lg" />
                                </div>
                              )
                            }
                            return (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300">
                                <span className="text-xs font-medium text-center px-1 leading-tight text-gray-700">
                                  {productTitle}
                                </span>
                              </div>
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
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-2">
              {shuffledItems.map(renderItem)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 py-3 rounded-full border-2 font-semibold bg-white transition-colors" style={{borderColor: '#4F34E2', color: '#4F34E2'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#F8F6FF'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
              Hint
            </button>
            <button
              className={`flex-1 py-3 rounded-full font-semibold transition-all duration-200 ${
                selectedIds.length === 4 && !gameOver && !isAnimating
                  ? 'text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={selectedIds.length === 4 && !gameOver && !isAnimating ? {backgroundColor: '#4F34E2'} : {}}
              disabled={selectedIds.length !== 4 || gameOver || isAnimating}
              onClick={submitGuess}
              onMouseEnter={(e) => {
                if (selectedIds.length === 4 && !gameOver && !isAnimating) {
                  e.target.style.backgroundColor = '#3D26B8'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIds.length === 4 && !gameOver && !isAnimating) {
                  e.target.style.backgroundColor = '#4F34E2'
                }
              }}
            >
              {gameOver ? 'Game Over' : 
               isAnimating ? 'Processing...' :
               'Submit'}
            </button>
          </div>
          
          {/* Mistakes Display with Lightning Icons */}
          <div className="text-center">
            <div className="flex justify-center space-x-1">
              {Array.from({ length: lives }, (_, i) => (
                <span key={i} className={`text-2xl ${i < mistakes ? 'text-gray-300' : 'text-black'}`}>
                  ⚡
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
