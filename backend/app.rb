require 'sinatra'
require 'sinatra/activerecord'
require 'sinatra/json'
require 'rack/cors'
require 'json'
require 'dotenv'

# Load environment variables
Dotenv.load

# Configure CORS
configure do
  enable :logging
  set :database, { adapter: 'sqlite3', database: 'db/development.sqlite3' }
end

# CORS middleware
use Rack::Cors do
  allow do
    origins '*'
    resource '*', headers: :any, methods: [:get, :post, :put, :delete, :options]
  end
end

# Database models
class User < ActiveRecord::Base
  has_many :game_sessions
  has_many :scores
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
end

class GameSession < ActiveRecord::Base
  belongs_to :user
  has_one :score
  validates :game_type, presence: true
  validates :started_at, presence: true
end

class Score < ActiveRecord::Base
  belongs_to :user
  belongs_to :game_session
  validates :time_seconds, presence: true, numericality: { greater_than: 0 }
  validates :lives_remaining, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_score, presence: true, numericality: { greater_than: 0 }
end

# Mock data for leaderboard comparisons
MOCK_LEADERBOARD = [
  { username: "SpeedRunner_Pro", time_seconds: 45, lives_remaining: 3, total_score: 9850, rank: 1 },
  { username: "TimeMaster", time_seconds: 52, lives_remaining: 2, total_score: 9200, rank: 2 },
  { username: "LifeSaver", time_seconds: 67, lives_remaining: 5, total_score: 8900, rank: 3 },
  { username: "QuickFingers", time_seconds: 48, lives_remaining: 1, total_score: 8750, rank: 4 },
  { username: "SurvivalExpert", time_seconds: 89, lives_remaining: 4, total_score: 8200, rank: 5 },
  { username: "RushPlayer", time_seconds: 38, lives_remaining: 0, total_score: 8100, rank: 6 },
  { username: "SteadyHand", time_seconds: 76, lives_remaining: 3, total_score: 7950, rank: 7 },
  { username: "FastTrack", time_seconds: 43, lives_remaining: 2, total_score: 7800, rank: 8 },
  { username: "EnduranceKing", time_seconds: 95, lives_remaining: 1, total_score: 7650, rank: 9 },
  { username: "PrecisionPlayer", time_seconds: 58, lives_remaining: 3, total_score: 7500, rank: 10 }
].freeze

# Routes
get '/' do
  json({ 
    message: 'Gaming Leaderboard API is running!', 
    version: '1.0.0',
    features: ['Game Sessions', 'Score Tracking', 'Leaderboard Rankings', 'Mock Multiplayer Data']
  })
end

# Health check
get '/health' do
  json({ status: 'healthy', timestamp: Time.now.iso8601 })
end

# Game Sessions endpoints
post '/api/game-sessions' do
  game_session = GameSession.new(
    user_id: params[:user_id],
    game_type: params[:game_type] || 'default',
    started_at: Time.now
  )
  
  if game_session.save
    json({ 
      message: 'Game session started',
      session_id: game_session.id,
      started_at: game_session.started_at
    }, status: 201)
  else
    json({ errors: game_session.errors.full_messages }, status: 422)
  end
end

# Submit game score
post '/api/scores' do
  score = Score.new(
    user_id: params[:user_id],
    game_session_id: params[:game_session_id],
    time_seconds: params[:time_seconds],
    lives_remaining: params[:lives_remaining],
    total_score: params[:total_score]
  )
  
  if score.save
    # Calculate rank against mock leaderboard
    rank = calculate_rank(score)
    
    json({
      message: 'Score submitted successfully',
      score_id: score.id,
      rank: rank,
      leaderboard_position: rank,
      congratulations: generate_congratulation_message(rank)
    }, status: 201)
  else
    json({ errors: score.errors.full_messages }, status: 422)
  end
end

# Get user's best score
get '/api/users/:user_id/best-score' do
  user = User.find_by(id: params[:user_id])
  return json({ error: 'User not found' }, status: 404) unless user
  
  best_score = user.scores.order(:total_score).last
  return json({ message: 'No scores found for this user' }, status: 404) unless best_score
  
  rank = calculate_rank(best_score)
  
  json({
    user: { username: user.username },
    best_score: {
      time_seconds: best_score.time_seconds,
      lives_remaining: best_score.lives_remaining,
      total_score: best_score.total_score,
      rank: rank,
      leaderboard_position: rank
    }
  })
end

