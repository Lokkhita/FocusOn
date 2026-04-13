# 🎯 FocusOn – AI Goal Mentor

A production-ready, full-stack SaaS platform powered by Claude AI.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│          React.js + Tailwind CSS (Dark/Light Mode)          │
│   Auth Pages | Dashboard | Goal Engine | Mentor Chat        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                      │
│              PHP Laravel + JWT Middleware                   │
│         Rate Limiting | CORS | Input Validation             │
└──────────┬────────────────────────┬────────────────────────┘
           │                        │
┌──────────▼──────────┐  ┌──────────▼──────────────────────┐
│   BUSINESS LOGIC    │  │        AI SERVICE LAYER          │
│  Laravel Services   │  │   Claude API (Anthropic)         │
│  Goal Analysis      │  │   Goal Clarification Engine      │
│  Path Generation    │  │   Mentor Chat System             │
│  Progress Tracking  │  │   Strategy Generator             │
└──────────┬──────────┘  └──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│                    MongoDB Atlas                            │
│   Users | Goals | Paths | Roadmaps | Progress | Sessions   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+

### Run everything (recommended)

From this `focuson` folder:

```bash
npm install
npm run install:all
npm run dev
```

This starts the **API on port 8000** and the **React app on port 3000**. The UI talks to `/api` through the dev proxy, so registration, login, goals, and mock AI flows work without CORS issues.

### Run API and frontend separately

```bash
# Terminal 1 — API
cd server && npm install && npm start

# Terminal 2 — React
cd frontend && npm install && npm start
```

Copy `frontend/.env.example` to `frontend/.env.local` if you do not have it yet. In development you normally **do not** set `REACT_APP_API_URL` so requests use the proxy.

### Optional: Laravel backend

The `backend/` folder holds reference Laravel/MongoDB code for a production deployment; it is not required for local development with `server/`.

## 📁 Folder Structure
See `docs/ARCHITECTURE.md` for full details.

## 🌗 Dark/Light Mode
- Defaults to system preference via `prefers-color-scheme`
- Toggle persists in localStorage + database
- Smooth CSS transitions on all components

## 🔐 Security
- JWT Authentication (15min access + 7day refresh tokens)
- XSS/CSRF protection via Laravel middleware
- Input sanitization on all endpoints
- Rate limiting: 60 req/min (auth), 20 req/min (AI endpoints)
