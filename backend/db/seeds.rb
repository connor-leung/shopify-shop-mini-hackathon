# Clear existing data
User.destroy_all
GameSession.destroy_all
Score.destroy_all

# Create sample users
user1 = User.create!(
  username: 'GameMaster_Alice',
  email: 'alice@gaming.com',
  bio: 'Speed running enthusiast and puzzle master'
)

user2 = User.create!(
  username: 'Survival_Bob',
  email: 'bob@gaming.com',
  bio: 'Loves challenging survival games and strategy'
)

user3 = User.create!(
  username: 'QuickFingers_Charlie',
  email: 'charlie@gaming.com',
  bio: 'Fastest fingers in the west, precision player'
)

# Create sample game sessions
session1 = GameSession.create!(
  user: user1,
  game_type: 'puzzle',
  started_at: 1.hour.ago,
  completed_at: 45.minutes.ago
)

session2 = GameSession.create!(
  user: user2,
  game_type: 'survival',
  started_at: 2.hours.ago,
  completed_at: 1.hour.ago
)

session3 = GameSession.create!(
  user: user3,
  game_type: 'speed',
  started_at: 30.minutes.ago,
  completed_at: 15.minutes.ago
)

# Create sample scores
Score.create!(
  user: user1,
  game_session: session1,
  time_seconds: 180,
  lives_remaining: 3,
  total_score: 8500
)

Score.create!(
  user: user2,
  game_session: session2,
  time_seconds: 300,
  lives_remaining: 5,
  total_score: 9200
)

Score.create!(
  user: user3,
  game_session: session3,
  time_seconds: 90,
  lives_remaining: 1,
  total_score: 7800
)

# Create additional scores for variety
Score.create!(
  user: user1,
  game_session: GameSession.create!(user: user1, game_type: 'speed', started_at: 2.days.ago, completed_at: 2.days.ago - 2.minutes),
  time_seconds: 120,
  lives_remaining: 2,
  total_score: 7600
)

Score.create!(
  user: user2,
  game_session: GameSession.create!(user: user2, game_type: 'puzzle', started_at: 1.day.ago, completed_at: 1.day.ago - 5.minutes),
  time_seconds: 240,
  lives_remaining: 4,
  total_score: 8800
)

Score.create!(
  user: user3,
  game_session: GameSession.create!(user: user3, game_type: 'survival', started_at: 3.days.ago, completed_at: 3.days.ago - 8.minutes),
  time_seconds: 480,
  lives_remaining: 3,
  total_score: 8100
)

puts "🎮 Gaming seed data created successfully!"
puts "Created #{User.count} users, #{GameSession.count} game sessions, and #{Score.count} scores"
puts ""
puts "Sample users:"
User.all.each do |user|
  puts "  - #{user.username} (#{user.email})"
end
puts ""
puts "Sample scores:"
Score.includes(:user).order(:total_score).reverse.each do |score|
  puts "  - #{score.user.username}: #{score.total_score} points (#{score.time_seconds}s, #{score.lives_remaining} lives)"
end
