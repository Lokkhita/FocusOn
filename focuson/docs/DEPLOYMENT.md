# 🚀 FocusOn – Full Deployment & Setup Guide

## 📋 Prerequisites

| Tool       | Version   | Install |
|------------|-----------|---------|
| Node.js    | 18+       | https://nodejs.org |
| PHP        | 8.1+      | https://php.net |
| Composer   | 2.x       | https://getcomposer.org |
| MongoDB    | 6+        | https://www.mongodb.com/try/download/community |
| Git        | any       | https://git-scm.com |

---

## 🖥️ LOCAL DEVELOPMENT SETUP

### Step 1 — Clone & Open in VS Code
```bash
git clone https://github.com/YOUR_USERNAME/focuson.git
cd focuson
code .
```

### Step 2 — Start MongoDB (local)
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/WSL
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) — no local install needed
# Set MONGODB_URI in backend/.env
```

### Step 3 — Backend Setup
```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret
```

Now open `backend/.env` and fill in:
```env
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE   # from console.anthropic.com
DB_HOST=127.0.0.1
DB_PORT=27017
DB_DATABASE=focuson_db
FRONTEND_URL=http://localhost:3000
```

```bash
# Start Laravel dev server
php artisan serve
# → Runs at http://localhost:8000
```

### Step 4 — Frontend Setup
```bash
cd ../frontend

# Install Node dependencies
npm install

# Copy env file
cp .env.example .env.local

# .env.local already has:
# REACT_APP_API_URL=http://localhost:8000/api

# Start React dev server
npm start
# → Runs at http://localhost:3000
```

### ✅ You should now have:
- React app: http://localhost:3000
- Laravel API: http://localhost:8000/api
- API health check: http://localhost:8000/api/health

---

## 🗄️ MongoDB Setup

### Option A — Local MongoDB
MongoDB runs automatically once started. The `focuson_db` database and all collections are created automatically when the app first writes data (MongoDB creates on first insert — no migration needed).

### Option B — MongoDB Atlas (Recommended for Production)
1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your IP (or 0.0.0.0/0 for dev)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/focuson_db
   ```
6. Set in `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/focuson_db
   ```

### Create MongoDB Indexes (run once)
```javascript
// Connect to MongoDB shell:
// mongosh focuson_db
// Then run:

db.users.createIndex({ email: 1 }, { unique: true })
db.goals.createIndex({ user_id: 1, status: 1 })
db.goals.createIndex({ user_id: 1, created_at: -1 })
db.roadmaps.createIndex({ user_id: 1, goal_id: 1 })
db.mentor_sessions.createIndex({ user_id: 1, created_at: -1 })
db.progress_logs.createIndex({ user_id: 1, goal_id: 1, logged_at: -1 })
```

---

## 🔑 Getting Your Claude API Key

1. Visit https://console.anthropic.com
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy and add to `backend/.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

---

## 📁 VS Code Workspace Tips

Install recommended extensions:
- **PHP Intelephense** — PHP intellisense
- **Tailwind CSS IntelliSense** — Tailwind autocomplete
- **ES7+ React Snippets** — React shortcuts
- **MongoDB for VS Code** — DB browser
- **Thunder Client** — API testing (like Postman)

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [["clsx\\(([^)]*)\\)", "\"([^\"]*)\""]]
}
```

Run both servers simultaneously with VS Code's terminal split:
```
Terminal 1: cd backend && php artisan serve
Terminal 2: cd frontend && npm start
```

---

## 🌐 PRODUCTION DEPLOYMENT

### Frontend → Vercel (Free)
```bash
cd frontend
npm run build

# Install Vercel CLI
npm i -g vercel
vercel

# Set environment variable in Vercel dashboard:
# REACT_APP_API_URL = https://your-api.com/api
```

### Backend → Railway / Render / DigitalOcean
```bash
# On your server:
git clone https://github.com/YOUR_USERNAME/focuson.git
cd focuson/backend

composer install --no-dev --optimize-autoloader
cp .env.example .env
# Fill in production .env values

php artisan key:generate
php artisan jwt:secret
php artisan config:cache
php artisan route:cache

# Serve with PHP-FPM + Nginx (recommended)
# Or use: php artisan serve --host=0.0.0.0 --port=8000
```

