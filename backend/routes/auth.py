"""User authentication routes"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create tokens
    access_token = create_access_token(data={"sub": new_user.id})
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 3600
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """User login"""
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 3600
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_data: dict):
    """Refresh access token"""
    refresh_token_str = refresh_data.get("refresh_token")

    if not refresh_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )

    try:
        payload = verify_token(refresh_token_str)
        user_id = payload.get("sub")

        if not user_id or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        access_token = create_access_token(data={"sub": user_id})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
            "expires_in": 3600
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user
