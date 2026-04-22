"""Feedback analytics service"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import Feedback, Response, Prompt


class FeedbackService:
    """Service for feedback analysis and aggregation"""

    @staticmethod
    def analyze_feedback(db: Session, feedback_id: int) -> Dict[str, Any]:
        """
        Analyze feedback and get statistics

        Args:
            db: Database session
            feedback_id: Feedback ID to analyze

        Returns:
            Analysis results dictionary
        """
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            return {}

        # Get all feedbacks for the same prompt
        prompt_id = feedback.response.prompt_id
        feedbacks = db.query(Feedback).join(Response).filter(
            Response.prompt_id == prompt_id
        ).all()

        if not feedbacks:
            return {}

        ratings = [f.rating for f in feedbacks if f.rating]
        accuracies = [f.accuracy for f in feedbacks if f.accuracy]
        relevances = [f.relevance for f in feedbacks if f.relevance]

        return {
            "avg_rating": sum(ratings) / len(ratings) if ratings else None,
            "avg_accuracy": sum(accuracies) / len(accuracies) if accuracies else None,
            "avg_relevance": sum(relevances) / len(relevances) if relevances else None,
            "total_feedbacks": len(feedbacks),
            "helpful_count": len([f for f in feedbacks if f.is_helpful])
        }

    @staticmethod
    def get_prompt_statistics(db: Session, prompt_id: int) -> Dict[str, Any]:
        """Get aggregated statistics for a prompt"""
        responses = db.query(Response).filter(Response.prompt_id == prompt_id).all()

        if not responses:
            return {
                "total_responses": 0,
                "success_count": 0,
                "error_count": 0,
                "avg_execution_time": 0,
                "feedbacks": {}
            }

        success_responses = [r for r in responses if r.status == "SUCCESS"]
        error_responses = [r for r in responses if r.status == "ERROR"]
        execution_times = [r.execution_time for r in responses if r.execution_time]

        # Get feedback stats
        feedbacks = db.query(Feedback).filter(
            Feedback.response_id.in_([r.id for r in responses])
        ).all()

        feedback_ratings = [f.rating for f in feedbacks if f.rating]
        feedback_accuracies = [f.accuracy for f in feedbacks if f.accuracy]
        feedback_relevances = [f.relevance for f in feedbacks if f.relevance]

        return {
            "total_responses": len(responses),
            "success_count": len(success_responses),
            "error_count": len(error_responses),
            "success_rate": (len(success_responses) / len(responses) * 100) if responses else 0,
            "avg_execution_time": sum(execution_times) / len(execution_times) if execution_times else 0,
            "feedbacks": {
                "avg_rating": sum(feedback_ratings) / len(feedback_ratings) if feedback_ratings else None,
                "avg_accuracy": sum(feedback_accuracies) / len(feedback_accuracies) if feedback_accuracies else None,
                "avg_relevance": sum(feedback_relevances) / len(feedback_relevances) if feedback_relevances else None,
                "total_feedbacks": len(feedbacks)
            }
        }

    @staticmethod
    def get_user_statistics(db: Session, user_id: int, days: int = 7) -> Dict[str, Any]:
        """Get user statistics for last N days"""
        from_date = datetime.utcnow() - timedelta(days=days)

        # Get prompts for user
        prompts = db.query(Prompt).filter(Prompt.user_id == user_id).all()
        prompt_ids = [p.id for p in prompts]

        if not prompt_ids:
            return {
                "date_range": f"Last {days} days",
                "total_requests": 0,
                "success_rate": 0,
                "avg_execution_time": 0,
                "avg_feedback_rating": None
            }

        # Get responses
        responses = db.query(Response).filter(
            and_(
                Response.prompt_id.in_(prompt_ids),
                Response.created_at >= from_date
            )
        ).all()

        success_count = len([r for r in responses if r.status == "SUCCESS"])
        execution_times = [r.execution_time for r in responses if r.execution_time]

        # Get feedback ratings
        feedbacks = db.query(Feedback).filter(
            Feedback.response_id.in_([r.id for r in responses])
        ).all()
        ratings = [f.rating for f in feedbacks if f.rating]

        return {
            "date_range": f"Last {days} days",
            "total_requests": len(responses),
            "success_rate": (success_count / len(responses) * 100) if responses else 0,
            "avg_execution_time": sum(execution_times) / len(execution_times) if execution_times else 0,
            "avg_feedback_rating": sum(ratings) / len(ratings) if ratings else None,
            "total_feedbacks": len(feedbacks)
        }
