const API_BASE_URL = 'http://localhost:8000/api'

export interface ProgressData {
  user_id: string
  completion_time: number
  score?: number
  completed: boolean
  lives_remaining?: number
  game_type?: string
}

export interface UserStats {
  user_id: string
  total_games_played: number
  best_time?: number
  average_time?: number
  average_lives_remaining?: number
  total_score: number
  current_streak: number
  longest_streak: number
  last_played?: string
}

export interface LeaderboardEntry {
  user_id: string
  best_time: number
  total_games: number
  average_time: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  total_users: number
}

export interface GameStats {
  total_players: number
  average_completion_time: number
  average_lives_remaining: number
  total_games_played: number
  completion_rate: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`🌐 API: Making ${options.method || 'GET'} request to:`, url);
    console.log('🔧 API: Request options:', options);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log('📡 API: Sending request with config:', config);
      const response = await fetch(url, config)
      
      console.log('📥 API: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API: Request failed with error text:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`)
      }
      
      const jsonData = await response.json()
      console.log('✅ API: Success! Response data:', jsonData);
      return jsonData
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🔌 API: Network connection error:', error);
        throw new Error('Unable to connect to the game server. Please check your connection.')
      }
      console.error('💥 API: Request error:', error)
      throw error
    }
  }

  // Submit game progress/results
  async submitProgress(data: ProgressData): Promise<any> {
    return this.request('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    return this.request(`/progress/user/${userId}/stats`)
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<LeaderboardResponse> {
    return this.request(`/progress/leaderboard?limit=${limit}`)
  }

  // Get game statistics
  async getGameStats(gameType?: string): Promise<GameStats> {
    const endpoint = gameType ? `/progress/game-stats/${gameType}` : '/progress/game-stats'
    return this.request(endpoint)
  }

  // Get user's recent progress entries
  async getUserProgress(userId: string, limit: number = 50): Promise<any[]> {
    return this.request(`/progress/user/${userId}?limit=${limit}`)
  }
}

export const apiClient = new ApiClient()

// Helper function to generate or get user ID
export function getUserId(): string {
  console.log('🔑 API: Getting user ID from localStorage');
  const storageKey = 'connections-user-id'
  let userId = localStorage.getItem(storageKey)
  
  if (!userId) {
    // Generate a simple user ID based on timestamp and random number
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('🆔 API: Generated new user ID:', userId);
    localStorage.setItem(storageKey, userId)
    console.log('💾 API: Saved new user ID to localStorage');
  } else {
    console.log('✅ API: Found existing user ID:', userId);
  }
  
  return userId
}