# Get leaderboard (combines real scores with mock data)
get '/api/leaderboard' do
  # Get top real scores from database
  real_scores = Score.includes(:user)
                     .order(total_score: :desc)
                     .limit(20)
                     .map do |score|
    {
      username: score.user.username,
      time_seconds: score.time_seconds,
      lives_remaining: score.lives_remaining,
      total_score: score.total_score,
      is_real_player: true
    }
  end
  
  # Combine with mock data and sort by total score
  combined_leaderboard = (real_scores + MOCK_LEADERBOARD).sort_by { |score| -score[:total_score] }
  
  # Add ranks
  combined_leaderboard.each_with_index do |score, index|
    score[:rank] = index + 1
  end
  
  json({
    leaderboard: combined_leaderboard.first(20),
    total_players: combined_leaderboard.length,
    last_updated: Time.now.iso8601
  })
end

# Get leaderboard by category
get '/api/leaderboard/:category' do
  category = params[:category]
  
  case category
  when 'speed'
    # Sort by fastest time
    sorted_leaderboard = MOCK_LEADERBOARD.sort_by { |score| score[:time_seconds] }
  when 'survival'
    # Sort by most lives remaining
    sorted_leaderboard = MOCK_LEADERBOARD.sort_by { |score| -score[:lives_remaining] }
  when 'score'
    # Sort by highest score (default)
    sorted_leaderboard = MOCK_LEADERBOARD.sort_by { |score| -score[:total_score] }
  else
    return json({ error: 'Invalid category. Use: speed, survival, or score' }, status: 400)
  end
  
  # Add ranks
  sorted_leaderboard.each_with_index do |score, index|
    score[:rank] = index + 1
  end
  
  json({
    category: category,
    leaderboard: sorted_leaderboard.first(10),
    description: get_category_description(category)
  })
end

# Compare user score with others
post '/api/compare-score' do
  user_score = {
    time_seconds: params[:time_seconds].to_i,
    lives_remaining: params[:lives_remaining].to_i,
    total_score: params[:total_score].to_i
  }
  
  # Find similar players in mock data
  similar_players = find_similar_players(user_score)
  
  # Calculate percentile
  percentile = calculate_percentile(user_score[:total_score])
  
  json({
    user_score: user_score,
    comparison: {
      percentile: percentile,
      similar_players: similar_players,
      rank_estimate: estimate_rank(user_score[:total_score]),
      improvement_suggestions: generate_improvement_suggestions(user_score)
    }
  })
end

# Users endpoints (simplified for gaming)
get '/api/users' do
  users = User.all
  json(users)
end

post '/api/users' do
  user = User.new(params[:user])
  if user.save
    json(user, status: 201)
  else
    json({ errors: user.errors.full_messages }, status: 422)
  end
end

get '/api/users/:id' do
  user = User.find_by(id: params[:id])
  if user
    json(user)
  else
    json({ error: 'User not found' }, status: 404)
  end
end

# Helper methods
def calculate_rank(score)
  MOCK_LEADERBOARD.count { |mock| mock[:total_score] > score.total_score } + 1
end

def generate_congratulation_message(rank)
  case rank
  when 1
    "🏆 AMAZING! You're the new champion!"
  when 2..3
    "🥈 Incredible! You're in the top 3!"
  when 4..5
    "🥉 Fantastic! You're in the top 5!"
  when 6..10
    "🎯 Great job! You're in the top 10!"
  else
    "👍 Good effort! Keep practicing to climb the ranks!"
  end
end

def get_category_description(category)
  case category
  when 'speed'
    "Fastest completion times - every second counts!"
  when 'survival'
    "Most lives remaining - survival experts only!"
  when 'score'
    "Highest total scores - the ultimate achievement!"
  end
end

def find_similar_players(user_score)
  MOCK_LEADERBOARD.select do |mock|
    (mock[:total_score] - user_score[:total_score]).abs <= 500
  end.first(3)
end

def calculate_percentile(user_score)
  better_than = MOCK_LEADERBOARD.count { |mock| mock[:total_score] < user_score }
  ((better_than.to_f / MOCK_LEADERBOARD.length) * 100).round(1)
end

def estimate_rank(user_score)
  MOCK_LEADERBOARD.count { |mock| mock[:total_score] > user_score } + 1
end

def generate_improvement_suggestions(user_score)
  suggestions = []
  
  if user_score[:time_seconds] > 60
    suggestions << "Try to complete the game faster - speed boosts your score!"
  end
  
  if user_score[:lives_remaining] < 2
    suggestions << "Focus on survival - each life saved adds bonus points!"
  end
  
  if user_score[:total_score] < 7000
    suggestions << "Combine speed and survival for maximum points!"
  end
  
  suggestions.empty? ? ["You're doing great! Keep up the excellent work!"] : suggestions
end

# Error handling
not_found do
  json({ error: 'Not found' }, status: 404)
end

error do
  json({ error: 'Internal server error' }, status: 500)
end
