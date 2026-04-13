# FocusOn – Architecture & Database Design

## MongoDB Collections & Schema

### 1. users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique, indexed)",
  "password": "string (bcrypt hashed)",
  "avatar": "string (URL)",
  "role": "enum: user | admin",
  "theme_preference": "enum: light | dark | system",
  "profile": {
    "bio": "string",
    "current_role": "string",
    "skills": ["string"],
    "location": "string",
    "timezone": "string"
  },
  "onboarding_completed": "boolean",
  "email_verified_at": "datetime | null",
  "last_login": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2. goals
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "title": "string",
  "description": "string",
  "category": "enum: career | education | health | finance | personal | startup",
  "status": "enum: defining | analyzing | active | paused | completed | abandoned",
  "clarity_score": "number (0-100)",
  "ai_clarifications": [
    {
      "question": "string",
      "answer": "string",
      "asked_at": "datetime"
    }
  ],
  "situation_analysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "challenges": ["string"],
    "ai_summary": "string"
  },
  "target_date": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 3. strategic_paths
```json
{
  "_id": "ObjectId",
  "goal_id": "ObjectId (ref: goals)",
  "user_id": "ObjectId (ref: users)",
  "paths": [
    {
      "path_id": "string (uuid)",
      "title": "string",
      "description": "string",
      "approach": "enum: aggressive | balanced | conservative",
      "estimated_duration": "string",
      "difficulty": "enum: beginner | intermediate | advanced",
      "market_demand": "number (1-10)",
      "success_probability": "number (0-100)",
      "pros": ["string"],
      "cons": ["string"],
      "required_resources": ["string"]
    }
  ],
  "chosen_path_id": "string | null",
  "chosen_at": "datetime | null",
  "created_at": "datetime"
}
```

### 4. roadmaps
```json
{
  "_id": "ObjectId",
  "goal_id": "ObjectId (ref: goals)",
  "path_id": "string",
  "user_id": "ObjectId (ref: users)",
  "phases": [
    {
      "phase_number": "number",
      "title": "string",
      "duration": "string",
      "milestones": [
        {
          "milestone_id": "string (uuid)",
          "title": "string",
          "description": "string",
          "type": "enum: task | learning | project | checkpoint",
          "resources": [
            {
              "title": "string",
              "url": "string",
              "type": "enum: course | article | video | tool | book",
              "is_free": "boolean",
              "platform": "string"
            }
          ],
          "status": "enum: pending | in_progress | completed | skipped",
          "due_date": "datetime",
          "completed_at": "datetime | null"
        }
      ]
    }
  ],
  "overall_progress": "number (0-100)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 5. mentor_sessions
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "goal_id": "ObjectId (ref: goals) | null",
  "messages": [
    {
      "role": "enum: user | assistant",
      "content": "string",
      "timestamp": "datetime",
      "tokens_used": "number"
    }
  ],
  "session_type": "enum: goal_clarification | situation_analysis | path_selection | general",
  "total_tokens": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 6. progress_logs
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "goal_id": "ObjectId (ref: goals)",
  "milestone_id": "string",
  "action": "enum: started | completed | skipped | note_added",
  "note": "string | null",
  "mood": "enum: motivated | neutral | struggling | stuck",
  "ai_feedback": "string | null",
  "logged_at": "datetime"
}
```

## MongoDB Indexes
```javascript
// Performance-critical indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.goals.createIndex({ user_id: 1, status: 1 })
db.roadmaps.createIndex({ user_id: 1, goal_id: 1 })
db.mentor_sessions.createIndex({ user_id: 1, created_at: -1 })
db.progress_logs.createIndex({ user_id: 1, goal_id: 1, logged_at: -1 })
```

## API Endpoint Design

### Auth Routes
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
PUT    /api/auth/profile
```

### Goal Routes
```
GET    /api/goals              — List user's goals
POST   /api/goals              — Create new goal
GET    /api/goals/:id          — Get goal detail
PUT    /api/goals/:id          — Update goal
DELETE /api/goals/:id          — Delete goal
```

### AI Routes
```
POST   /api/ai/clarify         — Generate clarifying questions
POST   /api/ai/analyze         — Analyze current situation
POST   /api/ai/paths           — Generate strategic paths
POST   /api/ai/roadmap         — Generate roadmap for chosen path
POST   /api/ai/mentor/chat     — AI mentor conversation
POST   /api/ai/progress/feedback — Get AI feedback on progress
```

### Progress Routes
```
GET    /api/progress/:goal_id
POST   /api/progress/log
PUT    /api/roadmaps/:id/milestones/:mid
```
