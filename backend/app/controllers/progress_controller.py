from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import List, Optional
from ..database import get_db
from ..services.progress_service import ProgressService
from ..models.user_progress import UserProgress
from ..schemas.progress_schemas import (
    ProgressCreate, ProgressResponse, UserStatsResponse, 
    DailyProgressResponse, LeaderboardResponse, LeaderboardEntry,
    GameStatsResponse, MockLeaderboardResponse, MockLeaderboardEntry
)

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.post("/", response_model=ProgressResponse)
async def create_progress(
    progress_data: ProgressCreate,
    db: Session = Depends(get_db)
):
    """Create a new progress entry for a user"""
    try:
        service = ProgressService(db)
        progress = service.create_progress_entry(progress_data)
        return progress
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}", response_model=List[ProgressResponse])
async def get_user_progress(
    user_id: str,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    """Get user's recent progress entries"""
    service = ProgressService(db)
    progress_entries = service.get_user_progress(user_id, limit)
    return progress_entries

@router.get("/user/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's overall statistics"""
    service = ProgressService(db)
    stats = service.get_user_stats(user_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found")
    
    return UserStatsResponse(
        user_id=stats.user_id,
        total_games_played=stats.total_games_played,
        best_time=stats.best_time,
        average_time=stats.average_time,
        average_lives_remaining=stats.average_lives_remaining,
        total_score=stats.total_score,
        current_streak=stats.current_streak,
        longest_streak=stats.longest_streak,
        last_played=stats.last_played
    )

@router.get("/user/{user_id}/daily", response_model=DailyProgressResponse)
async def get_daily_progress(
    user_id: str,
    target_date: Optional[str] = Query(default=None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """Get user's progress for a specific day (defaults to today)"""
    if target_date:
        try:
            parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        parsed_date = date.today()
    
    service = ProgressService(db)
    daily_progress = service.get_daily_progress(user_id, parsed_date)
    return daily_progress

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db)
):
    """Get leaderboard of top players by best completion time"""
    service = ProgressService(db)
    top_users = service.get_leaderboard(limit)
    
    entries = [
        LeaderboardEntry(
            user_id=user.user_id,
            best_time=user.best_time,
            total_games=user.total_games_played,
            average_time=user.average_time or 0
        )
        for user in top_users
    ]
    
    return LeaderboardResponse(
        entries=entries,
        total_users=len(entries)
    )

@router.get("/game-stats", response_model=GameStatsResponse)
async def get_game_stats(db: Session = Depends(get_db)):
    """Get overall game statistics"""
    service = ProgressService(db)
    stats = service.get_game_stats()
    
    return GameStatsResponse(
        total_players=stats["total_players"],
        average_completion_time=stats["average_completion_time"],
        average_lives_remaining=stats["average_lives_remaining"],
        total_games_played=stats["total_games_played"],
        completion_rate=stats["completion_rate"]
    )

@router.get("/mock-leaderboard", response_model=MockLeaderboardResponse)
async def get_mock_leaderboard(
    user_id: Optional[str] = Query(default=None, description="User ID to find rank for"),
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db)
):
    """Get mock leaderboard with realistic data"""
    service = ProgressService(db)
    leaderboard_data = service.get_mock_leaderboard(user_id, limit)
    
    entries = [
        MockLeaderboardEntry(
            rank=entry["rank"],
            user_id=entry["user_id"],
            best_time=entry["best_time"],
            total_games=entry["total_games"],
            average_lives=entry["average_lives"]
        )
        for entry in leaderboard_data["entries"]
    ]
    
    return MockLeaderboardResponse(
        entries=entries,
        your_rank=leaderboard_data["your_rank"],
        total_players=leaderboard_data["total_players"]
    )@rou
ter.get("/game-stats/{game_type}", response_model=GameStatsResponse)
async def get_game_type_stats(
    game_type: str,
    db: Session = Depends(get_db)
):
    """Get statistics for a specific game type"""
    service = ProgressService(db)
    
    # Filter by game type
    total_games = db.query(func.count(UserProgress.id))\
        .filter(UserProgress.game_type == game_type)\
        .scalar() or 0
    
    total_players = db.query(func.count(func.distinct(UserProgress.user_id)))\
        .filter(UserProgress.game_type == game_type)\
        .scalar() or 0
    
    if total_games == 0:
        return GameStatsResponse(
            total_players=0,
            average_completion_time=0.0,
            average_lives_remaining=0.0,
            total_games_played=0,
            completion_rate=0.0
        )
    
    avg_time = db.query(func.avg(UserProgress.completion_time))\
        .filter(UserProgress.game_type == game_type)\
        .scalar() or 0.0
    
    avg_lives = db.query(func.avg(UserProgress.lives_remaining))\
        .filter(UserProgress.game_type == game_type)\
        .scalar() or 0.0
    
    completed_games = db.query(func.count(UserProgress.id))\
        .filter(UserProgress.game_type == game_type, UserProgress.completed == True)\
        .scalar() or 0
    
    return GameStatsResponse(
        total_players=total_players,
        average_completion_time=round(avg_time, 2),
        average_lives_remaining=round(avg_lives, 2),
        total_games_played=total_games,
        completion_rate=round((completed_games / total_games) * 100, 2) if total_games > 0 else 0.0
    )