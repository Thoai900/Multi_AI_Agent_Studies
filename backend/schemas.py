"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Dict, Any


# ===================== USER SCHEMAS =====================
class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== TOKEN SCHEMAS =====================
class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ===================== PROMPT SCHEMAS =====================
class PromptCreate(BaseModel):
    """Schema for creating prompt"""
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    description: Optional[str] = None
    category: str = Field(default="GENERAL", pattern="^(GENERAL|TECHNICAL|CREATIVE|ANALYSIS)$")
    model_name: str = Field(default="gemini-pro")
    parameters: Dict[str, Any] = Field(default_factory=dict)


class PromptUpdate(BaseModel):
    """Schema for updating prompt"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


class PromptResponse(BaseModel):
    """Schema for prompt response"""
    id: int
    title: str
    content: str
    description: Optional[str]
    category: str
    model_name: str
    parameters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===================== RESPONSE SCHEMAS =====================
class ResponseCreate(BaseModel):
    """Schema for creating response"""
    prompt_id: int
    content: str


class ResponseData(BaseModel):
    """Schema for response data"""
    id: int
    prompt_id: int
    content: str
    tokens_used: Optional[int]
    execution_time: float
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PromptSendRequest(BaseModel):
    """Schema for sending prompt to AI"""
    model_override: Optional[str] = None


# ===================== FEEDBACK SCHEMAS =====================
class FeedbackCreate(BaseModel):
    """Schema for creating feedback"""
    response_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    accuracy: Optional[int] = Field(None, ge=1, le=5)
    relevance: Optional[int] = Field(None, ge=1, le=5)
    is_helpful: bool = True


class FeedbackUpdate(BaseModel):
    """Schema for updating feedback"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    accuracy: Optional[int] = Field(None, ge=1, le=5)
    relevance: Optional[int] = Field(None, ge=1, le=5)
    is_helpful: Optional[bool] = None


class FeedbackResponse(BaseModel):
    """Schema for feedback response"""
    id: int
    response_id: int
    rating: int
    comment: Optional[str]
    accuracy: Optional[int]
    relevance: Optional[int]
    is_helpful: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== ANALYTICS SCHEMAS =====================
class AnalyticsResponse(BaseModel):
    """Schema for analytics response"""
    total_requests: int
    success_rate: float
    avg_execution_time: float
    avg_feedback_rating: Optional[float]
    total_tokens_used: int
    date_range: str


class ErrorResponse(BaseModel):
    """Schema for error response"""
    error: str
    detail: Optional[str] = None
    status_code: int