### Nginx Config (production)
```nginx
server {
    listen 80;
    server_name api.focuson.ai;
    root /var/www/focuson/backend/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

---

## 🔒 Security Checklist (Before Going Live)

- [ ] `APP_DEBUG=false` in production `.env`
- [ ] `APP_ENV=production`
- [ ] HTTPS enforced (SSL certificate via Let's Encrypt)
- [ ] `FRONTEND_URL` set to exact production domain
- [ ] Strong `JWT_SECRET` (min 64 chars, random)
- [ ] MongoDB Atlas IP whitelist (not 0.0.0.0/0)
- [ ] Rate limiting verified (20 req/min for AI endpoints)
- [ ] API key rotation plan documented
- [ ] Error logs monitored (Laravel Telescope or Sentry)

---

## 📈 SCALABILITY GUIDE

### When you reach 1,000+ users:

1. **Add Redis for caching**
   ```env
   CACHE_DRIVER=redis
   SESSION_DRIVER=redis
   QUEUE_CONNECTION=redis
   ```
   Cache AI responses for identical prompts (saves API costs).

2. **Queue AI requests**
   Move Claude API calls to background jobs:
   ```php
   // dispatch(new GenerateRoadmapJob($goal))->onQueue('ai');
   ```

3. **Horizontal scaling**
   - Deploy multiple Laravel instances behind a load balancer
   - Use sticky sessions or Redis session store
   - MongoDB Atlas auto-scales

4. **AI cost optimization**
   - Cache roadmaps (they rarely change)
   - Limit mentor chat context to last 10 messages
   - Use `claude-haiku` for simple completions (clarifying questions)
   - Use `claude-sonnet` for roadmap/path generation

5. **CDN for frontend**
   - Deploy React build to Cloudflare Pages or Vercel
   - Enable Vercel Edge Functions for API proxying

---

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:8000/api/health

# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Nadia","email":"nadia@test.com","password":"Test1234!","password_confirmation":"Test1234!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nadia@test.com","password":"Test1234!"}'
  
# Use the returned access_token in subsequent requests:
# -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `php artisan jwt:secret` fails | Run `composer require tymon/jwt-auth` first |
| MongoDB connection refused | Start MongoDB: `sudo systemctl start mongod` |
| CORS errors in browser | Check `FRONTEND_URL` in backend `.env` matches exactly |
| Claude API 401 | Check `ANTHROPIC_API_KEY` in backend `.env` |
| React blank screen | Check browser console; ensure `REACT_APP_API_URL` is set |
| `composer install` fails | Ensure PHP 8.1+ and required extensions: `php-mongodb php-curl php-mbstring` |

---

## 📂 Project Structure Summary

```
focuson/
├── frontend/                    # React + Tailwind
│   ├── public/index.html        # Anti-flash theme script
│   ├── src/
│   │   ├── App.jsx              # Router + providers
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx  # Dark/light mode
│   │   │   └── AuthContext.jsx   # JWT session
│   │   ├── components/
│   │   │   ├── ui/Navbar.jsx
│   │   │   ├── ui/ThemeToggle.jsx
│   │   │   └── goals/GoalWizard.jsx  # 5-step AI wizard
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── GoalDetailPage.jsx
│   │   │   ├── MentorPage.jsx
│   │   │   ├── ProgressPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── utils/api.js          # Axios + interceptors
│   │   └── styles/index.css      # Tailwind + custom classes
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # Laravel 10 + MongoDB
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── GoalController.php
│   │   │   ├── AIController.php
│   │   │   └── ProgressController.php
│   │   ├── Http/Middleware/
│   │   │   └── JwtMiddleware.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Goal.php
│   │   │   ├── Roadmap.php
│   │   │   └── Models.php
│   │   └── Services/
│   │       ├── ClaudeService.php   # Anthropic API wrapper
│   │       └── PromptService.php   # All AI prompts
│   ├── routes/api.php
│   ├── config/services.php
│   └── .env.example
│
└── docs/
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```
