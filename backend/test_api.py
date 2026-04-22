"""Unit and Integration Tests for AI Feedback Management System"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db
from models import User, Prompt, Response, Feedback
from security import hash_password, create_access_token
from config import SECRET_KEY, ALGORITHM

# Setup test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    """Override database dependency for tests"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(autouse=True)
def setup_teardown():
    """Setup and teardown for each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user():
    """Create test user"""
    db = TestingSessionLocal()
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_user_token(test_user):
    """Create JWT token for test user"""
    token = create_access_token(data={"sub": test_user.id})
    return token

@pytest.fixture
def test_prompt(test_user):
    """Create test prompt"""
    db = TestingSessionLocal()
    prompt = Prompt(
        user_id=test_user.id,
        title="Test Prompt",
        content="This is a test prompt",
        category="GENERAL",
        model_name="gemini-pro",
        parameters={"temperature": 0.7}
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

@pytest.fixture
def test_response(test_prompt):
    """Create test response"""
    db = TestingSessionLocal()
    response = Response(
        prompt_id=test_prompt.id,
        content="This is a test response",
        tokens_used=100,
        execution_time=1.5,
        status="SUCCESS"
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Test authentication endpoints"""

    def test_register_success(self):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, test_user):
        """Test registration with duplicate email"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "test@example.com",  # Already exists
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_short_password(self):
        """Test registration with short password"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "short"  # Less than 8 chars
            }
        )
        assert response.status_code == 422  # Validation error

    def test_login_success(self, test_user):
        """Test successful login"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, test_user):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401

    def test_get_current_user(self, test_user_token):
        """Test getting current user info"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"

    def test_unauthorized_request(self):
        """Test request without authentication"""
        response = client.get("/api/auth/me")
        assert response.status_code == 403


# ============================================================================
# PROMPT MANAGEMENT TESTS
# ============================================================================

class TestPrompts:
    """Test prompt management endpoints"""

    def test_create_prompt_success(self, test_user_token):
        """Test creating a prompt"""
        response = client.post(
            "/api/prompts/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "title": "Python Guide",
                "content": "Teach me Python",
                "description": "Learning Python",
                "category": "TECHNICAL",
                "model_name": "gemini-pro",
                "parameters": {"temperature": 0.5}
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Python Guide"
        assert data["category"] == "TECHNICAL"

    def test_list_prompts(self, test_user_token, test_prompt):
        """Test listing prompts"""
        response = client.get(
            "/api/prompts/",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_prompt(self, test_user_token, test_prompt):
        """Test getting a specific prompt"""
        response = client.get(
            f"/api/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_prompt.id
        assert data["title"] == test_prompt.title

    def test_get_nonexistent_prompt(self, test_user_token):
        """Test getting non-existent prompt"""
        response = client.get(
            "/api/prompts/9999",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 404

    def test_update_prompt(self, test_user_token, test_prompt):
        """Test updating a prompt"""
        response = client.put(
            f"/api/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"title": "Updated Title"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    def test_delete_prompt(self, test_user_token, test_prompt):
        """Test deleting a prompt"""
        response = client.delete(
            f"/api/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 204

    def test_filter_prompts_by_category(self, test_user_token, test_prompt):
        """Test filtering prompts by category"""
        response = client.get(
            "/api/prompts/?category=GENERAL",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        for prompt in data:
            assert prompt["category"] == "GENERAL"


# ============================================================================
# FEEDBACK TESTS
# ============================================================================

class TestFeedback:
    """Test feedback management endpoints"""

    def test_create_feedback_success(self, test_user_token, test_response):
        """Test creating feedback"""
        response = client.post(
            "/api/feedback/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "response_id": test_response.id,
                "rating": 5,
                "comment": "Excellent response!",
                "accuracy": 5,
                "relevance": 4,
                "is_helpful": True
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 5
        assert data["comment"] == "Excellent response!"

    def test_create_feedback_duplicate(self, test_user_token, test_response):
        """Test creating duplicate feedback"""
        # Create first feedback
        client.post(
            "/api/feedback/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "response_id": test_response.id,
                "rating": 5,
                "is_helpful": True
            }
        )
        
        # Try to create duplicate
        response = client.post(
            "/api/feedback/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "response_id": test_response.id,
                "rating": 4,
                "is_helpful": True
            }
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_invalid_rating(self, test_user_token, test_response):
        """Test feedback with invalid rating"""
        response = client.post(
            "/api/feedback/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "response_id": test_response.id,
                "rating": 10,  # Invalid (should be 1-5)
                "is_helpful": True
            }
        )
        assert response.status_code == 422  # Validation error

    def test_list_feedback(self, test_user_token, test_response):
        """Test listing feedback"""
        # Create feedback first
        client.post(
            "/api/feedback/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "response_id": test_response.id,
                "rating": 5,
                "is_helpful": True
            }
        )
        
        response = client.get(
            "/api/feedback/",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ============================================================================
# ANALYTICS TESTS
# ============================================================================

class TestAnalytics:
    """Test analytics endpoints"""

    def test_get_user_analytics(self, test_user_token):
        """Test getting user analytics"""
        response = client.get(
            "/api/analytics/user?days=7",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_requests" in data
        assert "success_rate" in data
        assert "avg_execution_time" in data

    def test_get_prompt_analytics(self, test_user_token, test_prompt):
        """Test getting prompt analytics"""
        response = client.get(
            f"/api/analytics/prompt/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_responses" in data
        assert "success_count" in data


# ============================================================================
# EDGE CASE TESTS
# ============================================================================

class TestEdgeCases:
    """Test edge cases and error scenarios"""

    def test_missing_required_field(self, test_user_token):
        """Test missing required field in request"""
        response = client.post(
            "/api/prompts/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"title": "Only title"}  # Missing 'content'
        )
        assert response.status_code == 422

    def test_invalid_json(self, test_user_token):
        """Test invalid JSON request"""
        response = client.post(
            "/api/prompts/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            data="invalid json",
            content_type="application/json"
        )
        assert response.status_code == 422

    def test_empty_prompt_content(self, test_user_token):
        """Test empty prompt content"""
        response = client.post(
            "/api/prompts/",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "title": "Test",
                "content": "",  # Empty content
                "category": "GENERAL"
            }
        )
        assert response.status_code == 422

    def test_pagination(self, test_user_token):
        """Test pagination parameters"""
        response = client.get(
            "/api/prompts/?skip=0&limit=10",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200

    def test_invalid_limit(self, test_user_token):
        """Test invalid limit parameter"""
        response = client.get(
            "/api/prompts/?limit=10000",  # Exceeds max
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        # Should be capped to maximum
        assert response.status_code in [200, 422]


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
