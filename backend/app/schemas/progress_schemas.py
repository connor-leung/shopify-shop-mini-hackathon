from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ProgressCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    completion_time: float = Field(..., gt=0, description="Completion time in seconds")
    score: Optional[int] = Field(default=0, ge=0)
    completed: bool = Field(default=True)

class ProgressResponse(BaseModel):
    id: int
    user_id: str
    game_date: datetime
    completion_time: float
    score: int
    completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserStatsResponse(BaseModel):
    user_id: str
    total_games_played: int
    best_time: Optional[float]
    average_time: Optional[float]
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