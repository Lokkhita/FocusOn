/**
 * FocusOn development API — Express + in-memory store + mock AI responses.
 * Run: npm start (port 8000). Use with CRA proxy from the frontend (/api).
 */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 8000;
const JWT_SECRET = process.env.JWT_SECRET || "focuson-dev-only-change-me";
const ACCESS_TTL_SEC = 15 * 60;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const usersById = new Map();
const usersByEmail = new Map();
const goalsByUser = new Map();

function randomId() {
  return crypto.randomBytes(12).toString("hex");
}

function formatUser(u) {
  return {
    _id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    theme_preference: u.theme_preference || "system",
    profile: u.profile || {},
    onboarding_completed: u.onboarding_completed ?? false,
    last_login: u.last_login || null,
    created_at: u.created_at,
  };
}

function userGoalMap(userId) {
  if (!goalsByUser.has(userId)) goalsByUser.set(userId, new Map());
  return goalsByUser.get(userId);
}

function getGoal(userId, goalId) {
  return userGoalMap(userId).get(goalId);
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = h.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "access") return res.status(401).json({ message: "Unauthorized" });
    const user = usersById.get(payload.sub);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.userId = payload.sub;
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function issueTokens(res, user, status = 200) {
  const accessToken = jwt.sign({ sub: user.id, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TTL_SEC,
  });
  const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(status).json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TTL_SEC,
    user: formatUser(user),
  });
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FocusOn API",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, password_confirmation } = req.body;
  const errors = {};
  if (!name || String(name).trim().length < 2) {
    errors.name = ["Name must be at least 2 characters"];
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    errors.email = ["Enter a valid email"];
  }
  if (!password || String(password).length < 8) {
    errors.password = ["Password must be at least 8 characters"];
  }
  if (password !== password_confirmation) {
    errors.password_confirmation = ["The password confirmation does not match."];
  }
  if (Object.keys(errors).length) {
    return res.status(422).json({ message: "Validation failed", errors });
  }
  const em = String(email).toLowerCase().trim();
  if (usersByEmail.has(em)) {
    return res.status(422).json({
      message: "Validation failed",
      errors: { email: ["An account with this email already exists."] },
    });
  }
  const id = randomId();
  const hash = await bcrypt.hash(String(password), 12);
  const user = {
    id,
    name: String(name).trim().replace(/<[^>]*>/g, ""),
    email: em,
    password: hash,
    role: "user",
    theme_preference: "system",
    profile: {},
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    last_login: null,
  };
  usersById.set(id, user);
  usersByEmail.set(em, id);
  issueTokens(res, user, 201);
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ message: "Invalid credentials" });
  }
  const em = String(email).toLowerCase().trim();
  const id = usersByEmail.get(em);
  if (!id) return res.status(401).json({ message: "Invalid credentials" });
  const user = usersById.get(id);
  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  user.last_login = new Date().toISOString();
  issueTokens(res, user, 200);
});

app.post("/api/auth/refresh", (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "refresh") throw new Error("bad");
    const user = usersById.get(payload.sub);
    if (!user) return res.status(401).json({ message: "User not found" });
    const accessToken = jwt.sign({ sub: user.id, type: "access" }, JWT_SECRET, {
      expiresIn: ACCESS_TTL_SEC,
    });
    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TTL_SEC,
      user: formatUser(user),
    });
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

app.post("/api/auth/logout", authMiddleware, (req, res) => {
  res.clearCookie("refresh_token", { path: "/" });
  res.json({ message: "Logged out successfully" });
});

app.put("/api/auth/profile", authMiddleware, (req, res) => {
  const user = req.user;
  const { name, theme_preference, profile } = req.body;
  if (name !== undefined) user.name = String(name).trim().replace(/<[^>]*>/g, "");
  if (theme_preference !== undefined && ["light", "dark", "system"].includes(theme_preference)) {
    user.theme_preference = theme_preference;
  }
  if (profile !== undefined) user.profile = { ...user.profile, ...profile };
  res.json({ message: "Profile updated", user: formatUser(user) });
});

app.get("/api/goals", authMiddleware, (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
  const status = req.query.status;
  let list = [...userGoalMap(req.userId).values()];
  if (status) list = list.filter((g) => g.status === status);
  list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  if (limit && !Number.isNaN(limit)) list = list.slice(0, limit);
  res.json({ data: list });
});

