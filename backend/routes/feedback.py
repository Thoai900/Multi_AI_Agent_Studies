"""Feedback management routes"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Feedback, Response
from schemas import FeedbackCreate, FeedbackUpdate, FeedbackResponse
from security import get_current_user
from feedback_service import FeedbackService

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("/", response_model=List[FeedbackResponse])
async def list_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    response_id: int = Query(None),
    rating: int = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get list of feedback for current user"""
    query = db.query(Feedback).filter(Feedback.user_id == current_user.id)

    if response_id:
        query = query.filter(Feedback.response_id == response_id)
    if rating:
        query = query.filter(Feedback.rating == rating)

    feedbacks = query.offset(skip).limit(limit).all()
    return feedbacks


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create feedback for a response"""
    # Check if response exists and belongs to user's prompt
    response = db.query(Response).filter(Response.id == feedback_data.response_id).first()

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found"
        )

    # Check if user owns the prompt
    if response.prompt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to feedback this response"
        )

    # Check if feedback already exists
    existing_feedback = db.query(Feedback).filter(
        Feedback.response_id == feedback_data.response_id
    ).first()

    if existing_feedback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback already exists for this response"
        )

    # Create feedback
    new_feedback = Feedback(
        response_id=feedback_data.response_id,
        user_id=current_user.id,
        rating=feedback_data.rating,
        comment=feedback_data.comment,
        accuracy=feedback_data.accuracy,
        relevance=feedback_data.relevance,
        is_helpful=feedback_data.is_helpful
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return new_feedback


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific feedback"""
    feedback = db.query(Feedback).filter(
        (Feedback.id == feedback_id) & (Feedback.user_id == current_user.id)
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    return feedback


@router.put("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: int,
    feedback_data: FeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update feedback"""
    feedback = db.query(Feedback).filter(
        (Feedback.id == feedback_id) & (Feedback.user_id == current_user.id)
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    # Update fields
    if feedback_data.rating is not None:
        feedback.rating = feedback_data.rating
    if feedback_data.comment is not None:
        feedback.comment = feedback_data.comment
    if feedback_data.accuracy is not None:
        feedback.accuracy = feedback_data.accuracy
    if feedback_data.relevance is not None:
        feedback.relevance = feedback_data.relevance
    if feedback_data.is_helpful is not None:
        feedback.is_helpful = feedback_data.is_helpful

    db.commit()
    db.refresh(feedback)

    return feedback


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete feedback"""
    feedback = db.query(Feedback).filter(
        (Feedback.id == feedback_id) & (Feedback.user_id == current_user.id)
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    db.delete(feedback)
    db.commit()


@router.get("/{feedback_id}/stats")
async def get_feedback_stats(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for feedback"""
    feedback = db.query(Feedback).filter(
        (Feedback.id == feedback_id) & (Feedback.user_id == current_user.id)
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    stats = FeedbackService.analyze_feedback(db, feedback_id)
    return stats
