from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ProgressCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    completion_time: float = Field(..., gt=0, description="Completion time in seconds")
    score: Optional[int] = Field(default=0, ge=0)
    completed: bool = Field(default=True)
    lives_remaining: Optional[int] = Field(default=3, ge=0, le=5, description="Lives remaining after completion")

class ProgressResponse(BaseModel):
    id: int
    user_id: str
    game_date: datetime
    completion_time: float
    score: int
    completed: bool
    lives_remaining: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserStatsResponse(BaseModel):
    user_id: str
    total_games_played: int
    best_time: Optional[float]
    average_time: Optional[float]
    average_lives_remaining: Optional[float]
    total_score: int
    current_streak: int
    longest_streak: int
    last_played: Optional[datetime]
    
    class Config:
        from_attributes = True

class DailyProgressResponse(BaseModel):
    date: str
    games_played: int
    best_time: Optional[float]
    total_score: int
    completed_games: int

class LeaderboardEntry(BaseModel):
    user_id: str
    best_time: float
    total_games: int
    average_time: float
    
class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total_users: int

class GameStatsResponse(BaseModel):
    total_players: int
    average_completion_time: float
    average_lives_remaining: float
    total_games_played: int
    completion_rate: float

class MockLeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    best_time: float
    total_games: int
    average_lives: float
    
class MockLeaderboardResponse(BaseModel):
    entries: List[MockLeaderboardEntry]
    your_rank: Optional[int] = None
    total_players: int