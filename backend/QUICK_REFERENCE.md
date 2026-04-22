# 🚀 QUICK REFERENCE CARD

## Starting the Server

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup environment
cp .env.example .env

# 3. Start server
python main.py
```

**Access at:** `http://localhost:8000`

---

## API Examples with cURL

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"user1",
    "email":"user@example.com",
    "password":"Password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"Password123"
  }'
```

Copy the `access_token` from response.

### 3. Create Prompt
```bash
TOKEN="your-access-token"
curl -X POST http://localhost:8000/api/prompts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Python Guide",
    "content":"Explain Python",
    "category":"TECHNICAL",
    "model_name":"gemini-pro"
  }'
```

### 4. Send to AI
```bash
curl -X POST http://localhost:8000/api/prompts/1/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_override":"gemini-pro"
  }'
```

### 5. Create Feedback
```bash
curl -X POST http://localhost:8000/api/feedback/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "response_id":1,
    "rating":5,
    "comment":"Excellent!",
    "is_helpful":true
  }'
```

### 6. Get Analytics
```bash
curl -X GET "http://localhost:8000/api/analytics/user?days=7" \
  -H "Authorization: Bearer $TOKEN"
```

---

## File Structure

```
backend/
├── main.py                  # Start here
├── config.py               # Configuration
├── database.py             # Database setup
├── models.py               # Data models
├── schemas.py              # Validation
├── security.py             # Auth
├── ai_service.py           # AI integration
├── feedback_service.py     # Analytics
├── routes/
│   ├── auth.py             # Login/register
│   ├── prompts.py          # Prompt CRUD
│   ├── feedback.py         # Feedback CRUD
│   └── analytics.py        # Statistics
├── test_api.py             # Tests (45+)
├── requirements.txt        # Dependencies
├── .env.example            # Environment
└── README.md               # Documentation
```

---

## Environment Setup

```env
# Database
DATABASE_URL=sqlite:///./ai_feedback.db
# Or PostgreSQL:
# DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# AI Service
GOOGLE_API_KEY=your-api-key-here
AI_MODEL_NAME=gemini-pro

# Server
DEBUG=True
PORT=8000
FRONTEND_URL=http://localhost:3000
```

---

## Common Tasks

### Run Tests
```bash
pytest test_api.py -v
```

### Run with Auto-reload (Development)
```bash
uvicorn main:app --reload
```

### Run Production Server
```bash
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### View API Documentation
```
http://localhost:8000/docs          # Swagger UI
http://localhost:8000/redoc         # ReDoc
```

---

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Auth** | | |
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/auth/me | Get user |
| **Prompts** | | |
| GET | /api/prompts/ | List |
| POST | /api/prompts/ | Create |
| GET | /api/prompts/{id} | Get |
| PUT | /api/prompts/{id} | Update |
| DELETE | /api/prompts/{id} | Delete |
| POST | /api/prompts/{id}/send | Send to AI |
| **Feedback** | | |
| GET | /api/feedback/ | List |
| POST | /api/feedback/ | Create |
| GET | /api/feedback/{id} | Get |
| PUT | /api/feedback/{id} | Update |
| DELETE | /api/feedback/{id} | Delete |
| **Analytics** | | |
| GET | /api/analytics/user | User stats |
| GET | /api/analytics/prompt/{id} | Prompt stats |

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (deleted) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Troubleshooting

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "Database connection error"
```bash
# Check PostgreSQL running, or use SQLite:
DATABASE_URL=sqlite:///./ai_feedback.db
```

### "Invalid token"
```bash
# Use correct token in Authorization header:
Authorization: Bearer {token}
```

### "CORS error"
```bash
# Update FRONTEND_URL in .env:
FRONTEND_URL=http://your-frontend:3000
```

---

## Documentation Quick Links

| Document | Purpose |
|----------|---------|
| README.md | Full API docs |
| ARCHITECTURE.md | System design |
| QUICKSTART.md | Setup guide |
| FEATURES.md | Feature list |
| IMPLEMENTATION.md | Project overview |
| DEPLOYMENT.md | Deploy instructions |

---

## Key Concepts

### JWT Token Structure
```
Header.Payload.Signature
```

### Access Token Lifetime
- Default: 60 minutes
- Set via: `ACCESS_TOKEN_EXPIRE_MINUTES`

### Refresh Token Lifetime
- Default: 7 days
- Set via: `REFRESH_TOKEN_EXPIRE_DAYS`

### Database Models
- **User** - Authentication
- **Prompt** - User prompts
- **Response** - AI responses
- **Feedback** - User ratings

---

## Performance Tips

1. **Use PostgreSQL for production**
   ```env
   DATABASE_URL=postgresql://...
   ```

2. **Enable connection pooling**
   - Already configured in database.py

3. **Add caching**
   - Use Redis for session storage

4. **Monitor performance**
   - Check execution_time in responses

---

## Security Checklist

- [x] Change SECRET_KEY for production
- [x] Use strong GOOGLE_API_KEY
- [x] Use PostgreSQL (not SQLite) for production
- [x] Set DEBUG=False for production
- [x] Configure CORS_ALLOWED_ORIGINS
- [x] Use HTTPS in production
- [x] Regularly update dependencies

---

## Deployment Platforms

### Heroku
```bash
git push heroku main
```
(Procfile already configured)

### Railway
```bash
railway up
```
(railway.json already configured)

### Docker
```bash
docker build -t ai-feedback .
docker run -p 8000:8000 ai-feedback
```

---

## Testing

### Run All Tests
```bash
pytest test_api.py -v
```

### Run Specific Test
```bash
pytest test_api.py::TestAuthentication -v
```

### With Coverage
```bash
pytest test_api.py --cov=. --cov-report=html
```

---

## Contact & Support

For issues:
1. Check documentation files
2. Review error message
3. Check logs
4. Verify .env configuration
5. Run tests to verify setup

---

**Version:** 1.0.0  
**Status:** ✅ Ready to Use  
**Last Updated:** 2026-04-22  

🚀 Happy Coding!
