from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, date, timedelta
from typing import List, Optional
from ..models.user_progress import UserProgress, UserStats
from ..schemas.progress_schemas import ProgressCreate, UserStatsResponse, DailyProgressResponse

class ProgressService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_progress_entry(self, progress_data: ProgressCreate) -> UserProgress:
        """Create a new progress entry and update user stats"""
        # Create progress entry
        db_progress = UserProgress(
            user_id=progress_data.user_id,
            completion_time=progress_data.completion_time,
            score=progress_data.score,
            completed=progress_data.completed,
            lives_remaining=progress_data.lives_remaining,
            game_type=progress_data.game_type
        )
        self.db.add(db_progress)
        
        # Update user stats
        self._update_user_stats(progress_data.user_id, progress_data)
        
        self.db.commit()
        self.db.refresh(db_progress)
        return db_progress
    
    def get_user_progress(self, user_id: str, limit: int = 50) -> List[UserProgress]:
        """Get user's recent progress entries"""
        return self.db.query(UserProgress)\
            .filter(UserProgress.user_id == user_id)\
            .order_by(desc(UserProgress.game_date))\
            .limit(limit)\
            .all()
    
    def get_user_stats(self, user_id: str) -> Optional[UserStats]:
        """Get user's overall statistics"""
        return self.db.query(UserStats)\
            .filter(UserStats.user_id == user_id)\
            .first()
    
    def get_daily_progress(self, user_id: str, target_date: date) -> DailyProgressResponse:
        """Get user's progress for a specific day"""
        start_date = datetime.combine(target_date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        progress_entries = self.db.query(UserProgress)\
            .filter(and_(
                UserProgress.user_id == user_id,
                UserProgress.game_date >= start_date,
                UserProgress.game_date < end_date
            ))\
            .all()
        
        if not progress_entries:
            return DailyProgressResponse(
                date=target_date.isoformat(),
                games_played=0,
                best_time=None,
                total_score=0,
                completed_games=0
            )
        
        best_time = min(entry.completion_time for entry in progress_entries)
        total_score = sum(entry.score for entry in progress_entries)
        completed_games = sum(1 for entry in progress_entries if entry.completed)
        
        return DailyProgressResponse(
            date=target_date.isoformat(),
            games_played=len(progress_entries),
            best_time=best_time,
            total_score=total_score,
            completed_games=completed_games
        )
    
    def get_leaderboard(self, limit: int = 10):
        """Get top players by best completion time"""
        return self.db.query(UserStats)\
            .filter(UserStats.best_time.isnot(None))\
            .order_by(UserStats.best_time)\
            .limit(limit)\
            .all()
    
    def _update_user_stats(self, user_id: str, progress_data: ProgressCreate):
        """Update or create user statistics"""
        user_stats = self.db.query(UserStats)\
            .filter(UserStats.user_id == user_id)\
            .first()
        
        if not user_stats:
            user_stats = UserStats(
                user_id=user_id,
                total_games_played=0,
                total_score=0,
                current_streak=0,
                longest_streak=0
            )
            self.db.add(user_stats)
        
        # Update basic stats - ensure values are not None
        user_stats.total_games_played = (user_stats.total_games_played or 0) + 1
        user_stats.total_score = (user_stats.total_score or 0) + progress_data.score
        user_stats.last_played = datetime.utcnow()
        
        # Update best time
        if user_stats.best_time is None or progress_data.completion_time < user_stats.best_time:
            user_stats.best_time = progress_data.completion_time
        
        # Calculate average time and lives
        avg_time_query = self.db.query(func.avg(UserProgress.completion_time))\
            .filter(UserProgress.user_id == user_id)
        user_stats.average_time = avg_time_query.scalar()
        
        avg_lives_query = self.db.query(func.avg(UserProgress.lives_remaining))\
            .filter(UserProgress.user_id == user_id)
        user_stats.average_lives_remaining = avg_lives_query.scalar()
        
        # Update streak
        self._update_streak(user_stats)
    
    def _update_streak(self, user_stats: UserStats):
        """Update user's playing streak"""
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Check if user played yesterday
        yesterday_progress = self.db.query(UserProgress)\
            .filter(and_(
                UserProgress.user_id == user_stats.user_id,
                func.date(UserProgress.game_date) == yesterday
            ))\
            .first()
        
        # Check if user played today (before this entry)
        today_progress_count = self.db.query(func.count(UserProgress.id))\
            .filter(and_(
                UserProgress.user_id == user_stats.user_id,
                func.date(UserProgress.game_date) == today
            ))\
            .scalar()
        
        if today_progress_count == 1:  # First game today
            if yesterday_progress:
                user_stats.current_streak = (user_stats.current_streak or 0) + 1
            else:
                user_stats.current_streak = 1
        
        # Update longest streak
        current = user_stats.current_streak or 0
        longest = user_stats.longest_streak or 0
        if current > longest:
            user_stats.longest_streak = current
    
    def get_game_stats(self):
        """Get overall game statistics"""
        total_games = self.db.query(func.count(UserProgress.id)).scalar() or 0
        total_players = self.db.query(func.count(func.distinct(UserProgress.user_id))).scalar() or 0
        
        if total_games == 0:
            return {
                "total_players": 0,
                "average_completion_time": 0.0,
                "average_lives_remaining": 0.0,
                "total_games_played": 0,
                "completion_rate": 0.0
            }
        
        avg_time = self.db.query(func.avg(UserProgress.completion_time)).scalar() or 0.0
        avg_lives = self.db.query(func.avg(UserProgress.lives_remaining)).scalar() or 0.0
        completed_games = self.db.query(func.count(UserProgress.id))\
            .filter(UserProgress.completed == True).scalar() or 0
        
        return {
            "total_players": total_players,
            "average_completion_time": round(avg_time, 2),
            "average_lives_remaining": round(avg_lives, 2),
            "total_games_played": total_games,
            "completion_rate": round((completed_games / total_games) * 100, 2) if total_games > 0 else 0.0
        }
    
    def get_mock_leaderboard(self, user_id: str = None, limit: int = 10):
        """Get mock leaderboard with realistic data"""
        import random
        
        # Mock usernames for demo
        mock_users = [
            "SpeedRunner42", "GameMaster", "QuickSolver", "PuzzleKing", "FastFinisher",
            "TimeBeater", "LifeSaver", "ProGamer", "SwiftPlayer", "ChampionSolver",
            "RushExpert", "BlazeRunner", "NinjaPlayer", "TurboSolver", "FlashGamer"
        ]
        
        # Generate mock leaderboard entries
        entries = []
        for i, username in enumerate(mock_users[:limit]):
            # Generate realistic times (15-120 seconds)
            best_time = round(random.uniform(15.5, 120.0), 2)
            total_games = random.randint(5, 50)
            avg_lives = round(random.uniform(1.2, 4.8), 1)
            
            entries.append({
                "rank": i + 1,
                "user_id": username,
                "best_time": best_time,
                "total_games": total_games,
                "average_lives": avg_lives
            })
        
        # Sort by best time
        entries.sort(key=lambda x: x["best_time"])
        
        # Update ranks after sorting
        for i, entry in enumerate(entries):
            entry["rank"] = i + 1
        
        # Find user's rank if provided
        your_rank = None
        if user_id:
            # Get user's actual best time or generate one
            user_stats = self.get_user_stats(user_id)
            if user_stats and user_stats.best_time:
                user_time = user_stats.best_time
                your_rank = sum(1 for entry in entries if entry["best_time"] < user_time) + 1
            else:
                your_rank = random.randint(limit + 1, limit + 20)
        
        return {
            "entries": entries,
            "your_rank": your_rank,
            "total_players": len(mock_users) + random.randint(50, 200)
        }