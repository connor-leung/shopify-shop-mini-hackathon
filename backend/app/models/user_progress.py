from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Index
from sqlalchemy.sql import func
from ..database import Base

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    game_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completion_time = Column(Float, nullable=False)  # in seconds
    score = Column(Integer, default=0)
    completed = Column(Boolean, default=True)
    lives_remaining = Column(Integer, default=3)  # lives left after completion
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'game_date'),
        Index('idx_user_completion_time', 'user_id', 'completion_time'),
    )

class UserStats(Base):
    __tablename__ = "user_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, nullable=False, index=True)
    total_games_played = Column(Integer, default=0)
    best_time = Column(Float, nullable=True)  # fastest completion time
    average_time = Column(Float, nullable=True)
    average_lives_remaining = Column(Float, nullable=True)  # average lives remaining
    total_score = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)  # consecutive days played
    longest_streak = Column(Integer, default=0)
    last_played = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())