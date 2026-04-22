"""Database models for AI Feedback Management System"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ===================== USER MODEL =====================
class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prompts = relationship("Prompt", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")

    class Config:
        from_attributes = True


# ===================== PROMPT MODEL =====================
class Prompt(Base):
    """Store AI prompts with metadata"""
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        String(50),
        default="GENERAL",
        nullable=False
    )  # GENERAL, TECHNICAL, CREATIVE, ANALYSIS
    model_name = Column(String(100), default="gemini-pro", nullable=False)
    parameters = Column(JSON, default=dict)  # temperature, max_tokens, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="prompts")
    responses = relationship("Response", back_populates="prompt", cascade="all, delete-orphan")

    class Config:
        from_attributes = True


# ===================== RESPONSE MODEL =====================
class Response(Base):
    """Store AI responses"""
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)
    execution_time = Column(Float, default=0.0)  # in seconds
    status = Column(
        String(20),
        default="SUCCESS"
    )  # SUCCESS, ERROR, TIMEOUT
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prompt = relationship("Prompt", back_populates="responses")
    feedback = relationship("Feedback", back_populates="response", uselist=False, cascade="all, delete-orphan")

    class Config:
        from_attributes = True


# ===================== FEEDBACK MODEL =====================
class Feedback(Base):
    """Store user feedback on AI responses"""
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    accuracy = Column(Integer, nullable=True)  # 1-5
    relevance = Column(Integer, nullable=True)  # 1-5
    is_helpful = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    response = relationship("Response", back_populates="feedback")
    user = relationship("User", back_populates="feedbacks")

    class Config:
        from_attributes = True
