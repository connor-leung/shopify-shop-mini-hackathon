import { useGenerateQuestion, Difficulty } from './generateQuestions'
import { useMemo } from 'react'

export interface GameCategory {
  difficulty: Difficulty
  category: string
  items: Array<{ id: string; product: any }>
}

export interface UseGenerateGameDataResult {
  loading: boolean
  error: Error | null
  categories: GameCategory[]
}

function filterUniqueItems(
  items: Array<{ id: string; product: any }>, 
  usedIds: Set<string>
): Array<{ id: string; product: any }> {
  return items.filter(item => {
    if (usedIds.has(item.id)) {
      return false
    }
    usedIds.add(item.id)
    return true
  })
}

export function useGenerateGameData(seed?: number): UseGenerateGameDataResult {
  const easy = useGenerateQuestion('easy', seed)
  const medium = useGenerateQuestion('medium', seed)
  const hard = useGenerateQuestion('hard', seed)
  const expert = useGenerateQuestion('expert', seed)

  const loading = easy.loading || medium.loading || hard.loading || expert.loading
  const error = easy.error || medium.error || hard.error || expert.error || null

  const categories: GameCategory[] = useMemo(() => {
    if (loading || error) return []
    
    const usedIds = new Set<string>()
    const processedCategories: GameCategory[] = []
    
    const categoryData = [
      { difficulty: 'easy' as Difficulty, data: easy },
      { difficulty: 'medium' as Difficulty, data: medium },
      { difficulty: 'hard' as Difficulty, data: hard },
      { difficulty: 'expert' as Difficulty, data: expert },
    ]
    
    for (const { difficulty, data } of categoryData) {
      if (data.items && data.items.length >= 4) {
        const uniqueItems = filterUniqueItems(data.items, usedIds)
        
        if (uniqueItems.length >= 4) {
          processedCategories.push({
            difficulty,
            category: data.category,
            items: uniqueItems.slice(0, 4), 
          })
        }
      }
    }
    
    return processedCategories
  }, [loading, error, easy.items, medium.items, hard.items, expert.items, 
      easy.category, medium.category, hard.category, expert.category])

  return { loading, error, categories }
}