app.post("/api/goals", authMiddleware, (req, res) => {
  const { title, category, description, timeframe } = req.body;
  if (!title || !category) {
    return res.status(422).json({
      message: "Validation failed",
      errors: {
        ...(title ? {} : { title: ["Title is required"] }),
        ...(category ? {} : { category: ["Category is required"] }),
      },
    });
  }
  const id = randomId();
  const goal = {
    _id: id,
    user_id: req.userId,
    title: String(title).trim(),
    category: String(category),
    description: description != null ? String(description) : "",
    timeframe: timeframe != null ? String(timeframe) : "",
    status: "defining",
    progress: 0,
    answers: null,
    selected_path_id: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  userGoalMap(req.userId).set(id, goal);
  res.status(201).json(goal);
});

app.get("/api/goals/:id", authMiddleware, (req, res) => {
  const g = getGoal(req.userId, req.params.id);
  if (!g) return res.status(404).json({ message: "Not found" });
  res.json({ ...g });
});

app.post("/api/goals/:id/activate", authMiddleware, (req, res) => {
  const g = getGoal(req.userId, req.params.id);
  if (!g) return res.status(404).json({ message: "Not found" });
  g.status = "active";
  g.progress = g.roadmap ? g.roadmap.overall_progress ?? 10 : 10;
  g.updated_at = new Date().toISOString();
  res.json({ message: "Activated", goal: g });
});

app.get("/api/dashboard/stats", authMiddleware, (req, res) => {
  const goals = [...userGoalMap(req.userId).values()];
  const active = goals.filter((x) => x.status === "active").length;
  const completed = goals.filter((x) => x.status === "completed").length;
  res.json({
    active,
    completed,
    streak: goals.length ? 7 : 0,
    mentorSessions: goals.length ? Math.min(12, goals.length * 2) : 0,
  });
});

app.post("/api/ai/clarify", authMiddleware, (req, res) => {
  const { goal_id } = req.body;
  const g = goal_id ? getGoal(req.userId, goal_id) : null;
  const topic = g?.title || "your goal";
  res.json({
    questions: [
      `What is your current experience level related to "${topic}"?`,
      "How many hours per week can you realistically invest?",
      "What would a clear win look like for you in the next 90 days?",
    ],
  });
});

app.post("/api/ai/analyze", authMiddleware, (req, res) => {
  const { goal_id, answers } = req.body;
  const g = goal_id ? getGoal(req.userId, goal_id) : null;
  if (g && Array.isArray(answers)) g.answers = answers;
  res.json({
    analysis: {
      strengths: ["Motivation to use a structured system", "Willingness to reflect and answer clarifying questions"],
      opportunities: ["Strong ecosystem of free learning resources", "Skills in this area stay in demand"],
      weaknesses: g ? [`Still shaping the plan for: ${g.title.slice(0, 50)}`] : ["Plan still being defined"],
      challenges: ["Consistency under busy weeks", "Avoiding perfectionism on early milestones"],
      ai_summary: `You are oriented toward "${g?.title || "your objective"}". Lean into small weekly deliverables while keeping the long-term picture visible.`,
    },
  });
});

app.post("/api/ai/paths", authMiddleware, (req, res) => {
  const { goal_id } = req.body;
  const g = goal_id ? getGoal(req.userId, goal_id) : null;
  const title = g?.title || "Your goal";
  res.json({
    paths: [
      {
        path_id: "path_fast",
        title: "Fast-track intensive",
        description: `A compressed sprint focused on rapid skill gains for "${title}".`,
        difficulty: "advanced",
        approach: "intensive",
        estimated_duration: "3–4 months",
        market_demand: 8,
        success_probability: 72,
      },
      {
        path_id: "path_steady",
        title: "Steady professional pace",
        description: "Sustainable weekly rhythm alongside work or study.",
        difficulty: "intermediate",
        approach: "balanced",
        estimated_duration: "6–9 months",
        market_demand: 9,
        success_probability: 81,
      },
      {
        path_id: "path_foundation",
        title: "Foundation-first",
        description: "Deep fundamentals before advanced projects.",
        difficulty: "beginner",
        approach: "methodical",
        estimated_duration: "12+ months",
        market_demand: 7,
        success_probability: 88,
      },
    ],
  });
});

function buildRoadmap(goalTitle, pathId) {
  const roadmapId = randomId();
  return {
    _id: roadmapId,
    overall_progress: 8,
    phases: [
      {
        phase_number: 1,
        title: "Discovery & foundation",
        duration: "4 weeks",
        milestones: [
          {
            milestone_id: "m1",
            title: `Define success metrics for: ${goalTitle.slice(0, 70)}`,
            type: "planning",
            status: "in_progress",
            resources: [
              {
                title: "SMART goals overview",
                url: "https://www.mindtools.com/a4wo118/smart-goals",
                platform: "Web",
                is_free: true,
              },
            ],
          },
          {
            milestone_id: "m2",
            title: "Complete one structured intro module or chapter",
            type: "learning",
            status: "pending",
            resources: [
              {
                title: "Open courses",
                url: "https://www.classcentral.com",
                platform: "Class Central",
                is_free: true,
              },
            ],
          },
        ],
      },
      {
        phase_number: 2,
        title: pathId === "path_fast" ? "Intensive build" : "Core skill development",
        duration: "8 weeks",
        milestones: [
          {
            milestone_id: "m3",
            title: "Ship one small practice deliverable",
            type: "project",
            status: "pending",
            resources: [],
          },
          {
            milestone_id: "m4",
            title: "Get feedback from a peer or mentor",
            type: "networking",
            status: "pending",
            resources: [],
          },
        ],
      },
    ],
  };
}

app.post("/api/ai/roadmap", authMiddleware, (req, res) => {
  const { goal_id, path_id } = req.body;
  const g = goal_id ? getGoal(req.userId, goal_id) : null;
  if (!g) return res.status(404).json({ message: "Goal not found" });
  const roadmap = buildRoadmap(g.title, path_id);
  g.roadmap = roadmap;
  g.selected_path_id = path_id;
  g.updated_at = new Date().toISOString();
  res.json({ roadmap });
});

app.post("/api/ai/mentor/chat", authMiddleware, (req, res) => {
  const { message, session_id } = req.body;
  const sid = session_id || randomId();
  const first = (req.user.name || "there").split(" ")[0];
  const lower = String(message || "").toLowerCase();
  let reply;
  if (lower.includes("stuck") || lower.includes("hard") || lower.includes("difficult")) {
    reply = `Hey ${first}, feeling stuck is normal.\n\nTry:\n1. **One 25-minute** micro-task only.\n2. **Write** one sentence on what feels blocked.\n3. **Open your goal** and mark anything you truly finished.\n\nWhich step feels easiest?`;
  } else if (lower.includes("week") || lower.includes("focus") || lower.includes("priorit")) {
    reply = `This week, ${first}, pick **one** theme and repeat it:\n\n- **60 minutes** deep work\n- **One** concrete output\n- **One** honest check-in: what moved?\n\nSmall reps beat big plans.`;
  } else {
    reply = `Hi ${first}.\n\nI can help with **priorities**, **habits**, and **next steps** for your goals on FocusOn.\n\nWhat is the single thing you want clarity on right now?`;
  }
  res.json({ reply, session_id: sid });
});

app.put("/api/roadmaps/:roadmapId/milestones/:milestoneId", authMiddleware, (req, res) => {
  const { roadmapId, milestoneId } = req.params;
  const { status } = req.body;
  let goal = null;
  for (const g of userGoalMap(req.userId).values()) {
    if (g.roadmap && g.roadmap._id === roadmapId) {
      goal = g;
      break;
    }
  }
  if (!goal) return res.status(404).json({ message: "Roadmap not found" });
  for (const phase of goal.roadmap.phases) {
    for (const m of phase.milestones) {
      if (m.milestone_id === milestoneId) {
        if (status) m.status = status;
        goal.updated_at = new Date().toISOString();
        return res.json({ message: "Updated", milestone: m });
      }
    }
  }
  return res.status(404).json({ message: "Milestone not found" });
});

app.listen(PORT, () => {
  console.log(`FocusOn API at http://localhost:${PORT}  (POST /api/auth/register, GET /api/health)`);
});
