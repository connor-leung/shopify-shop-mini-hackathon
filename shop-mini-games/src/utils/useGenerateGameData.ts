import { useGenerateQuestion, Difficulty } from './generateQuestions'

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
  const easy = useGenerateQuestion('Easy')
  const medium = useGenerateQuestion('Medium')
  const hard = useGenerateQuestion('Hard')
  const expert = useGenerateQuestion('Expert')

  const loading = easy.loading || medium.loading || hard.loading || expert.loading
  // Prefer the first truthy error
  const error = easy.error || medium.error || hard.error || expert.error || null

  const categories: GameCategory[] = loading || error ? [] : [
    {
      difficulty: 'Easy',
      category: easy.category,
      items: easy.items,
    },
    {
      difficulty: 'Medium',
      category: medium.category,
      items: medium.items,
    },
    {
      difficulty: 'Hard',
      category: hard.category,
      items: hard.items,
    },
    {
      difficulty: 'Expert',
      category: expert.category,
      items: expert.items,
    },
  ]

  return { loading, error, categories }
}
