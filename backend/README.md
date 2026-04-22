# AI Feedback Management System - Backend Documentation

## 📋 Tổng Quan

Hệ thống quản lý phản hồi AI là một backend hoàn chỉnh giúp:
- Quản lý các prompt AI
- Gửi request đến AI models
- Lưu trữ responses
- Đánh giá và phân tích phản hồi
- Cung cấp thống kê chi tiết

**Framework:** FastAPI + SQLAlchemy + PostgreSQL  
**Authentication:** JWT  
**Language:** Python 3.9+

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Cài Đặt Dependencies

```bash
# Install required packages
pip install -r requirements.txt
```

### 2. Cấu Hình Database

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/ai_feedback

# Hoặc sử dụng SQLite cho development
DATABASE_URL=sqlite:///./ai_feedback.db
```

### 3. Cấu Hình Environment Variables

Tạo file `.env`:

```bash
# JWT
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_feedback

# AI Service
GOOGLE_API_KEY=your-google-api-key
AI_MODEL_NAME=gemini-pro

# Server
DEBUG=True
PORT=8000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
```

### 4. Khởi Chạy Server

```bash
# Development
python main.py

# Hoặc sử dụng uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

---

## 📚 API Endpoints

### Authentication

#### 1. Đăng Ký (Register)
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### 2. Đăng Nhập (Login)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}
```

#### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 4. Lấy Thông Tin User Hiện Tại
```http
GET /api/auth/me
Authorization: Bearer {access_token}
```

---

### Prompts Management

#### 1. Danh Sách Prompts
```http
GET /api/prompts/?category=GENERAL&skip=0&limit=20
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Python Tutorial",
    "content": "Explain how to...",
    "description": "Learn about Python",
    "category": "TECHNICAL",
    "model_name": "gemini-pro",
    "parameters": {"temperature": 0.7},
    "created_at": "2026-04-22T10:00:00",
    "updated_at": "2026-04-22T10:00:00"
  }
]
```

#### 2. Tạo Prompt Mới
```http
POST /api/prompts/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Python Best Practices",
  "content": "Explain Python best practices",
  "description": "Learning about clean code",
  "category": "TECHNICAL",
  "model_name": "gemini-pro",
  "parameters": {
    "temperature": 0.5,
    "max_tokens": 1024
  }
}
```

#### 3. Chi Tiết Prompt
```http
GET /api/prompts/{prompt_id}
Authorization: Bearer {access_token}
```

#### 4. Cập Nhật Prompt
```http
PUT /api/prompts/{prompt_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

#### 5. Xóa Prompt
```http
DELETE /api/prompts/{prompt_id}
Authorization: Bearer {access_token}
```

#### 6. Gửi Prompt Tới AI
```http
POST /api/prompts/{prompt_id}/send
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "model_override": "gemini-pro"  // Optional
}
```

**Response:**
```json
{
  "id": 1,
  "prompt_id": 1,
  "content": "Response from AI model...",
  "tokens_used": 256,
  "execution_time": 2.45,
  "status": "SUCCESS",
  "error_message": null,
  "created_at": "2026-04-22T10:05:00"
}
```

---

### Feedback Management

#### 1. Danh Sách Feedback
```http
GET /api/feedback/?response_id=1&skip=0&limit=20
Authorization: Bearer {access_token}
```

#### 2. Tạo Feedback
```http
POST /api/feedback/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "response_id": 1,
  "rating": 5,
  "comment": "Excellent response",
  "accuracy": 5,
  "relevance": 4,
  "is_helpful": true
}
```

**Response:**
```json
{
  "id": 1,
  "response_id": 1,
  "rating": 5,
  "comment": "Excellent response",
  "accuracy": 5,
  "relevance": 4,
  "is_helpful": true,
  "created_at": "2026-04-22T10:10:00"
}
```

#### 3. Chi Tiết Feedback
```http
GET /api/feedback/{feedback_id}
Authorization: Bearer {access_token}
```

#### 4. Cập Nhật Feedback
```http
PUT /api/feedback/{feedback_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Good response"
}
```

#### 5. Xóa Feedback
```http
DELETE /api/feedback/{feedback_id}
Authorization: Bearer {access_token}
```

#### 6. Thống Kê Feedback
```http
GET /api/feedback/{feedback_id}/stats
Authorization: Bearer {access_token}
```

---

### Analytics

#### 1. Thống Kê User
```http
GET /api/analytics/user?days=7
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_requests": 25,
  "success_rate": 96.0,
  "avg_execution_time": 2.3,
  "avg_feedback_rating": 4.5,
  "total_tokens_used": 5120,
  "date_range": "Last 7 days"
}
```

#### 2. Thống Kê Prompt
```http
GET /api/analytics/prompt/{prompt_id}
Authorization: Bearer {access_token}
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Prompts Table
```sql
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'GENERAL',
  model_name VARCHAR(100) DEFAULT 'gemini-pro',
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Responses Table
```sql
CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  execution_time FLOAT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'SUCCESS',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feedback Table
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  response_id INTEGER NOT NULL UNIQUE REFERENCES responses(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  accuracy INTEGER CHECK (accuracy >= 1 AND accuracy <= 5),
  relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5),
  is_helpful BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 Security Features

✅ **JWT Authentication** - Token-based with refresh mechanism  
✅ **Password Hashing** - Bcrypt for secure password storage  
✅ **CORS Protection** - Configured whitelisted origins  
✅ **Row-Level Access Control** - Users can only access their own data  
✅ **Input Validation** - Pydantic schemas validate all inputs  
✅ **SQL Injection Prevention** - SQLAlchemy ORM used  
✅ **Rate Limiting** - Can be added with middleware  
✅ **HTTPS** - Can be enforced in production  

---

## 🏗️ Project Structure

```
backend/
├── config.py                 # Configuration management
├── database.py              # Database connection & session
├── models.py                # SQLAlchemy models
├── schemas.py               # Pydantic validation schemas
├── security.py              # JWT & authentication
├── main.py                  # FastAPI application entry
├── ai_service.py            # AI model interaction service
├── feedback_service.py      # Feedback analysis service
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
└── routes/
    ├── auth.py              # Authentication endpoints
    ├── prompts.py           # Prompt management endpoints
    ├── feedback.py          # Feedback management endpoints
    └── analytics.py         # Analytics endpoints
```

---

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html
```

---

## 🚢 Deployment

### Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]
```

### Heroku / Railway
```bash
# Procfile is already configured
git push heroku main
```

---

## 📝 Best Practices

1. **Error Handling** - All endpoints return appropriate HTTP status codes
2. **Logging** - Implement comprehensive logging for debugging
3. **Pagination** - All list endpoints support skip/limit
4. **Validation** - All inputs validated using Pydantic
5. **Documentation** - API documented with OpenAPI/Swagger
6. **Performance** - Database queries optimized with indexes
7. **Security** - All sensitive data protected with encryption

---

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -d ai_feedback

# Or use SQLite for development
DATABASE_URL=sqlite:///./ai_feedback.db
```

### JWT Token Issues
```bash
# Regenerate SECRET_KEY in .env
# Ensure token is passed in Authorization header
Authorization: Bearer {token}
```

### AI API Errors
```bash
# Check GOOGLE_API_KEY is valid
# Check API rate limits
# Verify model name is correct
```

---

## 📞 Support

For issues and questions:
- Check logs: `tail -f logs/app.log`
- API docs: `http://localhost:8000/docs`
- Swagger UI: Interactive API testing

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-22  
**Maintainer:** Backend Team
