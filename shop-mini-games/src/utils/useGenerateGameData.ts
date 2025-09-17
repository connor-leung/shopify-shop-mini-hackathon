import { useGenerateQuestionWithMultipleSearches, Difficulty } from './generateQuestions'

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

// Generates one question for each difficulty level. Useful for the Connections game.
export function useGenerateGameData(): UseGenerateGameDataResult {
  const easy = useGenerateQuestionWithMultipleSearches('easy')
  const medium = useGenerateQuestionWithMultipleSearches('medium')
  const hard = useGenerateQuestionWithMultipleSearches('hard')
  const expert = useGenerateQuestionWithMultipleSearches('expert')

  const loading = easy.loading || medium.loading || hard.loading || expert.loading
  // Prefer the first truthy error
  const error = easy.error || medium.error || hard.error || expert.error || null

  const categories: GameCategory[] = loading || error ? [] : [
    {
      difficulty: 'easy',
      category: easy.category,
      items: easy.items,
    },
    {
      difficulty: 'medium',
      category: medium.category,
      items: medium.items,
    },
    {
      difficulty: 'hard',
      category: hard.category,
      items: hard.items,
    },
    {
      difficulty: 'expert',
      category: expert.category,
      items: expert.items,
    },
  ]

  return { loading, error, categories }
}
