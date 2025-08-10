# Gaming Leaderboard Backend

A Ruby backend API built with Sinatra for tracking game scores, times, and lives with mock multiplayer leaderboard functionality.

## 🎮 Features

- **Game Session Management**: Track when users start and complete games
- **Score Tracking**: Record time, lives remaining, and total scores
- **Mock Multiplayer**: Compare user scores against a realistic leaderboard
- **Leaderboard Rankings**: Multiple categories (speed, survival, overall score)
- **Score Comparison**: Get percentile rankings and improvement suggestions
- **RESTful API**: Clean, RESTful endpoints for gaming data
- **SQLite Database**: Lightweight database for development
- **CORS Support**: Cross-origin resource sharing enabled
- **ActiveRecord**: Object-relational mapping

## 🏆 Gaming Features

### Score Components
- **Time (seconds)**: How fast the user completed the game
- **Lives Remaining**: How many lives the user had left
- **Total Score**: Combined score based on time and lives

### Leaderboard Categories
- **Overall Score**: Highest total scores
- **Speed**: Fastest completion times
- **Survival**: Most lives remaining

### Mock Multiplayer
- Pre-populated leaderboard with realistic player data
- Real-time rank calculations
- Percentile rankings
- Personalized improvement suggestions

## 🛠️ Tech Stack

- **Ruby 3.2.0+**
- **Sinatra** - Lightweight web framework
- **ActiveRecord** - ORM for database operations
- **SQLite3** - Database
- **Rack** - Web server interface
- **Bundler** - Dependency management

## 📋 Prerequisites

- Ruby 3.2.0 or higher
- Bundler gem

## 🚀 Installation

1. **Clone the repository and navigate to the socials directory:**
   ```bash
   cd socials
   ```

2. **Install dependencies:**
   ```bash
   bundle install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Create and set up the database:**
   ```bash
   bundle exec rake db:create
   bundle exec rake db:migrate
   bundle exec rake db:seed
   ```

## 🎯 Running the Application

### Development Mode (with auto-reload)
```bash
bundle exec rake server:start
```

### Production Mode
```bash
bundle exec rake server:start_prod
```

### Quick Start Script
```bash
./start.sh
```

The server will start on `http://localhost:4567`

## 🎮 API Endpoints

### Health Check
- `GET /health` - Server health status

### Game Sessions
- `POST /api/game-sessions` - Start a new game session

### Score Management
- `POST /api/scores` - Submit a game score
- `GET /api/users/:user_id/best-score` - Get user's best score

### Leaderboards
- `GET /api/leaderboard` - Get overall leaderboard (real + mock data)
- `GET /api/leaderboard/:category` - Get leaderboard by category (speed/survival/score)

### Score Analysis
- `POST /api/compare-score` - Compare user score with leaderboard

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID

## 🗄️ Database Management

### Available Rake Tasks

```bash
# Create database
bundle exec rake db:create

# Run migrations
bundle exec rake db:migrate

# Seed with gaming sample data
bundle exec rake db:seed

# Reset database (drop, create, migrate, seed)
bundle exec rake db:reset

# Drop database
bundle exec rake db:drop
```

### Gaming-Specific Tasks

```bash
# Show current mock leaderboard
bundle exec rake gaming:leaderboard

# Show database scores
bundle exec rake gaming:scores

# Test score comparison
bundle exec rake gaming:test_score[60,2,7500]
```

## 📊 Project Structure

```
socials/
├── app.rb                 # Main Sinatra application with gaming API
├── config.ru             # Rack configuration
├── Gemfile               # Ruby dependencies
├── Rakefile              # Database and gaming tasks
├── env.example           # Environment variables template
├── README.md             # This file
├── start.sh              # Quick start script
├── db/                   # Database files
│   ├── migrate/          # Database migrations
│   └── seeds.rb          # Gaming sample data
└── spec/                 # Test files
```

## 🎯 API Usage Examples

### Submit a Game Score
```bash
curl -X POST http://localhost:4567/api/scores \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "game_session_id": 1,
    "time_seconds": 120,
    "lives_remaining": 2,
    "total_score": 7800
  }'
```

### Get Leaderboard
```bash
curl http://localhost:4567/api/leaderboard
```

### Compare Score
```bash
curl -X POST http://localhost:4567/api/compare-score \
  -H "Content-Type: application/json" \
  -d '{
    "time_seconds": 90,
    "lives_remaining": 3,
    "total_score": 8500
  }'
```

## 🧪 Testing

Run tests with:
```bash
bundle exec rspec
```

## 🔧 Development

### Adding New Game Types
1. Update the `game_type` validation in `GameSession` model
2. Add game-specific scoring logic in the `Score` model
3. Update leaderboard calculations if needed

### Adding New Score Metrics
1. Add new columns to the `scores` table via migration
2. Update the `Score` model validations
3. Modify scoring algorithms and leaderboard calculations

## 📈 Mock Leaderboard Data

The backend includes realistic mock data with:
- 10 pre-populated players
- Varied completion times (38s - 95s)
- Different survival strategies (0-5 lives)
- Realistic score ranges (7500-9850 points)
- Balanced speed vs. survival trade-offs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
