"""Quick Start Guide - AI Feedback Management System"""

# ============================================================================
# QUICK START GUIDE - AI Feedback Management System Backend
# ============================================================================

## 1️⃣  INSTALLATION & SETUP (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Setup Environment
Create `.env` file in backend directory:
```env
# Database
DATABASE_URL=sqlite:///./ai_feedback.db

# For PostgreSQL:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_feedback

# JWT Configuration
SECRET_KEY=your-super-secret-key-dev-only
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI Service
GOOGLE_API_KEY=your-google-api-key-here
AI_MODEL_NAME=gemini-pro

# Server
DEBUG=True
PORT=8000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start Server
```bash
python main.py
```

Server will run at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

---

## 2️⃣  TEST API ENDPOINTS (Using curl or Postman)

### A. Register New User
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### B. Create a Prompt
```bash
# Save access_token from registration
ACCESS_TOKEN="your-access-token-here"

curl -X POST "http://localhost:8000/api/prompts/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Tutorial",
    "content": "Explain how to create a Python function",
    "description": "Learn about Python functions",
    "category": "TECHNICAL",
    "model_name": "gemini-pro",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 1024
    }
  }'
```

**Response:**
```json
{
  "id": 1,
  "title": "Python Tutorial",
  "content": "Explain how to create a Python function",
  "description": "Learn about Python functions",
  "category": "TECHNICAL",
  "model_name": "gemini-pro",
  "parameters": {"temperature": 0.7, "max_tokens": 1024},
  "created_at": "2026-04-22T10:00:00",
  "updated_at": "2026-04-22T10:00:00"
}
```

### C. Send Prompt to AI
```bash
curl -X POST "http://localhost:8000/api/prompts/1/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_override": "gemini-pro"
  }'
```

**Response:**
```json
{
  "id": 1,
  "prompt_id": 1,
  "content": "Here's how to create a Python function:\n\n...",
  "tokens_used": null,
  "execution_time": 2.45,
  "status": "SUCCESS",
  "error_message": null,
  "created_at": "2026-04-22T10:05:00"
}
```

### D. Create Feedback
```bash
curl -X POST "http://localhost:8000/api/feedback/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "response_id": 1,
    "rating": 5,
    "comment": "Excellent and clear explanation!",
    "accuracy": 5,
    "relevance": 5,
    "is_helpful": true
  }'
```

### E. Get User Statistics
```bash
curl -X GET "http://localhost:8000/api/analytics/user?days=7" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 3️⃣  PROJECT STRUCTURE

```
backend/
├── config.py                  # App configuration
├── database.py               # Database setup
├── models.py                 # SQLAlchemy models
├── schemas.py                # Pydantic validation
├── security.py               # JWT & authentication
├── main.py                   # FastAPI app entry
├── ai_service.py             # AI integration
├── feedback_service.py       # Feedback analytics
├── requirements.txt          # Dependencies
├── .env.example              # Environment template
├── README.md                 # Full documentation
├── ARCHITECTURE.md           # System design
└── routes/
    ├── __init__.py
    ├── auth.py               # Auth endpoints
    ├── prompts.py            # Prompt endpoints
    ├── feedback.py           # Feedback endpoints
    └── analytics.py          # Analytics endpoints
```

---

## 4️⃣  KEY FEATURES

✅ **User Authentication**
- JWT-based with refresh tokens
- Bcrypt password hashing
- 60-minute access token expiration

✅ **Prompt Management**
- Create, read, update, delete prompts
- Store prompt parameters for AI models
- Category-based organization

✅ **AI Integration**
- Send prompts to Google Gemini API
- Track execution time and token usage
- Error handling and logging

✅ **Feedback System**
- Rate responses (1-5 stars)
- Evaluate accuracy and relevance
- Leave detailed comments

✅ **Analytics**
- User statistics (success rate, execution time)
- Prompt-level analytics
- Feedback aggregation

---

## 5️⃣  DATABASE COMMANDS

### Using SQLite (Development)
```bash
# Explore database
sqlite3 ai_feedback.db

# View tables
.tables

# View schema
.schema

# Exit
.quit
```

### Using PostgreSQL (Production)
```bash
# Connect to database
psql -U postgres -d ai_feedback

# List tables
\dt

# View table structure
\d prompts

# Exit
\q
```

---

## 6️⃣  TROUBLESHOOTING

### Issue: "Module not found" error
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Database connection error
```bash
# For SQLite: Check file exists in current directory
ls ai_feedback.db

# For PostgreSQL: Verify connection string
echo $DATABASE_URL

# Recreate database
# Edit database.py and set echo=True to see SQL queries
```

### Issue: AI API error
```bash
# Check API key is set
echo $GOOGLE_API_KEY

# Verify API key is valid
# Go to: https://aistudio.google.com/apikey
```

### Issue: Token expired
```bash
# Get new token using refresh endpoint
curl -X POST "http://localhost:8000/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-refresh-token"}'
```

---

## 7️⃣  COMMON API ERRORS

| Status Code | Meaning | Solution |
|---|---|---|
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Add valid Authorization header |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Verify resource exists |
| 500 | Server Error | Check server logs |
| 503 | Service Unavailable | AI service down, try later |

---

## 8️⃣  ENVIRONMENT VARIABLES EXPLAINED

```env
# Database connection string
DATABASE_URL=postgresql://user:password@host:port/database

# JWT secret key (generate a random string)
SECRET_KEY=your-random-string-min-32-chars

# Encryption algorithm (always HS256)
ALGORITHM=HS256

# Token expiration (in minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google Gemini API key
GOOGLE_API_KEY=your-api-key-from-https://aistudio.google.com

# AI model to use
AI_MODEL_NAME=gemini-pro

# Debug mode (True for development)
DEBUG=True

# Server port
PORT=8000

# Server host
HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

## 9️⃣  NEXT STEPS

1. **Integrate with Frontend**
   - Connect React/Vue app to API
   - Update CORS_ALLOWED_ORIGINS in config

2. **Deploy to Production**
   - Use PostgreSQL instead of SQLite
   - Set DEBUG=False
   - Generate strong SECRET_KEY
   - Use environment secrets management

3. **Add Features**
   - Rate limiting
   - Caching with Redis
   - Background tasks with Celery
   - File uploads
   - Real-time WebSocket updates

4. **Monitor & Maintain**
   - Setup logging
   - Monitor API performance
   - Track error rates
   - Regular backups

---

## 🔟 USEFUL RESOURCES

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org
- **JWT Guide:** https://pyjwt.readthedocs.io
- **Pydantic Docs:** https://docs.pydantic.dev
- **PostgreSQL Docs:** https://www.postgresql.org/docs

---

**Happy Coding! 🚀**

For detailed documentation, see README.md and ARCHITECTURE.md
