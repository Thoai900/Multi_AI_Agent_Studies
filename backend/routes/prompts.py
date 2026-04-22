"""Prompt management routes"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Prompt, Response
from schemas import PromptCreate, PromptUpdate, PromptResponse, PromptSendRequest, ResponseData
from security import get_current_user
from ai_service import ai_service
import time

router = APIRouter(prefix="/prompts", tags=["Prompts"])


@router.get("/", response_model=List[PromptResponse])
async def list_prompts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    category: str = Query(None),
    model_name: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get list of prompts for current user"""
    query = db.query(Prompt).filter(Prompt.user_id == current_user.id)

    if category:
        query = query.filter(Prompt.category == category)
    if model_name:
        query = query.filter(Prompt.model_name == model_name)

    prompts = query.offset(skip).limit(limit).all()
    return prompts


@router.post("/", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    prompt_data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new prompt"""
    new_prompt = Prompt(
        user_id=current_user.id,
        title=prompt_data.title,
        content=prompt_data.content,
        description=prompt_data.description,
        category=prompt_data.category,
        model_name=prompt_data.model_name,
        parameters=prompt_data.parameters
    )

    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)

    return new_prompt


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific prompt"""
    prompt = db.query(Prompt).filter(
        (Prompt.id == prompt_id) & (Prompt.user_id == current_user.id)
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: int,
    prompt_data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a prompt"""
    prompt = db.query(Prompt).filter(
        (Prompt.id == prompt_id) & (Prompt.user_id == current_user.id)
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    # Update fields
    if prompt_data.title is not None:
        prompt.title = prompt_data.title
    if prompt_data.content is not None:
        prompt.content = prompt_data.content
    if prompt_data.description is not None:
        prompt.description = prompt_data.description
    if prompt_data.category is not None:
        prompt.category = prompt_data.category
    if prompt_data.parameters is not None:
        prompt.parameters = prompt_data.parameters

    db.commit()
    db.refresh(prompt)

    return prompt


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prompt"""
    prompt = db.query(Prompt).filter(
        (Prompt.id == prompt_id) & (Prompt.user_id == current_user.id)
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    db.delete(prompt)
    db.commit()


@router.post("/{prompt_id}/send", response_model=ResponseData)
async def send_prompt_to_ai(
    prompt_id: int,
    send_request: PromptSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send prompt to AI model and get response"""
    prompt = db.query(Prompt).filter(
        (Prompt.id == prompt_id) & (Prompt.user_id == current_user.id)
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    # Validate prompt content
    if not await ai_service.validate_prompt(prompt.content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid prompt content"
        )

    # Send to AI service
    model_name = send_request.model_override or prompt.model_name
    response_data = await ai_service.send_prompt(
        prompt_content=prompt.content,
        model_name=model_name,
        parameters=prompt.parameters
    )

    # Save response to database
    status_value = "SUCCESS" if response_data["success"] else "ERROR"
    new_response = Response(
        prompt_id=prompt.id,
        content=response_data.get("content", ""),
        tokens_used=response_data.get("tokens"),
        execution_time=response_data.get("execution_time", 0),
        status=status_value,
        error_message=response_data.get("error")
    )

    db.add(new_response)
    db.commit()
    db.refresh(new_response)

    if not response_data["success"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=response_data.get("error", "AI service error")
        )

    return new_response
