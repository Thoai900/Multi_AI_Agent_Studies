"""Analytics and statistics routes"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User
from security import get_current_user
from feedback_service import FeedbackService
from schemas import AnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/user", response_model=AnalyticsResponse)
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, le=365)
):
    """Get user statistics and analytics"""
    stats = FeedbackService.get_user_statistics(db, current_user.id, days)

    return AnalyticsResponse(
        total_requests=stats.get("total_requests", 0),
        success_rate=stats.get("success_rate", 0),
        avg_execution_time=stats.get("avg_execution_time", 0),
        avg_feedback_rating=stats.get("avg_feedback_rating"),
        total_tokens_used=stats.get("total_tokens_used", 0),
        date_range=stats.get("date_range", "")
    )


@router.get("/prompt/{prompt_id}")
async def get_prompt_analytics(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific prompt"""
    from models import Prompt

    # Check if user owns the prompt
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    if prompt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    stats = FeedbackService.get_prompt_statistics(db, prompt_id)
    return stats
