/**
 * GoalsPage.jsx — Lists all user goals
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Target, Filter } from "lucide-react";
import api from "../utils/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/goals").then(r => setGoals(r.data.data || [])).catch(() => {
      // Mock data while backend isn't ready
      setGoals([
        { _id: "1", title: "Become a Production AI Engineer", category: "career", status: "active", progress: 35 },
        { _id: "2", title: "Launch SaaS Product", category: "startup", status: "defining", progress: 10 },
        { _id: "3", title: "Master Arabic Language", category: "personal", status: "paused", progress: 60 },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const statuses = ["all", "active", "defining", "completed", "paused"];
  const filtered = filter === "all" ? goals : goals.filter(g => g.status === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title text-2xl">My Goals</h1>
          <p className="section-subtitle">Track and manage all your objectives</p>
        </div>
        <Link to="/goals/new" className="btn-primary"><Plus size={16} />New Goal</Link>
      </div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${filter === s ? "bg-brand-500 text-white" : "btn-secondary"}`}>{s}</button>
        ))}
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Target size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="font-display font-semibold text-gray-600 dark:text-gray-400 mb-4">No goals found</p>
          <Link to="/goals/new" className="btn-primary mx-auto"><Plus size={15} />Create a Goal</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((g, i) => (
            <motion.div key={g._id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}>
              <Link to={`/goals/${g._id}`} className="card-hover block p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-brand capitalize">{g.category}</span>
                  <span className={`badge ${g.status === 'active' ? 'badge-success' : 'badge-warning'} capitalize`}>{g.status}</span>
                </div>
                <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">{g.title}</h3>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${g.progress||0}%`}} /></div>
                <p className="text-xs text-brand-500 font-medium mt-1.5">{g.progress||0}% complete</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
