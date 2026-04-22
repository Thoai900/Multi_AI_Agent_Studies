# AI Feedback Management System - Architecture & Design

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vue)                    │
│                   (http://localhost:3000)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/HTTPS
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI Application Server              │
│                (http://localhost:8000)               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │         API Routers (Request Handler)       │   │
│  ├─────────────────────────────────────────────┤   │
│  │ • /api/auth          - Authentication       │   │
│  │ • /api/prompts       - Prompt Management    │   │
│  │ • /api/feedback      - Feedback Management  │   │
│  │ • /api/analytics     - Analytics & Stats    │   │
│  └─────────────────────────────────────────────┘   │
│                     │                                │
│                     ▼                                │
│  ┌─────────────────────────────────────────────┐   │
│  │        Business Logic (Services)            │   │
│  ├─────────────────────────────────────────────┤   │
│  │ • AIService         - AI Model Integration  │   │
│  │ • FeedbackService   - Analytics & Analysis  │   │
│  └─────────────────────────────────────────────┘   │
│                     │                                │
│                     ▼                                │
│  ┌─────────────────────────────────────────────┐   │
│  │    Security & Authentication Layer          │   │
│  ├─────────────────────────────────────────────┤   │
│  │ • JWT Token Generation/Verification         │   │
│  │ • Password Hashing (Bcrypt)                 │   │
│  │ • User Authorization                        │   │
│  └─────────────────────────────────────────────┘   │
│                     │                                │
│                     ▼                                │
│  ┌─────────────────────────────────────────────┐   │
│  │    Data Access Layer (SQLAlchemy ORM)       │   │
│  ├─────────────────────────────────────────────┤   │
│  │ • Models (User, Prompt, Response, Feedback) │   │
│  │ • Database Transactions                     │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ PostgreSQL  │   │   Google    │   │   External  │
│  Database   │   │ Gemini API  │   │   Services  │
│             │   │             │   │             │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## 🔄 Data Flow Diagram

### 1. User Registration & Authentication Flow

```
User
  │
  ├─ POST /api/auth/register
  │  {username, email, password}
  │
  ▼
┌─────────────────────┐
│ Validate Input      │
│ Check Duplicates    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Hash Password       │
│ Create User Record  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Generate JWT Tokens │
│ (Access + Refresh)  │
└────────┬────────────┘
         │
         ▼
   Response: Tokens
   ├─ access_token
   ├─ refresh_token
   └─ expires_in
```

### 2. Prompt Creation & AI Request Flow

```
Authenticated User
  │
  ├─ POST /api/prompts/
  │  {title, content, model_name, parameters}
  │
  ▼
┌──────────────────────┐
│ Validate Prompt      │
│ Data                 │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Store in Database    │
│ (Prompt Record)      │
└──────┬───────────────┘
       │
       ├─ POST /api/prompts/{id}/send
       │
       ▼
┌──────────────────────┐
│ Validate Content     │
│ Check Length         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐        ┌──────────────────┐
│ Send to AI Service   │───────▶│ Google Gemini API│
│ (AIService)          │        └──────────────────┘
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Store Response       │
│ in Database          │
│ (Response Record)    │
└──────┬───────────────┘
       │
       ▼
   Return Response Data
   ├─ id
   ├─ content
   ├─ execution_time
   └─ status
```

### 3. Feedback & Analytics Flow

```
Authenticated User
  │
  ├─ POST /api/feedback/
  │  {response_id, rating, accuracy, relevance}
  │
  ▼
┌──────────────────────┐
│ Validate Feedback    │
│ Check Response Exists│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Check Authorization  │
│ (User owns response) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Store Feedback       │
│ in Database          │
└──────┬───────────────┘
       │
       ├─ GET /api/analytics/user?days=7
       │
       ▼
┌──────────────────────┐
│ FeedbackService      │
│ Aggregate Stats      │
│ • avg_rating         │
│ • success_rate       │
│ • execution_time     │
└──────┬───────────────┘
       │
       ▼
   Return Analytics Data
```

---

## 📦 Component Architecture

### APIRouter Layer (routes/)
**Responsibility:** HTTP request handling, input validation, response formatting

```
auth.py
├── POST /register      → UserCreate schema → User creation
├── POST /login         → UserLogin schema → Token generation
├── POST /refresh       → Refresh token handling
└── GET /me            → User info retrieval

prompts.py
├── GET /               → List user prompts with filters
├── POST /              → Create new prompt
├── GET /{id}          → Get prompt details
├── PUT /{id}          → Update prompt
├── DELETE /{id}       → Delete prompt
└── POST /{id}/send    → Send to AI & save response

feedback.py
├── GET /               → List user feedback
├── POST /              → Create feedback
├── GET /{id}          → Get feedback details
├── PUT /{id}          → Update feedback
├── DELETE /{id}       → Delete feedback
└── GET /{id}/stats    → Get feedback analytics

analytics.py
├── GET /user          → User statistics
└── GET /prompt/{id}   → Prompt statistics
```

### Service Layer (services/)
**Responsibility:** Business logic, external API integration, data processing

```
AIService
├── send_prompt()       → Send to AI model, handle response
└── validate_prompt()   → Content validation

FeedbackService
├── analyze_feedback()  → Calculate feedback metrics
├── get_prompt_statistics()  → Aggregate prompt stats
└── get_user_statistics()    → Aggregate user stats
```

### Data Layer (models.py)
**Responsibility:** Database schema definition, relationships

```
User
├── id (Primary Key)
├── username (Unique)
├── email (Unique)
├── hashed_password
├── is_active
├── created_at
├── updated_at
├── Relationships: prompts[], feedbacks[]

Prompt
├── id (Primary Key)
├── user_id (Foreign Key)
├── title
├── content
├── description
├── category
├── model_name
├── parameters (JSON)
├── created_at
├── updated_at
├── Relationships: user, responses[]

Response
├── id (Primary Key)
├── prompt_id (Foreign Key)
├── content
├── tokens_used
├── execution_time
├── status
├── error_message
├── created_at
├── Relationships: prompt, feedback

Feedback
├── id (Primary Key)
├── response_id (Foreign Key, Unique)
├── user_id (Foreign Key)
├── rating (1-5)
├── comment
├── accuracy (1-5)
├── relevance (1-5)
├── is_helpful
├── created_at
├── updated_at
├── Relationships: response, user
```

### Validation Layer (schemas.py)
**Responsibility:** Request/response data validation using Pydantic

---

## 🔐 Authentication & Security Flow

```
┌────────────────────────────────┐
│ User Sends Request              │
│ {endpoint, data, headers}       │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ CORS Middleware                │
│ Validate Origin                │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ Extract JWT Token              │
│ From Authorization Header      │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ Verify Token                   │
│ • Check Signature              │
│ • Check Expiration             │
│ • Extract user_id              │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ Get User from Database         │
│ • Check is_active              │
│ • Validate existence           │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ Request Processing             │
│ (User-specific data access)    │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ Return Response                │
└────────────────────────────────┘
```

---

## 🔄 Error Handling Strategy

```
Request Processing
    │
    ├─ Input Validation Error
    │  └─ 400 Bad Request
    │     {error: "Invalid input", detail: "..."}
    │
    ├─ Authentication Error
    │  ├─ Missing Token → 401 Unauthorized
    │  ├─ Invalid Token → 401 Unauthorized
    │  └─ Expired Token → 401 Unauthorized
    │
    ├─ Authorization Error
    │  └─ 403 Forbidden
    │     {error: "Not authorized"}
    │
    ├─ Resource Not Found
    │  └─ 404 Not Found
    │     {error: "Resource not found"}
    │
    ├─ Business Logic Error
    │  ├─ Duplicate Email → 400 Bad Request
    │  ├─ AI Service Error → 503 Service Unavailable
    │  └─ Database Error → 500 Internal Server Error
    │
    └─ Unhandled Exception
       └─ 500 Internal Server Error
          {error: "Internal server error"}
```

---

## 📊 Database Relationships

```
Users (1) ──────────── (Many) Prompts
  │                       │
  │                       └─── (Many) Responses
  │                                    └─── (One) Feedback ───── (Many) Users
  │
  └─────────────────────────────────────────────────────────────┘
         (Users Can Have Many Feedbacks)
```

---

## 🔧 Configuration Management

```
config.py
├── DATABASE_URL          → PostgreSQL connection
├── SECRET_KEY            → JWT signing key
├── ALGORITHM             → JWT algorithm (HS256)
├── ACCESS_TOKEN_EXPIRE   → Token lifetime (60 min)
├── AI_API_KEY            → Google Gemini API key
├── AI_MODEL_NAME         → Default model (gemini-pro)
├── FRONTEND_URL          → Frontend origin
├── DEBUG                 → Debug mode flag
└── LOG_LEVEL             → Logging level

Environment variables (.env)
├── Development: DEBUG=True, DATABASE_URL=sqlite:///
├── Production: DEBUG=False, DATABASE_URL=postgresql://
└── CI/CD: Override via environment
```

---

## 🚀 Performance Optimizations

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_prompts_user_id ON prompts(user_id);
   CREATE INDEX idx_responses_prompt_id ON responses(prompt_id);
   CREATE INDEX idx_feedback_response_id ON feedback(response_id);
   CREATE INDEX idx_feedback_user_id ON feedback(user_id);
   ```

2. **Query Optimization**
   - Use relationships for joins
   - Implement pagination (skip/limit)
   - Add query filters efficiently

3. **Caching Strategies**
   - Cache user authentication tokens
   - Cache analytics results
   - Implement Redis for session management

4. **Connection Pooling**
   - SQLAlchemy with psycopg2
   - Pool size: 20, max overflow: 40

---

## 📋 API Rate Limiting (Future Enhancement)

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.util import get_redis

# 100 requests per minute per IP
@limiter.limit("100/minute")
async def list_prompts(...):
    pass
```

---

## 🧪 Testing Strategy

```
tests/
├── test_auth.py         → Authentication endpoints
├── test_prompts.py      → Prompt CRUD operations
├── test_feedback.py     → Feedback management
├── test_analytics.py    → Analytics endpoints
├── test_security.py     → Security & authorization
└── test_ai_service.py   → AI service integration
```

---

## 📈 Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API design
   - Load balancer (nginx, HAProxy)
   - Multiple FastAPI instances

2. **Database Scaling**
   - Read replicas for analytics
   - Partitioning for large tables
   - Connection pooling optimization

3. **Caching Layer**
   - Redis for session storage
   - Memcached for hot data
   - API response caching

4. **Message Queue**
   - Celery for async tasks
   - RabbitMQ/Redis as broker
   - Background job processing

---

**Architecture Version:** 1.0.0  
**Last Updated:** 2026-04-22  
**Documentation:** Complete
