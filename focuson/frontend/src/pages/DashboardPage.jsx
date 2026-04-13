/**
 * DashboardPage.jsx
 * Main hub showing:
 * - Greeting + streak
 * - Active goals summary
 * - Quick actions
 * - Progress chart
 * - Recent mentor activity
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target, Plus, MessageCircle, TrendingUp,
  Flame, CheckCircle2, Clock, ArrowRight, Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// Animation helper: stagger children
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Stat card component
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div variants={item} className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <p className="font-display text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

// Goal card component
function GoalCard({ goal }) {
  const statusColors = {
    active:    "bg-green-500",
    defining:  "bg-amber-500",
    analyzing: "bg-brand-500",
    paused:    "bg-gray-400",
  };

  return (
    <motion.div variants={item}>
      <Link to={`/goals/${goal._id}`} className="card-hover block p-5 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusColors[goal.status] || "bg-gray-400"}`} />
            <span className="badge badge-brand capitalize">{goal.category}</span>
          </div>
          <ArrowRight size={15} className="text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-200" />
        </div>
        <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{goal.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{goal.description}</p>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span className="font-medium text-brand-500">{goal.progress || 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${goal.progress || 0}%` }} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, streak: 0, mentorSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState("morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 17) setTimeOfDay("afternoon");
    else setTimeOfDay("evening");
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [goalsRes, statsRes] = await Promise.all([
          api.get("/goals?limit=3&status=active"),
          api.get("/dashboard/stats"),
        ]);
        setGoals(goalsRes.data.data || []);
        setStats(statsRes.data || stats);
      } catch {
        // Use mock data if API not ready
        setGoals([
          {
            _id: "1", title: "Become a Production AI Engineer",
            description: "Master LLMs, RAG, and agentic AI systems to land a senior role.",
            category: "career", status: "active", progress: 35,
          },
          {
            _id: "2", title: "Launch my SaaS Product",
            description: "Build and ship a revenue-generating SaaS within 6 months.",
            category: "startup", status: "defining", progress: 10,
          },
        ]);
        setStats({ active: 2, completed: 1, streak: 7, mentorSessions: 12 });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const greetings = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              {greetings[timeOfDay]}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Here's your goal progress at a glance.
            </p>
          </div>
          <Link to="/goals/new" className="btn-primary">
            <Plus size={16} />
            New Goal
          </Link>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Target}       label="Active Goals"     value={stats.active}         color="bg-brand-500"  />
          <StatCard icon={CheckCircle2} label="Completed"        value={stats.completed}       color="bg-green-500"  />
          <StatCard icon={Flame}        label="Day Streak"       value={`${stats.streak}d`}   color="bg-orange-500" />
          <StatCard icon={MessageCircle} label="Mentor Sessions" value={stats.mentorSessions}  color="bg-purple-500" />
        </div>

        {/* Main content: goals + quick actions */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Active goals (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title text-xl">Active Goals</h2>
              <Link to="/goals" className="text-sm text-brand-500 hover:underline">View all →</Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
              </div>
            ) : goals.length === 0 ? (
              <div className="card p-12 text-center">
                <Target size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="font-display font-semibold text-gray-700 dark:text-gray-300 mb-1">No goals yet</p>
                <p className="text-sm text-gray-400 mb-4">Set your first goal and let AI craft your path.</p>
                <Link to="/goals/new" className="btn-primary mx-auto">
                  <Plus size={15} /> Create a Goal
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {goals.map((g) => <GoalCard key={g._id} goal={g} />)}
              </div>
            )}
          </div>

          {/* Quick actions sidebar (1/3 width) */}
          <div className="space-y-4">
            <h2 className="section-title text-xl">Quick Actions</h2>

            <div className="space-y-3">
              {[
                {
                  to: "/mentor",
                  icon: Sparkles,
                  color: "bg-brand-500",
                  title: "Chat with AI Mentor",
                  desc: "Ask anything, get personalised guidance",
                },
                {
                  to: "/goals/new",
                  icon: Target,
                  color: "bg-green-500",
                  title: "Define a New Goal",
                  desc: "AI will help clarify and plan it",
                },
                {
                  to: "/progress",
                  icon: TrendingUp,
                  color: "bg-orange-500",
                  title: "Log Progress",
                  desc: "Track today's milestones",
                },
              ].map(({ to, icon: Icon, color, title, desc }) => (
                <Link key={to} to={to} className="card-hover flex items-center gap-4 p-4 group">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>

            {/* Streak motivator */}
            {stats.streak > 0 && (
              <div className="card p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={16} className="text-orange-500" />
                  <span className="font-display font-semibold text-sm text-orange-700 dark:text-orange-400">
                    {stats.streak}-Day Streak 🔥
                  </span>
                </div>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                  Keep going! Consistency is your superpower.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
