# Shop Mini Games Backend

A FastAPI backend for tracking user progress and completion times in shop mini games.

## Features

- Track daily game progress
- Record fastest completion times
- User statistics and streaks
- Leaderboard functionality
- RESTful API with automatic documentation

## Docker Setup (Recommended)

1. **Development with hot reload:**

```bash
docker-compose -f docker-compose.dev.yml up --build
```

2. **Production:**

```bash
docker-compose up --build -d
```

3. **Stop services:**

```bash
docker-compose down
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

## Local Setup (Alternative)

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database configuration
```

3. Run the application:

```bash
python run.py
```

## API Endpoints

### Progress Tracking

- `POST /api/progress/` - Create new progress entry
- `GET /api/progress/user/{user_id}` - Get user's recent progress
- `GET /api/progress/user/{user_id}/stats` - Get user statistics
- `GET /api/progress/user/{user_id}/daily` - Get daily progress
- `GET /api/progress/leaderboard` - Get leaderboard

### Health Check

- `GET /health` - Health check endpoint

## Database Schema

### UserProgress

- Tracks individual game sessions
- Records completion time, score, and completion status
- Indexed for efficient queries

### UserStats

- Aggregated user statistics
- Best times, averages, streaks
- Updated automatically on new progress entries

## Architecture

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **Models**: SQLAlchemy database models
- **Schemas**: Pydantic models for request/response validation
